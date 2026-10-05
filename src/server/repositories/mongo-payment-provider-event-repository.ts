import "server-only";

import type { Collection, Db } from "mongodb";
import { getMongoDb } from "../db/mongodb.ts";

export type ProviderEventProvider = "STRIPE" | "PAYPAL";
export type ProviderEventStatus =
  | "RECEIVED"
  | "PROCESSING"
  | "PROCESSED"
  | "RETRYABLE"
  | "DEAD_LETTER"
  | "VERIFIED_UNSUPPORTED";

export type PaymentProviderEvent = {
  provider: ProviderEventProvider;
  providerEventId: string;
  eventType: string;
  providerEventAt?: Date;
  receivedAt: Date;
  verificationBoundary: "STRIPE_SIGNATURE" | "PAYPAL_WEBHOOK_VERIFICATION";
  processingStatus: ProviderEventStatus;
  retryCount: number;
  lastErrorCode?: string;
  paymentAttemptId?: string;
  providerPaymentId?: string;
  providerOrderId?: string;
  providerCaptureId?: string;
  processedAt?: Date;
  expiresAt?: Date;
  processingClaimedAt?: Date;
  processingClaimId?: string;
};

type PaymentProviderEventDocument = PaymentProviderEvent & { _id: string };

export const PAYMENT_PROVIDER_EVENTS_COLLECTION = "paymentProviderEvents";
export const PAYMENT_PROVIDER_EVENTS_RETENTION_DAYS = 180;
export const PAYMENT_PROVIDER_EVENTS_MAX_RETRIES = 8;

export function finalizedEventExpiry(finalizedAt: Date): Date {
  return new Date(finalizedAt.getTime() + PAYMENT_PROVIDER_EVENTS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

export async function ensurePaymentProviderEventsCollection(db: Db): Promise<Collection<PaymentProviderEventDocument>> {
  const validator = {
    $jsonSchema: {
      bsonType: "object",
      additionalProperties: false,
      required: ["provider", "providerEventId", "eventType", "receivedAt", "verificationBoundary", "processingStatus", "retryCount"],
      properties: {
        _id: { bsonType: "string" },
        provider: { enum: ["STRIPE", "PAYPAL"] },
        providerEventId: { bsonType: "string", minLength: 1, maxLength: 256 },
        eventType: { bsonType: "string", minLength: 1, maxLength: 200 },
        providerEventAt: { bsonType: "date" },
        receivedAt: { bsonType: "date" },
        verificationBoundary: { enum: ["STRIPE_SIGNATURE", "PAYPAL_WEBHOOK_VERIFICATION"] },
        processingStatus: { enum: ["RECEIVED", "PROCESSING", "PROCESSED", "RETRYABLE", "DEAD_LETTER", "VERIFIED_UNSUPPORTED"] },
        retryCount: { bsonType: "int", minimum: 0, maximum: PAYMENT_PROVIDER_EVENTS_MAX_RETRIES },
        lastErrorCode: { bsonType: "string", minLength: 1, maxLength: 120 },
        paymentAttemptId: { bsonType: "string", minLength: 1, maxLength: 200 },
        providerPaymentId: { bsonType: "string", minLength: 1, maxLength: 200 },
        providerOrderId: { bsonType: "string", minLength: 1, maxLength: 200 },
        providerCaptureId: { bsonType: "string", minLength: 1, maxLength: 200 },
        processedAt: { bsonType: "date" },
        expiresAt: { bsonType: "date" },
        processingClaimedAt: { bsonType: "date" },
        processingClaimId: { bsonType: "string", minLength: 1, maxLength: 120 },
      },
    },
  };

  const existing = await db.listCollections({ name: PAYMENT_PROVIDER_EVENTS_COLLECTION }).toArray();
  if (!existing.length) {
    await db.createCollection(PAYMENT_PROVIDER_EVENTS_COLLECTION, { validator, validationLevel: "strict", validationAction: "error" });
  } else {
    await db.command({ collMod: PAYMENT_PROVIDER_EVENTS_COLLECTION, validator, validationLevel: "strict", validationAction: "error" });
  }

  const collection = db.collection<PaymentProviderEventDocument>(PAYMENT_PROVIDER_EVENTS_COLLECTION);
  await collection.createIndex({ provider: 1, providerEventId: 1 }, { unique: true, name: "payment_provider_events_provider_event_unique" });
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "payment_provider_events_finalized_expiry" });
  await collection.createIndex({ processingStatus: 1, receivedAt: 1 }, { name: "payment_provider_events_processing_status" });
  return collection;
}

export class MongoPaymentProviderEventRepository {
  private async collection() {
    return ensurePaymentProviderEventsCollection(await getMongoDb());
  }

  async recordReceived(input: Omit<PaymentProviderEvent, "processingStatus" | "retryCount" | "receivedAt"> & { receivedAt?: Date }): Promise<PaymentProviderEvent> {
    const document: PaymentProviderEventDocument = {
      _id: `${input.provider}:${input.providerEventId}`,
      ...input,
      receivedAt: input.receivedAt ?? new Date(),
      processingStatus: "RECEIVED",
      retryCount: 0,
    };
    const collection = await this.collection();
    try {
      await collection.insertOne(document);
      return document;
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const existing = await collection.findOne({ provider: input.provider, providerEventId: input.providerEventId });
      if (!existing) throw new Error("Provider event duplicate could not be resolved.");
      return existing;
    }
  }

