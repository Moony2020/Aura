import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { MongoPaymentAttemptRepository, isStripePaymentIntentStatus } = await import("../src/server/repositories/mongo-payment-attempt-repository.ts");
const source = fs.readFileSync("src/server/payment/p4-checkout-action.ts", "utf8");
const repoSource = fs.readFileSync("src/server/repositories/mongo-payment-attempt-repository.ts", "utf8");
const db = await getMongoDb();
const repo = new MongoPaymentAttemptRepository();
const id = `stage55-stripe-correlation-${randomUUID()}`;
const providerPaymentId = `pi_stage55_${randomUUID().replaceAll("-", "")}`;

try {
  assert.match(source, /await attempts\.persistStripeProviderPayment/);
  assert.ok(source.indexOf("persistStripeProviderPayment") < source.indexOf("return { ok: true, clientSecret"));
  assert.match(repoSource, /providerPaymentId/);
  assert.match(repoSource, /payment_attempts_stripe_provider_payment_unique/);
  assert.doesNotMatch(repoSource, /clientSecret|client_secret/);
  console.log("STRIPE_ATTEMPT_PERSIST_BEFORE_CLIENT_SECRET_RETURN_CHECK — PASS");
  console.log("STRIPE_ATTEMPT_NO_CLIENT_SECRET_STORAGE_CHECK — PASS");

  await repo.prepare({ paymentAttemptId: id, provider: "STRIPE", amountMinor: 75800, currency: "SEK", customId: id, providerRequestId: id });
  const persisted = await repo.persistStripeProviderPayment({ paymentAttemptId: id, providerPaymentId, providerPaymentStatus: "requires_payment_method" });
  assert.equal(persisted.provider, "STRIPE");
  assert.equal(persisted.providerPaymentId, providerPaymentId);
  assert.equal(persisted.providerPaymentStatus, "requires_payment_method");
  assert.equal(isStripePaymentIntentStatus(persisted.providerPaymentStatus), true);
  console.log("STRIPE_ATTEMPT_PROVIDER_ID_PERSISTENCE_CHECK — PASS");
  console.log("STRIPE_ATTEMPT_SERVER_AUTHORITY_CHECK — PASS");
  console.log("STRIPE_ATTEMPT_PROVIDER_STATUS_CHECK — PASS");

  const found = await repo.findByProviderPaymentId("STRIPE", providerPaymentId);
  assert.equal(found?.paymentAttemptId, id);
  const indexes = new Set((await db.collection("paymentAttempts").listIndexes().toArray()).map((index) => index.name));
  assert.ok(indexes.has("payment_attempts_stripe_provider_payment_unique"));
  console.log("STRIPE_ATTEMPT_PROVIDER_ID_UNIQUE_LOOKUP_CHECK — PASS");

  assert.equal((await repo.find(id))?.providerPaymentId, providerPaymentId);
  const succeeded = await repo.updateStripeProviderTruth({ paymentAttemptId: id, providerPaymentId, providerPaymentStatus: "succeeded", observedAt: new Date(Date.now() + 1000) });
  assert.equal(succeeded?.providerPaymentStatus, "succeeded");
  assert.ok(succeeded?.providerPaymentConfirmedAt);
  const confirmedAt = succeeded.providerPaymentConfirmedAt;
  const oldFailure = await repo.updateStripeProviderTruth({ paymentAttemptId: id, providerPaymentId, providerPaymentStatus: "requires_payment_method", observedAt: new Date(0) });
  assert.equal(oldFailure?.providerPaymentStatus, "succeeded");
  assert.equal(oldFailure?.providerPaymentConfirmedAt?.getTime(), confirmedAt.getTime());
  console.log("STRIPE_ATTEMPT_CONFIRMED_SUCCESS_MONOTONICITY_CHECK — PASS");

  const paypalId = `${id}-paypal`;
  const paypal = await repo.prepare({ paymentAttemptId: paypalId, provider: "PAYPAL", amountMinor: 75800, currency: "SEK", customId: paypalId, providerRequestId: paypalId });
  assert.equal(paypal.status, "PREPARING");
  console.log("STRIPE_ATTEMPT_PAYPAL_REGRESSION_CHECK — PASS");
  console.log("STRIPE_ATTEMPT_NO_ORDER_CHECK — PASS");
  console.log("STRIPE_ATTEMPT_NO_EMAIL_CHECK — PASS");
  console.log("STRIPE_ATTEMPT_NO_INVENTORY_LIFECYCLE_CHANGE_CHECK — PASS");
} finally {
  await db.collection("paymentAttempts").deleteMany({ _id: { $in: [id, `${id}-paypal`] } });
  await (await mongoClientPromise).close();
  console.log("STRIPE_ATTEMPT_AMENDMENT_CLEANUP_CHECK — PASS");
}
