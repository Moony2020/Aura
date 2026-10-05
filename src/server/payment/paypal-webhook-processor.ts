import "server-only";

import type { PayPalOrder } from "./paypal-adapter.ts";
import { retrievePayPalSandboxOrder } from "./paypal-adapter.ts";
import { MongoPaymentAttemptRepository } from "../repositories/mongo-payment-attempt-repository.ts";
import { MongoPaymentProviderEventRepository } from "../repositories/mongo-payment-provider-event-repository.ts";

export const PAYPAL_SUPPORTED_WEBHOOK_EVENTS = new Set([
  "CHECKOUT.ORDER.APPROVED",
  "CHECKOUT.PAYMENT-APPROVAL.REVERSED",
  "PAYMENT.CAPTURE.PENDING",
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.DENIED",
]);

export class RetryablePayPalWebhookError extends Error {
  constructor(code: string) {
    super(code);
    this.name = "RetryablePayPalWebhookError";
  }
}

export type PayPalWebhookProcessingResult = "PROCESSED" | "VERIFIED_UNSUPPORTED" | "DUPLICATE" | "IN_FLIGHT" | "DEAD_LETTER";
type PayPalEvent = { id?: unknown; event_type?: unknown; create_time?: unknown; resource?: unknown };
type PayPalProcessorDependencies = {
  eventRepo?: MongoPaymentProviderEventRepository;
  attemptRepo?: MongoPaymentAttemptRepository;
  retrieveOrder?: typeof retrievePayPalSandboxOrder;
};

function requiredString(value: unknown, code: string): string {
  if (typeof value !== "string" || !value) throw new RetryablePayPalWebhookError(code);
  return value;
}

function eventOrderId(eventType: string, resource: Record<string, unknown>): string {
  if (eventType.startsWith("CHECKOUT.ORDER.")) return requiredString(resource.id, "paypal_order_id_missing");
  const related = resource.supplementary_data;
  const relatedIds = related && typeof related === "object" ? (related as Record<string, unknown>).related_ids : undefined;
  return requiredString(relatedIds && typeof relatedIds === "object" ? (relatedIds as Record<string, unknown>).order_id : undefined, "paypal_related_order_id_missing");
}

function captureId(eventType: string, resource: Record<string, unknown>): string | undefined {
  return eventType.startsWith("PAYMENT.CAPTURE.") ? requiredString(resource.id, "paypal_capture_id_missing") : undefined;
}

function eventCustomId(resource: Record<string, unknown>): string | undefined {
  if (typeof resource.custom_id === "string") return resource.custom_id;
  const units = resource.purchase_units;
  if (!Array.isArray(units)) return undefined;
  const customId = (units[0] as Record<string, unknown> | undefined)?.custom_id;
  return typeof customId === "string" ? customId : undefined;
}

function expectedAmount(order: PayPalOrder, attempt: { amountMinor: number; currency: string }): boolean {
  const unit = order.purchaseUnits[0];
  return Boolean(unit && unit.amount.currencyCode === attempt.currency && unit.amount.value === (attempt.amountMinor / 100).toFixed(2));
}

function trustedCapture(order: PayPalOrder, captureIdValue: string, expectedStatus: string) {
  return order.purchaseUnits.flatMap((unit) => unit.captures ?? []).find((capture) => capture.id === captureIdValue && capture.status === expectedStatus);
}

export async function processVerifiedPayPalEvent(event: PayPalEvent, dependencies: PayPalProcessorDependencies = {}): Promise<PayPalWebhookProcessingResult> {
  const eventId = requiredString(event.id, "paypal_event_id_missing");
  const eventType = requiredString(event.event_type, "paypal_event_type_missing");
  const eventRepo = dependencies.eventRepo ?? new MongoPaymentProviderEventRepository();
  const attemptRepo = dependencies.attemptRepo ?? new MongoPaymentAttemptRepository();
  const retrieveOrder = dependencies.retrieveOrder ?? retrievePayPalSandboxOrder;
  const resource = event.resource && typeof event.resource === "object" ? event.resource as Record<string, unknown> : null;
  const supported = PAYPAL_SUPPORTED_WEBHOOK_EVENTS.has(eventType);
  const orderId = supported && resource ? eventOrderId(eventType, resource) : undefined;
  const captureIdValue = supported && resource ? captureId(eventType, resource) : undefined;
  const received = await eventRepo.recordReceived({
    provider: "PAYPAL",
    providerEventId: eventId,
    eventType,
    verificationBoundary: "PAYPAL_WEBHOOK_VERIFICATION",
    ...(typeof event.create_time === "string" ? { providerEventAt: new Date(event.create_time) } : {}),
    ...(orderId ? { providerOrderId: orderId } : {}),
    ...(captureIdValue ? { providerCaptureId: captureIdValue } : {}),
  });
  if (received.processingStatus === "PROCESSED" || received.processingStatus === "VERIFIED_UNSUPPORTED") return "DUPLICATE";
  if (!supported) {
    await eventRepo.markVerifiedUnsupported("PAYPAL", eventId);
    return "VERIFIED_UNSUPPORTED";
  }

  await eventRepo.recoverStaleProcessing("PAYPAL", eventId);
  const claimed = await eventRepo.claimProcessing("PAYPAL", eventId);
  if (!claimed) {
    const current = await eventRepo.find("PAYPAL", eventId);
    return current?.processingStatus === "PROCESSING" ? "IN_FLIGHT" : "DUPLICATE";
  }

  try {
    const attempt = orderId ? await attemptRepo.findByProviderOrderId(orderId) : null;
    if (!attempt) throw new RetryablePayPalWebhookError("paypal_payment_attempt_missing");
    const order = await retrieveOrder(orderId!);
    if (order.id !== attempt.providerOrderId || order.intent !== "CAPTURE" || !expectedAmount(order, attempt)) throw new RetryablePayPalWebhookError("paypal_order_correlation_mismatch");
    const opaqueCustomId = resource ? eventCustomId(resource) : undefined;
    if (opaqueCustomId && opaqueCustomId !== attempt.customId) throw new RetryablePayPalWebhookError("paypal_custom_id_mismatch");
    await eventRepo.setCorrelation({ provider: "PAYPAL", providerEventId: eventId, paymentAttemptId: attempt.paymentAttemptId, providerOrderId: order.id, ...(captureIdValue ? { providerCaptureId: captureIdValue } : {}) });

    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      if (order.status === "APPROVED" && attempt.status === "PROVIDER_CREATED") await attemptRepo.markPayPalApproved(attempt.paymentAttemptId);
    } else if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      if (!captureIdValue || !trustedCapture(order, captureIdValue, "COMPLETED")) throw new RetryablePayPalWebhookError("paypal_capture_not_confirmed");
      await attemptRepo.reconcilePayPalCaptured({ paymentAttemptId: attempt.paymentAttemptId, captureId: captureIdValue, captureStatus: "COMPLETED", capturedAt: new Date() });
    }
    await eventRepo.markProcessed("PAYPAL", eventId);
    return "PROCESSED";
  } catch (error) {
    try {
      const failed = await eventRepo.markRetryable("PAYPAL", eventId, error instanceof RetryablePayPalWebhookError ? error.message : "paypal_webhook_processing_failed");
      if (failed.processingStatus === "DEAD_LETTER") return "DEAD_LETTER";
    } catch { /* provider redelivery remains the recovery boundary */ }
    throw error;
  }
}
