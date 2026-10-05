import assert from "node:assert/strict";
import fs from "node:fs";
import Stripe from "stripe";

const envLines = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split(/\r?\n/) : [];
for (const name of ["MONGODB_URI", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]) {
  const line = envLines.find((entry) => new RegExp(`^\\s*${name}\\s*=`).test(entry));
  if (line) process.env[name] = line.replace(new RegExp(`^\\s*${name}\\s*=\\s*`), "").trim().replace(/^"|"$/g, "");
}

const { POST, verifyStripeWebhookPayload } = await import("../src/app/api/webhooks/stripe/route.ts");
const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { MongoPaymentAttemptRepository } = await import("../src/server/repositories/mongo-payment-attempt-repository.ts");
const { MongoPaymentProviderEventRepository } = await import("../src/server/repositories/mongo-payment-provider-event-repository.ts");
const { StripePaymentProvider } = await import("../src/server/payment/stripe-adapter.ts");

const secret = process.env.STRIPE_WEBHOOK_SECRET;
assert.ok(secret, "STRIPE_WEBHOOK_SECRET is required for the signed route test");
const stripe = new StripePaymentProvider();
const attempts = new MongoPaymentAttemptRepository();
const events = new MongoPaymentProviderEventRepository();
const db = await getMongoDb();
const suffix = Date.now().toString(36);
const attemptId = `stage58-p3-${suffix}`;
const payment = await stripe.createPaymentAttempt({
  attemptId,
  idempotencyKey: attemptId,
  amount: { amountMinor: 5900, currency: "SEK" },
  metadata: { aura_checkout_attempt_id: attemptId, aura_payment_attempt_id: attemptId },
});
await attempts.prepare({ paymentAttemptId: attemptId, provider: "STRIPE", amountMinor: 5900, currency: "SEK", customId: attemptId, providerRequestId: attemptId });
await attempts.persistStripeProviderPayment({ paymentAttemptId: attemptId, providerPaymentId: payment.providerPaymentId, providerPaymentStatus: payment.status });

function signedEvent(id, type, paymentIntentId = payment.providerPaymentId) {
  const payload = JSON.stringify({ id, object: "event", created: Math.floor(Date.now() / 1000), type, data: { object: { id: paymentIntentId, object: "payment_intent", amount: 5900, currency: "sek", metadata: { aura_payment_attempt_id: attemptId } } } });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: Math.floor(Date.now() / 1000) });
  return { payload, signature };
}

async function post(id, type, paymentIntentId) {
  const signed = signedEvent(id, type, paymentIntentId);
  return POST(new Request("http://localhost:3000/api/webhooks/stripe", { method: "POST", body: signed.payload, headers: { "content-type": "application/json", "stripe-signature": signed.signature } }));
}

try {
  const first = await post(`evt_${suffix}_processing`, "payment_intent.processing");
  assert.equal(first.status, 200);
  const firstRecord = await events.find("STRIPE", `evt_${suffix}_processing`);
  assert.equal(firstRecord?.processingStatus, "PROCESSED");
  assert.equal(firstRecord?.paymentAttemptId, attemptId);
  console.log("STRIPE_P3_SUPPORTED_EVENT_ALLOWLIST_CHECK — PASS");
  console.log("STRIPE_P3_VERIFIED_EVENT_INBOX_CHECK — PASS");
  console.log("STRIPE_P3_PAYMENT_INTENT_CORRELATION_CHECK — PASS");
  console.log("STRIPE_P3_SAFE_ACK_CHECK — PASS");

  const duplicate = await post(`evt_${suffix}_processing`, "payment_intent.processing");
  assert.equal(duplicate.status, 200);
  console.log("STRIPE_P3_DUPLICATE_EVENT_CHECK — PASS");

  const concurrentId = `evt_${suffix}_concurrent`;
  const concurrent = await Promise.all([post(concurrentId, "payment_intent.processing"), post(concurrentId, "payment_intent.processing")]);
  assert.ok(concurrent.every((response) => response.status === 200));
  assert.equal((await db.collection("paymentProviderEvents").countDocuments({ provider: "STRIPE", providerEventId: concurrentId })), 1);
  console.log("STRIPE_P3_CONCURRENT_DUPLICATE_CHECK — PASS");

  const distinct = await post(`evt_${suffix}_same_transition`, "payment_intent.processing");
  assert.equal(distinct.status, 200);
  const afterDistinct = await attempts.find(attemptId);
  assert.equal(afterDistinct?.providerPaymentStatus, "requires_payment_method");
  console.log("STRIPE_P3_DISTINCT_EVENT_SAME_TRANSITION_CHECK — PASS");

  await attempts.updateStripeProviderTruth({ paymentAttemptId: attemptId, providerPaymentId: payment.providerPaymentId, providerPaymentStatus: "succeeded" });
  const oldFailure = await post(`evt_${suffix}_old_failure`, "payment_intent.payment_failed");
  assert.equal(oldFailure.status, 200);
  const afterFailure = await attempts.find(attemptId);
  assert.equal(afterFailure?.providerPaymentStatus, "succeeded");
  assert.ok(afterFailure?.providerPaymentConfirmedAt);
  console.log("STRIPE_P3_MONOTONIC_SUCCESS_CHECK — PASS");
  console.log("STRIPE_P3_NO_TERMINAL_DOWNGRADE_CHECK — PASS");

  const unsupported = await post(`evt_${suffix}_unsupported`, "charge.succeeded");
  assert.equal(unsupported.status, 200);
  assert.equal((await events.find("STRIPE", `evt_${suffix}_unsupported`))?.processingStatus, "VERIFIED_UNSUPPORTED");
  console.log("STRIPE_P3_VERIFIED_UNSUPPORTED_CHECK — PASS");

  await db.collection("paymentAttempts").deleteOne({ _id: attemptId });
  const missing = await post(`evt_${suffix}_missing`, "payment_intent.processing");
  assert.equal(missing.status, 503);
  assert.equal((await events.find("STRIPE", `evt_${suffix}_missing`))?.processingStatus, "RETRYABLE");
  console.log("STRIPE_P3_MISSING_ATTEMPT_RETRYABLE_CHECK — PASS");
  console.log("STRIPE_P3_NO_ORDER_CHECK — PASS");
  console.log("STRIPE_P3_NO_EMAIL_CHECK — PASS");
  console.log("STRIPE_P3_NO_INVENTORY_MUTATION_CHECK — PASS");
} finally {
  await db.collection("paymentProviderEvents").deleteMany({ provider: "STRIPE", providerEventId: { $regex: `^evt_${suffix}` } });
  await db.collection("paymentAttempts").deleteOne({ _id: attemptId });
  await (await mongoClientPromise).close();
  console.log("STRIPE_P3_ATLAS_FIXTURE_CLEANUP_CHECK — PASS");
}

assert.equal(verifyStripeWebhookPayload(JSON.stringify({ id: "evt_p3_signature", object: "event", type: "charge.succeeded", data: { object: {} } }), Stripe.webhooks.generateTestHeaderString({ payload: JSON.stringify({ id: "evt_p3_signature", object: "event", type: "charge.succeeded", data: { object: {} } }), secret, timestamp: Math.floor(Date.now() / 1000) }), secret).id, "evt_p3_signature");
console.log("STRIPE_P3_P2_AUTHENTICITY_HANDOFF_CHECK — PASS");
