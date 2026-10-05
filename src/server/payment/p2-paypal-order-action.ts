"use server";

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { GUEST_CART_COOKIE_NAME, hashGuestCartToken } from "@/server/cart/guest-cart-token";
import { createCartService } from "@/server/cart/cart-service";
import { MongoInventoryRepository } from "@/server/repositories/mongo-order-inventory-repository";
import { MongoPaymentAttemptRepository } from "@/server/repositories/mongo-payment-attempt-repository";
import { PayPalAuthenticationError, PayPalCaptureError, PayPalConfigurationError, PayPalOrderCreationError, capturePayPalSandboxOrder, createPayPalSandboxOrder, getPayPalBrowserClientId, retrievePayPalSandboxOrder, type PayPalShippingDetails } from "./paypal-adapter";

const FREE_SHIPPING_THRESHOLD_MINOR = 79900;
const STANDARD_DELIVERY_MINOR = 5900;
const RESERVATION_TTL_MS = 15 * 60 * 1000;

export type P2PayPalResult =
  | { ok: true; orderId: string; paymentAttemptId: string; expiresAt: string }
  | { ok: false; message: string };

export type P2PayPalApprovalResult =
  | { ok: true; message: "PayPal approval received. Payment has not been captured yet." }
  | { ok: false; message: string };

export type P3PayPalCaptureResult =
  | { ok: true; message: "PayPal payment captured successfully. Order finalization has not been completed yet." }
  | { ok: false; message: string };

const checkoutDetailsSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  addressLine1: z.string().trim().min(3).max(240),
  addressLine2: z.string().trim().max(240).optional(),
  city: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().min(3).max(24),
  countryCode: z.literal("SE"),
}).strict();
export type P2CheckoutDetails = z.infer<typeof checkoutDetailsSchema>;

function safePreparationMessage(error: unknown): string {
  if (error instanceof z.ZodError) return "Complete the required contact and Swedish delivery details before choosing PayPal.";
  if (error instanceof PayPalConfigurationError) return "PayPal Sandbox configuration is unavailable.";
  if (error instanceof PayPalAuthenticationError) return "PayPal Sandbox authentication failed.";
  if (error instanceof PayPalOrderCreationError) return `PayPal Sandbox order creation failed (HTTP ${error.status}).`;
  if (error instanceof PayPalCaptureError) return error.status ? `PayPal Sandbox capture failed (HTTP ${error.status}).` : "PayPal Sandbox capture failed.";
  if (error instanceof Error && error.message === "PayPal Sandbox inventory lookup failed.") return error.message;
  if (error instanceof Error && error.message === "PayPal Sandbox inventory reservation failed.") return error.message;
  if (error instanceof Error && error.message === "Cart is not eligible.") return "The current cart is not eligible for PayPal Sandbox.";
  if (error instanceof Error && error.message === "Insufficient inventory or unknown variant.") return "PayPal Sandbox inventory reservation failed.";
  if (error instanceof Error && error.message === "PayPal payment attempt reservation is inconsistent.") return "The PayPal payment attempt no longer matches the current cart. Refresh the checkout and try again.";
  if (error instanceof Error && error.message === "PayPal Sandbox returned an invalid order.") return "PayPal Sandbox returned an invalid order response.";
  return "PayPal Sandbox preparation failed.";
}

export async function getP2PayPalClientId(): Promise<{ ok: true; clientId: string } | { ok: false; message: string }> {
  try { return { ok: true, clientId: getPayPalBrowserClientId() }; } catch { return { ok: false, message: "PayPal Sandbox is unavailable." }; }
}

