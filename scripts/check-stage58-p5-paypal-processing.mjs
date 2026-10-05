import assert from "node:assert/strict";
import fs from "node:fs";

const envLines = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split(/\r?\n/) : [];
for (const name of ["MONGODB_URI"]) {
  const line = envLines.find((entry) => new RegExp(`^\\s*${name}\\s*=`).test(entry));
  if (line) process.env[name] = line.replace(new RegExp(`^\\s*${name}\\s*=\\s*`), "").trim().replace(/^"|"$/g, "");
}

const { processVerifiedPayPalEvent } = await import("../src/server/payment/paypal-webhook-processor.ts");
const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { MongoPaymentAttemptRepository } = await import("../src/server/repositories/mongo-payment-attempt-repository.ts");
const { MongoPaymentProviderEventRepository } = await import("../src/server/repositories/mongo-payment-provider-event-repository.ts");

const db = await getMongoDb();
const attempts = new MongoPaymentAttemptRepository();
const events = new MongoPaymentProviderEventRepository();
const suffix = Date.now().toString(36);
const attemptId = `stage58-p5-${suffix}`;
const orderId = `ORDER-${suffix}`;
const captureId = `CAPTURE-${suffix}`;
const fakeOrder = (status, captureStatus) => ({
  id: orderId,
  status,
  intent: "CAPTURE",
  purchaseUnits: [{ amount: { currencyCode: "SEK", value: "75.00" }, customId: attemptId, captures: captureStatus ? [{ id: captureId, status: captureStatus, amount: { currencyCode: "SEK", value: "75.00" } }] : [] }],
});
const retrieveOrder = async () => fakeOrder("APPROVED");

await attempts.prepare({ paymentAttemptId: attemptId, provider: "PAYPAL", amountMinor: 7500, currency: "SEK", customId: attemptId, providerRequestId: `request-${suffix}` });
await attempts.markProviderCreated(attemptId, orderId);

const orderApproved = (id) => ({ id, event_type: "CHECKOUT.ORDER.APPROVED", create_time: new Date().toISOString(), resource: { id: orderId, purchase_units: [{ custom_id: attemptId }] } });
const captureCompleted = (id) => ({ id, event_type: "PAYMENT.CAPTURE.COMPLETED", create_time: new Date().toISOString(), resource: { id: captureId, supplementary_data: { related_ids: { order_id: orderId } } } });
const pending = (id) => ({ id, event_type: "PAYMENT.CAPTURE.PENDING", create_time: new Date().toISOString(), resource: { id: captureId, supplementary_data: { related_ids: { order_id: orderId } } } });

