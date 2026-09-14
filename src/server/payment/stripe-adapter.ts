import "server-only";

import Stripe from "stripe";

import { requireServerEnv } from "../../config/env.server.ts";
import type {
  PaymentAttemptInput,
  PaymentProviderBoundary,
  ProviderPaymentReference,
} from "./provider-boundary.ts";

const ALLOWED_METADATA_KEYS = new Set([
  "aura_checkout_attempt_id",
  "aura_payment_attempt_id",
]);

function toMetadata(input: PaymentAttemptInput["metadata"]): Stripe.MetadataParam {
  const entries = Object.entries(input);
  if (entries.some(([key, value]) => !ALLOWED_METADATA_KEYS.has(key) || !value.trim())) {
    throw new Error("Stripe metadata contains an unsupported or empty key.");
  }
  return Object.fromEntries(entries) as Stripe.MetadataParam;
}

function toReference(intent: Stripe.PaymentIntent): ProviderPaymentReference {
  return {
    provider: "STRIPE",
    providerPaymentId: intent.id,
    status: intent.status,
    amountMinor: intent.amount,
    currency: intent.currency.toUpperCase() as "SEK",
    metadata: { ...intent.metadata },
    ...(intent.client_secret ? { clientSecret: intent.client_secret } : {}),
  };
}

export class StripePaymentProvider implements PaymentProviderBoundary {
  private readonly client: Stripe;

  constructor(client = new Stripe(requireServerEnv("STRIPE_SECRET_KEY"))) {
    this.client = client;
  }

  async createPaymentAttempt(input: PaymentAttemptInput): Promise<ProviderPaymentReference> {
    const intent = await this.client.paymentIntents.create(
      {
        amount: input.amount.amountMinor,
        currency: input.amount.currency.toLowerCase(),
        metadata: toMetadata(input.metadata),
      },
      { idempotencyKey: input.idempotencyKey },
    );
    return toReference(intent);
  }

  async retrievePaymentAttempt(providerPaymentId: string): Promise<ProviderPaymentReference> {
    return toReference(await this.client.paymentIntents.retrieve(providerPaymentId));
  }

  async updatePaymentAttempt(
    providerPaymentId: string,
    input: Pick<PaymentAttemptInput, "amount" | "metadata">,
  ): Promise<ProviderPaymentReference> {
    const intent = await this.client.paymentIntents.update(providerPaymentId, {
      amount: input.amount.amountMinor,
      currency: input.amount.currency.toLowerCase(),
      metadata: toMetadata(input.metadata),
    });
    return toReference(intent);
  }
}