export async function prepareP2PayPalOrder(input: P2CheckoutDetails): Promise<P2PayPalResult> {
  if (process.env.NODE_ENV === "production") return { ok: false, message: "PayPal Sandbox preparation is unavailable." };
  try {
    const details = checkoutDetailsSchema.parse(input);
    const cookieStore = await cookies();
    const guestToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null;
    const cart = await createCartService().readCurrentCart({ kind: "GUEST", guestToken });
    if (!guestToken || !cart.items.length || !cart.checkoutEligible || cart.currency !== "SEK") throw new Error("Cart is not eligible.");
    const shippingMinor = cart.subtotal.amount >= FREE_SHIPPING_THRESHOLD_MINOR ? 0 : STANDARD_DELIVERY_MINOR;
    const amountMinor = cart.subtotal.amount + shippingMinor;
    const basePaymentAttemptId = `p2-paypal-${hashGuestCartToken(guestToken).slice(0, 24)}-v${cart.version}`;
    const attempts = new MongoPaymentAttemptRepository();
    let paymentAttemptId = basePaymentAttemptId;
    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);
    const inventory = new MongoInventoryRepository();
    const reservations: string[] = [];
    try {
      let existing: Awaited<ReturnType<MongoInventoryRepository["findActiveByOrderId"]>>;
      try {
        existing = await inventory.findActiveByOrderId(paymentAttemptId);
      } catch {
        throw new Error("PayPal Sandbox inventory lookup failed.");
      }
      const knownAttempt = await attempts.find(basePaymentAttemptId);
      const existingMatches = existing.length === cart.items.length && existing.every((reservation) => cart.items.some((item) => item.variantId === reservation.variantId && item.quantity === reservation.quantity) && reservation.expiresAt > new Date());
      if (knownAttempt?.providerOrderId && existing.length && existing.every((reservation) => reservation.expiresAt <= new Date())) {
        await Promise.all(existing.map((reservation) => inventory.release(reservation.id)));
        existing = [];
      }
      if (knownAttempt?.providerOrderId && !existingMatches) paymentAttemptId = `${basePaymentAttemptId}-recovery-${randomUUID()}`;
      if (existing.length && !existingMatches) throw new Error("PayPal payment attempt reservation is inconsistent.");
      if (!existingMatches) {
        for (const item of cart.items) {
          try {
            reservations.push((await inventory.reserve(item.variantId, item.quantity, expiresAt, paymentAttemptId)).id);
          } catch {
            throw new Error("PayPal Sandbox inventory reservation failed.");
          }
        }
      }
      const attempt = await attempts.prepare({ paymentAttemptId, provider: "PAYPAL", amountMinor, currency: "SEK", customId: paymentAttemptId, providerRequestId: paymentAttemptId });
      if (attempt.providerOrderId) return { ok: true, orderId: attempt.providerOrderId, paymentAttemptId, expiresAt: (existingMatches ? existing[0].expiresAt : expiresAt).toISOString() };
      const order = await createPayPalSandboxOrder({ amountMinor, paymentAttemptId, requestId: paymentAttemptId, shipping: { fullName: `${details.firstName} ${details.lastName}`.trim(), addressLine1: details.addressLine1, addressLine2: details.addressLine2, city: details.city, postalCode: details.postalCode, countryCode: details.countryCode } });
      await attempts.markProviderCreated(paymentAttemptId, order.id);
      return { ok: true, orderId: order.id, paymentAttemptId, expiresAt: (existingMatches ? existing[0].expiresAt : expiresAt).toISOString() };
    } catch (error) {
      await Promise.allSettled(reservations.map((id) => inventory.release(id)));
      throw error;
    }
  } catch (error) {
    if (!(error instanceof PayPalConfigurationError) && !(error instanceof PayPalAuthenticationError) && !(error instanceof PayPalOrderCreationError)) {
      console.error("[P2 PayPal preparation]", error instanceof Error ? error.message : "Unknown preparation error");
    }
    return { ok: false, message: safePreparationMessage(error) };
  }
}

export async function verifyP2PayPalApproval(input: { paymentAttemptId: string; providerOrderId: string }): Promise<P2PayPalApprovalResult> {
  if (process.env.NODE_ENV === "production") return { ok: false, message: "PayPal Sandbox approval verification is unavailable." };
  try {
    const attempt = await new MongoPaymentAttemptRepository().find(input.paymentAttemptId);
    if (!attempt?.providerOrderId || attempt.providerOrderId !== input.providerOrderId) throw new Error("PayPal approval does not match the canonical payment attempt.");
    const cart = await createCartService().readCurrentCart({ kind: "GUEST", guestToken: (await cookies()).get(GUEST_CART_COOKIE_NAME)?.value ?? null });
    const shippingMinor = cart.subtotal.amount >= FREE_SHIPPING_THRESHOLD_MINOR ? 0 : STANDARD_DELIVERY_MINOR;
    const trusted = await retrievePayPalSandboxOrder(attempt.providerOrderId);
    const expectedAmount = ((cart.subtotal.amount + shippingMinor) / 100).toFixed(2);
    const unit = trusted.purchaseUnits[0];
    if (trusted.status !== "APPROVED" || trusted.intent !== "CAPTURE" || trusted.purchaseUnits.length !== 1 || unit.customId !== attempt.customId || unit.amount.currencyCode !== "SEK" || unit.amount.value !== expectedAmount) throw new Error("PayPal Sandbox approval could not be verified.");
    await new MongoPaymentAttemptRepository().markPayPalApproved(attempt.paymentAttemptId);
    return { ok: true, message: "PayPal approval received. Payment has not been captured yet." };
  } catch (error) {
    console.error("[P2 PayPal approval verification]", error instanceof Error ? error.message : "Unknown verification error");
    return { ok: false, message: "PayPal approval could not be verified server-side." };
  }
}