  async find(provider: ProviderEventProvider, providerEventId: string): Promise<PaymentProviderEvent | null> {
    return (await this.collection()).findOne({ provider, providerEventId });
  }

  async claimProcessing(provider: ProviderEventProvider, providerEventId: string, now = new Date()): Promise<PaymentProviderEvent | null> {
    return (await this.collection()).findOneAndUpdate(
      { provider, providerEventId, processingStatus: { $in: ["RECEIVED", "RETRYABLE"] } },
      { $inc: { retryCount: 1 }, $set: { processingStatus: "PROCESSING", processingClaimedAt: now, processingClaimId: `${provider}:${providerEventId}:${now.getTime()}` } },
      { returnDocument: "after" },
    );
  }

  async recoverStaleProcessing(provider: ProviderEventProvider, providerEventId: string, now = new Date(), leaseMs = 60_000): Promise<boolean> {
    const staleBefore = new Date(now.getTime() - leaseMs);
    const result = await (await this.collection()).findOneAndUpdate(
      { provider, providerEventId, processingStatus: "PROCESSING", processingClaimedAt: { $lt: staleBefore } },
      { $set: { processingStatus: "RETRYABLE", lastErrorCode: "PROCESSING_LEASE_EXPIRED" }, $unset: { processingClaimedAt: "", processingClaimId: "" } },
      { returnDocument: "after" },
    );
    return Boolean(result);
  }

  async setCorrelation(input: {
    provider: ProviderEventProvider;
    providerEventId: string;
    paymentAttemptId: string;
    providerPaymentId?: string;
    providerOrderId?: string;
    providerCaptureId?: string;
  }): Promise<PaymentProviderEvent> {
    const result = await (await this.collection()).findOneAndUpdate(
      { provider: input.provider, providerEventId: input.providerEventId, processingStatus: "PROCESSING" },
      {
        $set: {
          paymentAttemptId: input.paymentAttemptId,
          ...(input.providerPaymentId ? { providerPaymentId: input.providerPaymentId } : {}),
          ...(input.providerOrderId ? { providerOrderId: input.providerOrderId } : {}),
          ...(input.providerCaptureId ? { providerCaptureId: input.providerCaptureId } : {}),
        },
      },
      { returnDocument: "after" },
    );
    if (!result) throw new Error("Provider event correlation could not be persisted.");
    return result;
  }

  async markProcessed(provider: ProviderEventProvider, providerEventId: string, now = new Date()): Promise<PaymentProviderEvent> {
    return this.finalize(provider, providerEventId, "PROCESSED", now);
  }

  async markVerifiedUnsupported(provider: ProviderEventProvider, providerEventId: string, now = new Date()): Promise<PaymentProviderEvent> {
    return this.finalize(provider, providerEventId, "VERIFIED_UNSUPPORTED", now);
  }

  async markRetryable(provider: ProviderEventProvider, providerEventId: string, errorCode: string): Promise<PaymentProviderEvent> {
    const result = await (await this.collection()).findOneAndUpdate(
      { provider, providerEventId, processingStatus: "PROCESSING" },
      [
        { $set: { processingStatus: { $cond: [{ $gte: ["$retryCount", PAYMENT_PROVIDER_EVENTS_MAX_RETRIES] }, "DEAD_LETTER", "RETRYABLE"] }, lastErrorCode: errorCode.slice(0, 120), processingClaimedAt: "$$REMOVE", processingClaimId: "$$REMOVE", expiresAt: "$$REMOVE" } },
      ],
      { returnDocument: "after" },
    );
    if (!result) throw new Error("Provider event is not eligible for retry.");
    return result;
  }

  async markDeadLetter(provider: ProviderEventProvider, providerEventId: string, errorCode: string): Promise<PaymentProviderEvent> {
    const result = await (await this.collection()).findOneAndUpdate(
      { provider, providerEventId, processingStatus: { $nin: ["PROCESSED", "VERIFIED_UNSUPPORTED"] } },
      { $set: { processingStatus: "DEAD_LETTER", lastErrorCode: errorCode.slice(0, 120) } },
      { returnDocument: "after" },
    );
    if (!result) throw new Error("Provider event is not eligible for dead-lettering.");
    return result;
  }

  private async finalize(provider: ProviderEventProvider, providerEventId: string, processingStatus: "PROCESSED" | "VERIFIED_UNSUPPORTED", now: Date) {
    const result = await (await this.collection()).findOneAndUpdate(
      { provider, providerEventId, processingStatus: { $nin: ["DEAD_LETTER"] } },
      { $set: { processingStatus, processedAt: now, expiresAt: finalizedEventExpiry(now) }, $unset: { processingClaimedAt: "", processingClaimId: "", lastErrorCode: "" } },
      { returnDocument: "after" },
    );
    if (!result) throw new Error("Provider event could not be finalized.");
    return result;
  }
}