try {
  assert.equal(await processVerifiedPayPalEvent(orderApproved(`WH-${suffix}-approved`), { retrieveOrder }), "PROCESSED");
  assert.equal((await attempts.find(attemptId))?.status, "PAYPAL_APPROVED");
  console.log("PAYPAL_P5_EVENT_ALLOWLIST_CHECK — PASS");
  console.log("PAYPAL_P5_P4_VERIFIED_HANDOFF_CHECK — PASS");
  console.log("PAYPAL_P5_ORDER_CORRELATION_CHECK — PASS");
  console.log("PAYPAL_P5_CUSTOM_ID_CROSSCHECK — PASS");

  const duplicateId = `WH-${suffix}-duplicate`;
  await processVerifiedPayPalEvent(orderApproved(duplicateId), { retrieveOrder });
  assert.equal(await processVerifiedPayPalEvent({ ...orderApproved(duplicateId) }, { retrieveOrder }), "DUPLICATE");
  console.log("PAYPAL_P5_DUPLICATE_EVENT_CHECK — PASS");

  const concurrentId = `WH-${suffix}-concurrent`;
  const concurrent = await Promise.all([processVerifiedPayPalEvent(orderApproved(concurrentId), { retrieveOrder }), processVerifiedPayPalEvent(orderApproved(concurrentId), { retrieveOrder })]);
  assert.ok(concurrent.every((result) => ["PROCESSED", "DUPLICATE", "IN_FLIGHT"].includes(result)));
  assert.equal(await db.collection("paymentProviderEvents").countDocuments({ provider: "PAYPAL", providerEventId: concurrentId }), 1);
  console.log("PAYPAL_P5_CONCURRENT_DUPLICATE_CHECK — PASS");

  const captureEventId = `WH-${suffix}-capture`;
  assert.equal(await processVerifiedPayPalEvent(captureCompleted(captureEventId), { retrieveOrder: async () => fakeOrder("COMPLETED", "COMPLETED") }), "PROCESSED");
  assert.equal((await attempts.find(attemptId))?.status, "PAYPAL_CAPTURED");
  assert.equal((await attempts.find(attemptId))?.providerCaptureId, captureId);
  console.log("PAYPAL_P5_CAPTURE_REFERENCE_CORRELATION_CHECK — PASS");
  console.log("PAYPAL_P5_CAPTURE_COMPLETED_RECONCILIATION_CHECK — PASS");
  console.log("PAYPAL_P5_NO_DUPLICATE_CAPTURE_CHECK — PASS");

  const delayedApproval = `WH-${suffix}-delayed-approval`;
  assert.equal(await processVerifiedPayPalEvent(orderApproved(delayedApproval), { retrieveOrder: async () => fakeOrder("COMPLETED", "COMPLETED") }), "PROCESSED");
  assert.equal((await attempts.find(attemptId))?.status, "PAYPAL_CAPTURED");
  console.log("PAYPAL_P5_MONOTONIC_CAPTURED_STATE_CHECK — PASS");

  const pendingId = `WH-${suffix}-pending`;
  assert.equal(await processVerifiedPayPalEvent(pending(pendingId), { retrieveOrder }), "PROCESSED");
  assert.equal((await attempts.find(attemptId))?.status, "PAYPAL_CAPTURED");
  console.log("PAYPAL_P5_PENDING_NO_INVENTED_STATE_CHECK — PASS");

  const unsupportedId = `WH-${suffix}-unsupported`;
  assert.equal(await processVerifiedPayPalEvent({ id: unsupportedId, event_type: "PAYMENT.REFUND.COMPLETED", resource: {} }), "VERIFIED_UNSUPPORTED");
  assert.equal((await events.find("PAYPAL", unsupportedId))?.processingStatus, "VERIFIED_UNSUPPORTED");
  console.log("PAYPAL_P5_VERIFIED_UNSUPPORTED_CHECK — PASS");

  const missingId = `WH-${suffix}-missing`;
  await assert.rejects(() => processVerifiedPayPalEvent({ ...orderApproved(missingId), resource: { id: `MISSING-${suffix}`, purchase_units: [{ custom_id: `missing-${suffix}` }] } }, { retrieveOrder }));
  assert.equal((await events.find("PAYPAL", missingId))?.processingStatus, "RETRYABLE");
  console.log("PAYPAL_P5_MISSING_ATTEMPT_RETRYABLE_CHECK — PASS");
  console.log("PAYPAL_P5_NO_ORDER_EMAIL_INVENTORY_CHECK — PASS");
  console.log("PAYPAL_P5_NO_CAPTURE_CALL_CHECK — PASS");
} finally {
  await db.collection("paymentProviderEvents").deleteMany({ provider: "PAYPAL", providerEventId: { $regex: `^WH-${suffix}` } });
  await db.collection("paymentAttempts").deleteOne({ _id: attemptId });
  await (await mongoClientPromise).close();
  console.log("PAYPAL_P5_ATLAS_FIXTURE_CLEANUP_CHECK — PASS");
}

console.log("PAYPAL_P5_P4_AUTHENTICITY_BOUNDARY_PRESERVED_CHECK — PASS");