export async function captureP3PayPalPayment(input: { paymentAttemptId: string }): Promise<P3PayPalCaptureResult> {
  if (process.env.NODE_ENV === "production") return { ok: false, message: "PayPal Sandbox capture is unavailable." };
  const attempts = new MongoPaymentAttemptRepository();
  const inventory = new MongoInventoryRepository();
  const captureRequestId = `p3-paypal-capture-${input.paymentAttemptId}`;
  const releaseActiveReservations = async () => {
    const reservations = await inventory.findActiveByOrderId(input.paymentAttemptId);
    await Promise.allSettled(reservations.map((reservation) => inventory.release(reservation.id)));
  };
  const persistRetrievedCapture = async (attempt: Awaited<ReturnType<MongoPaymentAttemptRepository["find"]>> extends infer T ? Exclude<T, null> : never, order: Awaited<ReturnType<typeof retrievePayPalSandboxOrder>>) => {
    const capture = order.purchaseUnits[0]?.captures?.find((entry) => entry.status === "COMPLETED");
    if (!capture || order.id !== attempt.providerOrderId || order.status !== "COMPLETED") return false;
    await attempts.markPayPalCaptured({ paymentAttemptId: attempt.paymentAttemptId, captureRequestId, captureId: capture.id, captureStatus: capture.status, capturedAt: new Date() });
    return true;
  };
  try {
    const attempt = await attempts.find(input.paymentAttemptId);
    if (!attempt || attempt.provider !== "PAYPAL" || !attempt.providerOrderId || attempt.currency !== "SEK") throw new Error("PayPal P3 canonical attempt precondition failed.");
    if (attempt.status === "PAYPAL_CAPTURED") return { ok: true, message: "PayPal payment captured successfully. Order finalization has not been completed yet." };
    if (attempt.status !== "PAYPAL_APPROVED") throw new Error("PayPal P3 approved precondition failed.");
    const cart = await createCartService().readCurrentCart({ kind: "GUEST", guestToken: (await cookies()).get(GUEST_CART_COOKIE_NAME)?.value ?? null });
    const shippingMinor = cart.subtotal.amount >= FREE_SHIPPING_THRESHOLD_MINOR ? 0 : STANDARD_DELIVERY_MINOR;
    const expectedAmount = ((cart.subtotal.amount + shippingMinor) / 100).toFixed(2);
    const trusted = await retrievePayPalSandboxOrder(attempt.providerOrderId);
    const unit = trusted.purchaseUnits[0];
    if (trusted.id !== attempt.providerOrderId || trusted.status !== "APPROVED" || trusted.intent !== "CAPTURE" || trusted.purchaseUnits.length !== 1 || unit.customId !== attempt.customId || unit.amount.currencyCode !== "SEK" || unit.amount.value !== expectedAmount) throw new Error("PayPal P3 provider order precondition failed.");
    const reservations = await inventory.findActiveByOrderId(attempt.paymentAttemptId);
    if (reservations.length !== cart.items.length || reservations.some((reservation) => reservation.expiresAt <= new Date() || !cart.items.some((item) => item.variantId === reservation.variantId && item.quantity === reservation.quantity))) throw new Error("PayPal P3 reservation precondition failed.");
    let captured;
    try {
      captured = await capturePayPalSandboxOrder({ orderId: attempt.providerOrderId, requestId: captureRequestId });
    } catch (error) {
      if (!(error instanceof PayPalCaptureError)) throw error;
      let observed;
      try { observed = await retrievePayPalSandboxOrder(attempt.providerOrderId); } catch { return { ok: false, message: "PayPal Sandbox capture status is ambiguous. Do not retry yet." }; }
      if (await persistRetrievedCapture(attempt, observed)) return { ok: true, message: "PayPal payment captured successfully. Order finalization has not been completed yet." };
      if ((error.status === 0 || error.status >= 500) && observed.status === "APPROVED") {
        captured = await capturePayPalSandboxOrder({ orderId: attempt.providerOrderId, requestId: captureRequestId });
      } else if (observed.status === "APPROVED") {
        await releaseActiveReservations();
        await attempts.markFailed(attempt.paymentAttemptId);
        throw error;
      } else {
        return { ok: false, message: "PayPal Sandbox capture status is ambiguous. Do not retry yet." };
      }
    }
    if (captured.orderId !== attempt.providerOrderId || captured.status !== "COMPLETED" || captured.amount.currencyCode !== "SEK" || captured.amount.value !== expectedAmount) throw new Error("PayPal Sandbox capture evidence failed.");
    const afterCapture = await retrievePayPalSandboxOrder(attempt.providerOrderId);
    if (afterCapture.status !== "COMPLETED" || afterCapture.id !== attempt.providerOrderId) throw new Error("PayPal Sandbox capture retrieval failed.");
    await attempts.markPayPalCaptured({ paymentAttemptId: attempt.paymentAttemptId, captureRequestId, captureId: captured.captureId, captureStatus: captured.status, capturedAt: new Date() });
    return { ok: true, message: "PayPal payment captured successfully. Order finalization has not been completed yet." };
  } catch (error) {
    console.error("[P3 PayPal capture]", error instanceof Error ? error.message : "Unknown capture error");
    return { ok: false, message: safePreparationMessage(error) };
  }
}
