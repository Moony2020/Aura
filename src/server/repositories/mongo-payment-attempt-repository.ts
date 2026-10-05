import "server-only";

import type { Collection, Filter } from "mongodb";
import { getMongoDb } from "@/server/db/mongodb";

export type PaymentAttemptProvider = "PAYPAL" | "STRIPE";
export type PaymentAttemptStatus = "PREPARING" | "PROVIDER_CREATED" | "PAYPAL_APPROVED" | "PAYPAL_CAPTURED" | "FAILED";
export type StripePaymentIntentStatus = "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "requires_capture" | "canceled" | "succeeded";
const STRIPE_PAYMENT_INTENT_STATUSES = new Set<StripePaymentIntentStatus>([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "processing",
  "requires_capture",
  "canceled",
  "succeeded",
]);

export function isStripePaymentIntentStatus(value: string): value is StripePaymentIntentStatus {
  return STRIPE_PAYMENT_INTENT_STATUSES.has(value as StripePaymentIntentStatus);
}

export type PaymentAttempt = {
  paymentAttemptId: string;
  provider: PaymentAttemptProvider;
  status: PaymentAttemptStatus;
  providerOrderId?: string;
  providerPaymentId?: string;
  providerPaymentStatus?: StripePaymentIntentStatus;
  providerPaymentStatusUpdatedAt?: Date;
  providerPaymentConfirmedAt?: Date;
  providerRequestId?: string;
  captureRequestId?: string;
  providerCaptureId?: string;
  providerCaptureStatus?: string;
  capturedAt?: Date;
  amountMinor: number;
  currency: "SEK";
  customId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentAttemptDocument = PaymentAttempt & { _id: string };

export class MongoPaymentAttemptRepository {
  private async collection(): Promise<Collection<PaymentAttemptDocument>> {
    const collection = (await getMongoDb()).collection<PaymentAttemptDocument>("paymentAttempts");
    await collection.createIndex(
      { provider: 1, providerPaymentId: 1 },
      {
        unique: true,
        partialFilterExpression: { provider: "STRIPE", providerPaymentId: { $type: "string" } },
        name: "payment_attempts_stripe_provider_payment_unique",
      },
    );
    return collection;
  }

  async prepare(input: Pick<PaymentAttempt, "paymentAttemptId" | "provider" | "amountMinor" | "currency" | "customId" | "providerRequestId">): Promise<PaymentAttempt> {
    const now = new Date();
    const result = await (await this.collection()).findOneAndUpdate(
      { _id: input.paymentAttemptId },
      { $setOnInsert: { _id: input.paymentAttemptId, ...input, status: "PREPARING", createdAt: now }, $set: { updatedAt: now } },
      { upsert: true, returnDocument: "after" },
    );
    if (!result) throw new Error("Payment attempt could not be prepared.");
    return result;
  }

  async markProviderCreated(paymentAttemptId: string, providerOrderId: string): Promise<PaymentAttempt> {
    const result = await (await this.collection()).findOneAndUpdate(
      { _id: paymentAttemptId, provider: "PAYPAL", customId: paymentAttemptId },
      { $set: { providerOrderId, status: "PROVIDER_CREATED", updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!result) throw new Error("Payment attempt was not found while storing the PayPal Order.");
    return result;
  }

  async find(paymentAttemptId: string): Promise<PaymentAttempt | null> {
    return (await this.collection()).findOne({ _id: paymentAttemptId });
  }

  async findByProviderPaymentId(provider: "STRIPE", providerPaymentId: string): Promise<PaymentAttempt | null> {
    return (await this.collection()).findOne({ provider, providerPaymentId });
  }

  async findByProviderOrderId(providerOrderId: string): Promise<PaymentAttempt | null> {
    return (await this.collection()).findOne({ provider: "PAYPAL", providerOrderId, customId: { $exists: true } });
  }

  async persistStripeProviderPayment(input: {
    paymentAttemptId: string;
    providerPaymentId: string;
    providerPaymentStatus: StripePaymentIntentStatus;
    confirmedAt?: Date;
  }): Promise<PaymentAttempt> {
    if (!isStripePaymentIntentStatus(input.providerPaymentStatus)) {
      throw new Error("Stripe PaymentIntent status is not supported.");
    }
    const now = new Date();
    const result = await (await this.collection()).findOneAndUpdate(
      { _id: input.paymentAttemptId, provider: "STRIPE", customId: input.paymentAttemptId },
      {
        $set: {
          providerPaymentId: input.providerPaymentId,
          providerPaymentStatus: input.providerPaymentStatus,
          providerPaymentStatusUpdatedAt: now,
          ...(input.confirmedAt ? { providerPaymentConfirmedAt: input.confirmedAt } : {}),
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );
    if (!result) throw new Error("Stripe payment attempt was not found while storing the PaymentIntent.");
    return result;
  }

  async updateStripeProviderTruth(input: {
    paymentAttemptId: string;
    providerPaymentId: string;
    providerPaymentStatus: StripePaymentIntentStatus;
    observedAt?: Date;
  }): Promise<PaymentAttempt | null> {
    if (!isStripePaymentIntentStatus(input.providerPaymentStatus)) {
      throw new Error("Stripe PaymentIntent status is not supported.");
    }
    const now = input.observedAt ?? new Date();
    const collection = await this.collection();
    const transitionFilter: Filter<PaymentAttemptDocument> = {
        _id: input.paymentAttemptId,
        provider: "STRIPE",
        providerPaymentId: input.providerPaymentId,
        $and: [
          { providerPaymentStatus: { $ne: input.providerPaymentStatus as StripePaymentIntentStatus } },
          ...(input.providerPaymentStatus === "succeeded" ? [] : [{ providerPaymentStatus: { $ne: "succeeded" } }]),
        ],
      } as Filter<PaymentAttemptDocument>;
    const result = await collection.findOneAndUpdate(
      transitionFilter,
      {
        $set: {
          providerPaymentStatus: input.providerPaymentStatus,
          providerPaymentStatusUpdatedAt: now,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
    if (!result) return collection.findOne({ _id: input.paymentAttemptId, provider: "STRIPE", providerPaymentId: input.providerPaymentId });
    if (input.providerPaymentStatus === "succeeded" && !result.providerPaymentConfirmedAt) {
      await collection.updateOne(
        { _id: input.paymentAttemptId, providerPaymentId: input.providerPaymentId, providerPaymentConfirmedAt: { $exists: false } },
        { $set: { providerPaymentConfirmedAt: now, updatedAt: new Date() } },
      );
    }
    return collection.findOne({ _id: input.paymentAttemptId });
  }

  async markPayPalApproved(paymentAttemptId: string): Promise<PaymentAttempt> {
    const result = await (await this.collection()).findOneAndUpdate(
      { _id: paymentAttemptId, provider: "PAYPAL", status: "PROVIDER_CREATED" },
      { $set: { status: "PAYPAL_APPROVED", updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!result) throw new Error("PayPal payment attempt is not eligible for approval.");
    return result;
  }

  async markPayPalCaptured(input: { paymentAttemptId: string; captureRequestId: string; captureId: string; captureStatus: string; capturedAt: Date }): Promise<PaymentAttempt> {
    const result = await (await this.collection()).findOneAndUpdate(
      { _id: input.paymentAttemptId, provider: "PAYPAL", status: "PAYPAL_APPROVED" },
      { $set: { status: "PAYPAL_CAPTURED", captureRequestId: input.captureRequestId, providerCaptureId: input.captureId, providerCaptureStatus: input.captureStatus, capturedAt: input.capturedAt, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!result) throw new Error("PayPal payment attempt is not eligible for capture.");
    return result;
  }

  async reconcilePayPalCaptured(input: { paymentAttemptId: string; captureId: string; captureStatus: string; capturedAt: Date }): Promise<PaymentAttempt | null> {
    const collection = await this.collection();
    const result = await collection.findOneAndUpdate(
      { _id: input.paymentAttemptId, provider: "PAYPAL", status: { $in: ["PAYPAL_APPROVED", "PAYPAL_CAPTURED"] } },
      { $set: { status: "PAYPAL_CAPTURED", providerCaptureId: input.captureId, providerCaptureStatus: input.captureStatus, capturedAt: input.capturedAt, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    return result ?? await collection.findOne({ _id: input.paymentAttemptId, provider: "PAYPAL" });
  }

  async markFailed(paymentAttemptId: string): Promise<PaymentAttempt> {
    const result = await (await this.collection()).findOneAndUpdate(
      { _id: paymentAttemptId, provider: "PAYPAL", status: "PAYPAL_APPROVED" },
      { $set: { status: "FAILED", updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!result) throw new Error("PayPal payment attempt is not eligible to fail.");
    return result;
  }
}
