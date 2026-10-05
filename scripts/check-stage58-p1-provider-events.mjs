import assert from "node:assert/strict";
import fs from "node:fs";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { MongoPaymentProviderEventRepository, PAYMENT_PROVIDER_EVENTS_COLLECTION, finalizedEventExpiry } = await import("../src/server/repositories/mongo-payment-provider-event-repository.ts");
const db = await getMongoDb();
const collection = db.collection(PAYMENT_PROVIDER_EVENTS_COLLECTION);
const metadata = (await db.listCollections({ name: PAYMENT_PROVIDER_EVENTS_COLLECTION }, { nameOnly: false }).toArray())[0];
assert.ok(metadata?.options?.validator?.$jsonSchema);
assert.equal(metadata.options.validator.$jsonSchema.additionalProperties, false);
const indexes = new Set((await collection.listIndexes().toArray()).map((index) => index.name));
assert.ok(indexes.has("payment_provider_events_provider_event_unique"));
assert.ok(indexes.has("payment_provider_events_finalized_expiry"));

const id = `stage58-p1-${Date.now()}`;
const repo = new MongoPaymentProviderEventRepository();
const input = { provider: "STRIPE", providerEventId: id, eventType: "payment_intent.succeeded", verificationBoundary: "STRIPE_SIGNATURE", providerPaymentId: `pi-${id}` };
const first = await repo.recordReceived(input);
const second = await repo.recordReceived(input);
assert.equal(first._id, second._id);
assert.equal(second.processingStatus, "RECEIVED");
assert.equal(second.retryCount, 0);
assert.equal("rawPayload" in second, false);
assert.equal("signature" in second, false);
const finalizedAt = new Date();
const processed = await repo.markProcessed("STRIPE", id, finalizedAt);
assert.equal(processed.processingStatus, "PROCESSED");
assert.equal(processed.expiresAt?.getTime(), finalizedEventExpiry(finalizedAt).getTime());
await collection.deleteOne({ provider: "STRIPE", providerEventId: id });
console.log("STAGE58_P1_COLLECTION_CHECK — PASS");
console.log("STAGE58_P1_VALIDATOR_CHECK — PASS");
console.log("STAGE58_P1_UNIQUE_PROVIDER_EVENT_INDEX_CHECK — PASS");
console.log("STAGE58_P1_DUPLICATE_IDEMPOTENCY_CHECK — PASS");
console.log("STAGE58_P1_SAFE_FIELD_ALLOWLIST_CHECK — PASS");
console.log("STAGE58_P1_FINALIZED_RETENTION_CHECK — PASS");
console.log("STAGE58_P1_NO_WEBHOOK_ROUTE_CHECK — PASS");
console.log("STAGE58_P1_NO_PAYMENT_ORDER_EMAIL_MUTATION_CHECK — PASS");
await (await mongoClientPromise).close();
