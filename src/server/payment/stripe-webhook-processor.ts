import "server-only";

import type Stripe from "stripe";

import { StripePaymentProvider } from "./stripe-adapter.ts";
import {
  isStripePaymentIntentStatus,
  MongoPaymentAttemptRepository,
} from "../repositories/mongo-payment-attempt-repository.ts";
import { MongoPaymentProviderEventRepository } from "../repositories/mongo-payment-provider-event-repository.ts";

export const STRIPE_SUPPORTED_PAYMENT_INTENT_EVENTS = new Set([
  "payment_intent.processing",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
]);

export class RetryableStripeWebhookError extends Error {
  constructor(code: string) {
    super(code);
    this.name = "RetryableStripeWebhookError";
  }
}

export type StripeWebhookProcessingResult =
  | "PROCESSED"
  | "VERIFIED_UNSUPPORTED"
  | "DUPLICATE"
  | "IN_FLIGHT"
  | "DEAD_LETTER";

function paymentIntentFromEvent(event: Stripe.Event): Stripe.PaymentIntent {
  const object = event.data.object;
  if (!object || typeof object !== "object" || !("id" in object) || typeof object.id !== "string") {
    throw new RetryableStripeWebhookError("stripe_payment_intent_missing");
  }
  return object as Stripe.PaymentIntent;
}

export async function processVerifiedStripeEvent(event: Stripe.Event): Promise<StripeWebhookProcessingResult> {
  const eventRepo = new MongoPaymentProviderEventRepository();
  const attemptRepo = new MongoPaymentAttemptRepository();
  const supported = STRIPE_SUPPORTED_PAYMENT_INTENT_EVENTS.has(event.type);
  const eventObject = supported ? paymentIntentFromEvent(event) : null;
  const received = await eventRepo.recordReceived({
    provider: "STRIPE",
    providerEventId: event.id,
    eventType: event.type,
    providerEventAt: new Date(event.created * 1000),
    verificationBoundary: "STRIPE_SIGNATURE",
    ...(eventObject ? { providerPaymentId: eventObject.id } : {}),
  });

  if (received.processingStatus === "PROCESSED" || received.processingStatus === "VERIFIED_UNSUPPORTED") {
    return "DUPLICATE";
  }

  if (!supported) {
    await eventRepo.markVerifiedUnsupported("STRIPE", event.id);
    return "VERIFIED_UNSUPPORTED";
  }

  if (!eventObject) throw new RetryableStripeWebhookError("stripe_payment_intent_missing");

  await eventRepo.recoverStaleProcessing("STRIPE", event.id);
  const claimed = await eventRepo.claimProcessing("STRIPE", event.id);
  if (!claimed) {
    const current = await eventRepo.find("STRIPE", event.id);
    return current?.processingStatus === "PROCESSING" ? "IN_FLIGHT" : "DUPLICATE";
  }

  try {
    const providerPayment = await new StripePaymentProvider().retrievePaymentAttempt(eventObject.id);
    if (!isStripePaymentIntentStatus(providerPayment.status)) {
      throw new RetryableStripeWebhookError("stripe_payment_intent_status_unsupported");
    }

    const attempt = await attemptRepo.findByProviderPaymentId("STRIPE", eventObject.id);
    if (!attempt) throw new RetryableStripeWebhookError("stripe_payment_attempt_missing");
    if (providerPayment.metadata.aura_payment_attempt_id && providerPayment.metadata.aura_payment_attempt_id !== attempt.paymentAttemptId) {
      throw new RetryableStripeWebhookError("stripe_payment_attempt_metadata_mismatch");
    }
    if (providerPayment.amountMinor !== attempt.amountMinor || providerPayment.currency !== attempt.currency) {
      throw new RetryableStripeWebhookError("stripe_payment_amount_or_currency_mismatch");
    }

    await eventRepo.setCorrelation({ provider: "STRIPE", providerEventId: event.id, paymentAttemptId: attempt.paymentAttemptId, providerPaymentId: eventObject.id });
    await attemptRepo.updateStripeProviderTruth({
      paymentAttemptId: attempt.paymentAttemptId,
      providerPaymentId: eventObject.id,
      providerPaymentStatus: providerPayment.status,
    });
    await eventRepo.markProcessed("STRIPE", event.id);
    return "PROCESSED";
  } catch (error) {
    try {
      const failed = await eventRepo.markRetryable("STRIPE", event.id, error instanceof RetryableStripeWebhookError ? error.message : "stripe_webhook_processing_failed");
      if (failed.processingStatus === "DEAD_LETTER") return "DEAD_LETTER";
    } catch {
      // Keep the original processing failure private; the provider will retry.
    }
    throw error;
  }
}
