import "server-only";

/**
 * Provider-neutral boundary for later payment-attempt implementations.
 * This file intentionally contains no SDK import or provider API call.
 */
export type PaymentProvider = "STRIPE" | "PAYPAL";

export type PaymentCurrency = "SEK";

export type PaymentAmount = {
  amountMinor: number;
  currency: PaymentCurrency;
};

export type PaymentAttemptInput = {
  attemptId: string;
  idempotencyKey: string;
  amount: PaymentAmount;
  metadata: Readonly<Record<string, string>>;
};

export type ProviderPaymentReference = {
  provider: PaymentProvider;
  providerPaymentId: string;
  status: string;
  amountMinor: number;
  currency: PaymentCurrency;
  metadata: Readonly<Record<string, string>>;
  /** Stripe-designated browser handoff value; never log or persist it. */
  clientSecret?: string;
};

export interface PaymentProviderBoundary {
  createPaymentAttempt(input: PaymentAttemptInput): Promise<ProviderPaymentReference>;
  retrievePaymentAttempt(providerPaymentId: string): Promise<ProviderPaymentReference>;
  updatePaymentAttempt(providerPaymentId: string, input: Pick<PaymentAttemptInput, "amount" | "metadata">): Promise<ProviderPaymentReference>;
}
