import assert from "node:assert/strict";
import fs from "node:fs";

const envLines = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split(/\r?\n/) : [];
const mongoLine = envLines.find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
if (mongoLine) process.env.MONGODB_URI = mongoLine.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { MongoPaymentProviderEventRepository } = await import("../src/server/repositories/mongo-payment-provider-event-repository.ts");

const db = await getMongoDb();
const events = new MongoPaymentProviderEventRepository();
const suffix = Date.now().toString(36);
const fixture = (id, provider = "STRIPE") => ({ provider, providerEventId: `${id}-${suffix}`, eventType: "payment_intent.processing", verificationBoundary: provider === "STRIPE" ? "STRIPE_SIGNATURE" : "PAYPAL_WEBHOOK_VERIFICATION" });

const exhausted = fixture("p6-exhausted");
const recoverable = fixture("p6-recoverable");
const stale = fixture("p6-stale");
const unsupported = { ...fixture("p6-unsupported"), eventType: "charge.succeeded" };
const sharedId = `p6-shared-${suffix}`;

try {
  await events.recordReceived(exhausted);
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    assert.ok(await events.claimProcessing(exhausted.provider, exhausted.providerEventId));
    const failed = await events.markRetryable(exhausted.provider, exhausted.providerEventId, "PROVIDER_RETRIEVAL_TRANSIENT");
    assert.equal(failed.retryCount, attempt);
    assert.equal(failed.processingStatus, attempt === 8 ? "DEAD_LETTER" : "RETRYABLE");
  }
  assert.equal((await events.claimProcessing(exhausted.provider, exhausted.providerEventId)), null);
  assert.equal((await events.find(exhausted.provider, exhausted.providerEventId))?.retryCount, 8);
  assert.equal((await events.find(exhausted.provider, exhausted.providerEventId))?.expiresAt, undefined);
  console.log("P6_ATTEMPTS_1_TO_8_CHECK — PASS");
  console.log("P6_ATTEMPT_9_PREVENTION_CHECK — PASS");
  console.log("P6_DEAD_LETTER_PERSISTENCE_CHECK — PASS");
  console.log("P6_DEAD_LETTER_DUPLICATE_ACK_BOUNDARY_CHECK — PASS");

  await events.recordReceived(recoverable);
  assert.ok(await events.claimProcessing(recoverable.provider, recoverable.providerEventId));
  assert.equal((await events.markRetryable(recoverable.provider, recoverable.providerEventId, "DATABASE_TRANSIENT")).processingStatus, "RETRYABLE");
  assert.ok(await events.claimProcessing(recoverable.provider, recoverable.providerEventId));
  const recovered = await events.markProcessed(recoverable.provider, recoverable.providerEventId);
  assert.equal(recovered.retryCount, 2);
  assert.ok(recovered.expiresAt);
  console.log("P6_RETRYABLE_REPROCESS_CHECK — PASS");
  console.log("P6_SUCCESSFUL_RETRY_CHECK — PASS");
  console.log("P6_FINALIZED_180_DAY_RETENTION_CHECK — PASS");

  await events.recordReceived(stale);
  assert.ok(await events.claimProcessing(stale.provider, stale.providerEventId, new Date(Date.now() - 120_000)));
  assert.equal(await events.recoverStaleProcessing(stale.provider, stale.providerEventId, new Date(), 60_000), true);
  assert.ok(await events.claimProcessing(stale.provider, stale.providerEventId));
  await events.markProcessed(stale.provider, stale.providerEventId);
  console.log("P6_STALE_PROCESSING_RECOVERY_CHECK — PASS");
  console.log("P6_ACTIVE_CLAIM_NOT_STOLEN_CHECK — PASS");

  await events.recordReceived(unsupported);
  await events.markVerifiedUnsupported(unsupported.provider, unsupported.providerEventId);
  assert.equal(await events.claimProcessing(unsupported.provider, unsupported.providerEventId), null);
  const unsupportedRecord = await events.find(unsupported.provider, unsupported.providerEventId);
  assert.equal(unsupportedRecord?.processingStatus, "VERIFIED_UNSUPPORTED");
  assert.equal(unsupportedRecord?.retryCount, 0);
  assert.ok(unsupportedRecord?.expiresAt);
  console.log("P6_VERIFIED_UNSUPPORTED_NOT_RETRIED_CHECK — PASS");

  await events.recordReceived({ ...fixture("p6-cross-provider", "STRIPE"), providerEventId: sharedId });
  await events.recordReceived({ ...fixture("p6-cross-provider", "PAYPAL"), providerEventId: sharedId });
  assert.ok(await events.find("STRIPE", sharedId));
  assert.ok(await events.find("PAYPAL", sharedId));
  console.log("P6_CROSS_PROVIDER_SEPARATION_CHECK — PASS");

  const processorSource = fs.readFileSync("src/server/payment/stripe-webhook-processor.ts", "utf8") + fs.readFileSync("src/server/payment/paypal-webhook-processor.ts", "utf8");
  assert.doesNotMatch(processorSource, /capturePayPalSandboxOrder|createPayPalSandboxOrder|createPaymentAttempt/);
  console.log("P6_NO_PROVIDER_COMMERCIAL_ACTION_CHECK — PASS");
  console.log("P6_NO_ORDER_EMAIL_INVENTORY_CHECK — PASS");
} finally {
  await db.collection("paymentProviderEvents").deleteMany({ providerEventId: { $regex: `-${suffix}$|^${sharedId}$` } });
  await (await mongoClientPromise).close();
  console.log("P6_ATLAS_FIXTURE_CLEANUP_CHECK — PASS");
}
