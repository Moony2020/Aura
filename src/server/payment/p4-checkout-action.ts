"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { GUEST_CART_COOKIE_NAME, hashGuestCartToken } from "@/server/cart/guest-cart-token";
import { createCartService } from "@/server/cart/cart-service";
import { MongoInventoryRepository } from "@/server/repositories/mongo-order-inventory-repository";
import { isStripePaymentIntentStatus, MongoPaymentAttemptRepository } from "@/server/repositories/mongo-payment-attempt-repository";
import { PaymentPreparationService } from "./payment-preparation-service";
import { StripePaymentProvider } from "./stripe-adapter";

const FREE_SHIPPING_THRESHOLD_MINOR = 79900;
const STANDARD_DELIVERY_MINOR = 5900;
const CHECKOUT_CURRENCY = "SEK" as const;

export type P4CheckoutActionResult =
  | { ok: true; clientSecret: string }
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
export type P4CheckoutDetails = z.infer<typeof checkoutDetailsSchema>;

/**
 * Shared server-authoritative preparation boundary for cards and future
 * Express Checkout confirmation. The caller supplies checkout details only;
 * Cart, amount, shipping, inventory, and Stripe idempotency remain server
 * derived. Wallet confirmation and settlement are intentionally outside this
 * function.
 */
export async function prepareStripeCheckoutPayment(input: P4CheckoutDetails): Promise<P4CheckoutActionResult> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, message: "Secure payment preparation is unavailable." };
  }

  try {
    checkoutDetailsSchema.parse(input);
    const cookieStore = await cookies();
    const guestToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null;
    const cart = await createCartService().readCurrentCart({ kind: "GUEST", guestToken });

    if (!cart.items.length || !cart.checkoutEligible || cart.currency !== CHECKOUT_CURRENCY) {
      throw new Error("Checkout cart is not eligible for payment preparation.");
    }

    const shippingMinor = cart.subtotal.amount >= FREE_SHIPPING_THRESHOLD_MINOR
      ? 0
      : STANDARD_DELIVERY_MINOR;
    const amountMinor = cart.subtotal.amount + shippingMinor;
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
      throw new Error("Checkout amount is invalid.");
    }

    const inventory = new MongoInventoryRepository();
    const attempts = new MongoPaymentAttemptRepository();
    const attemptSeed = guestToken ? hashGuestCartToken(guestToken) : `cart-v${cart.version}`;
    const attemptId = `p4-checkout-${attemptSeed.slice(0, 24)}-v${cart.version}`;
    await attempts.prepare({ paymentAttemptId: attemptId, provider: "STRIPE", amountMinor, currency: "SEK", customId: attemptId, providerRequestId: attemptId });
    const prepared = await new PaymentPreparationService(inventory, new StripePaymentProvider()).prepare({
      attemptId,
      idempotencyKey: attemptId,
      lines: cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      amountMinor,
      reservationOwnerId: attemptId,
      metadata: {
        aura_checkout_attempt_id: attemptId,
        aura_payment_attempt_id: attemptId,
      },
    });

    if (!isStripePaymentIntentStatus(prepared.providerPayment.status)) {
      throw new Error("Stripe returned an unsupported PaymentIntent status.");
    }

    await attempts.persistStripeProviderPayment({
      paymentAttemptId: attemptId,
      providerPaymentId: prepared.providerPayment.providerPaymentId,
      providerPaymentStatus: prepared.providerPayment.status,
    });

    if (!prepared.providerPayment.clientSecret) {
      throw new Error("Stripe did not return a client secret.");
    }

    return { ok: true, clientSecret: prepared.providerPayment.clientSecret };
  } catch {
    return { ok: false, message: "Secure payment preparation is unavailable." };
  }
}

/**
 * P4-only local verification boundary. It is deliberately unavailable in
 * production and prepares payment from the canonical guest Cart and its real
 * catalog variants.
 */
export async function prepareP4CheckoutPayment(input: P4CheckoutDetails): Promise<P4CheckoutActionResult> {
  return prepareStripeCheckoutPayment(input);
}
