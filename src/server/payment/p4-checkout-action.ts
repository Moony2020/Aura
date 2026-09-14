"use server";

import { MongoInventoryRepository } from "@/server/repositories/mongo-order-inventory-repository";
import { PaymentPreparationService } from "./payment-preparation-service";
import { StripePaymentProvider } from "./stripe-adapter";

const P4_SYNTHETIC_VARIANT_ID = "00000000-0000-4000-8000-000000005500";
const P4_SYNTHETIC_SKU = "AURA-P4-STRIPE-TEST";

export type P4CheckoutActionResult =
  | { ok: true; clientSecret: string }
  | { ok: false; message: string };

/**
 * P4-only local verification boundary. It is deliberately unavailable in
 * production and uses a synthetic inventory variant, never a catalog item.
 */
export async function prepareP4CheckoutPayment(): Promise<P4CheckoutActionResult> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, message: "Secure payment preparation is unavailable." };
  }

  try {
    const inventory = new MongoInventoryRepository();
    const existing = await inventory.getByVariantId(P4_SYNTHETIC_VARIANT_ID);
    if (!existing) {
      await inventory.create({
        variantId: P4_SYNTHETIC_VARIANT_ID,
        sku: P4_SYNTHETIC_SKU,
        available: 1,
        reserved: 0,
        committed: 0,
      });
    }

    const attemptId = `p4-checkout-${P4_SYNTHETIC_VARIANT_ID}`;
    const prepared = await new PaymentPreparationService(inventory, new StripePaymentProvider()).prepare({
      attemptId,
      idempotencyKey: attemptId,
      lines: [{ variantId: P4_SYNTHETIC_VARIANT_ID, quantity: 1 }],
      amountMinor: 1000,
      metadata: {
        aura_checkout_attempt_id: attemptId,
        aura_payment_attempt_id: attemptId,
      },
    });

    if (!prepared.providerPayment.clientSecret) {
      throw new Error("Stripe did not return a client secret.");
    }

    return { ok: true, clientSecret: prepared.providerPayment.clientSecret };
  } catch {
    return { ok: false, message: "Secure payment preparation is unavailable." };
  }
}
