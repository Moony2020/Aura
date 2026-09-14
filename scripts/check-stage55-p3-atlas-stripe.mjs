import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { MongoInventoryRepository } from "../src/server/repositories/mongo-order-inventory-repository.ts";
import { getMongoDb, mongoClientPromise } from "../src/server/db/mongodb.ts";
import { StripePaymentProvider } from "../src/server/payment/stripe-adapter.ts";
import { PaymentPreparationService } from "../src/server/payment/payment-preparation-service.ts";

const variantId = randomUUID();
const sku = `P3-STRIPE-${variantId.slice(0, 8).toUpperCase()}`;
const inventory = new MongoInventoryRepository();
const provider = new StripePaymentProvider();
const db = await getMongoDb();
let successfulReservationId;
let providerPaymentId;

try {
  await inventory.create({ variantId, sku, available: 2, reserved: 0, committed: 0 });

  const service = new PaymentPreparationService(inventory, provider);
  const input = {
    attemptId: `p3-attempt-${variantId}`,
    idempotencyKey: `p3-idempotency-${variantId}`,
    lines: [{ variantId, quantity: 1 }],
    amountMinor: 5900,
    metadata: { aura_checkout_attempt_id: `p3-attempt-${variantId}` },
  };
  const prepared = await service.prepare(input);
  successfulReservationId = prepared.reservationIds[0];
  providerPaymentId = prepared.providerPayment.providerPaymentId;
  assert.equal(prepared.providerPayment.provider, "STRIPE");
  assert.equal(prepared.providerPayment.amountMinor, 5900);
  assert.equal(prepared.providerPayment.currency, "SEK");
  assert.deepEqual(Object.keys(prepared.providerPayment.metadata), ["aura_checkout_attempt_id"]);
  assert.equal(prepared.expiresAt.getTime() - Date.now() > 14 * 60 * 1000, true);
  console.log("STAGE55_P3_ATLAS_FIXTURE_CHECK: PASS");
  console.log("STAGE55_P3_STRIPE_TEST_MODE_CHECK: PASS");
  console.log("STAGE55_P3_RESERVATION_PAYMENTINTENT_CHECK: PASS");

  const repeated = await provider.createPaymentAttempt({
    attemptId: input.attemptId,
    idempotencyKey: input.idempotencyKey,
    amount: { amountMinor: 5900, currency: "SEK" },
    metadata: input.metadata,
  });
  assert.equal(repeated.providerPaymentId, providerPaymentId);
  console.log("STAGE55_P3_IDEMPOTENCY_CHECK: PASS");

  const failingProvider = {
    async createPaymentAttempt() { throw new Error("controlled P3 provider failure"); },
    async retrievePaymentAttempt() { throw new Error("not used"); },
    async updatePaymentAttempt() { throw new Error("not used"); },
  };
  await assert.rejects(
    new PaymentPreparationService(inventory, failingProvider).prepare({
      ...input,
      attemptId: `p3-failure-${variantId}`,
      idempotencyKey: `p3-failure-${variantId}`,
    }),
    /controlled P3 provider failure/,
  );
  const afterRollback = await inventory.getByVariantId(variantId);
  assert.equal(afterRollback?.available, 1);
  assert.equal(afterRollback?.reserved, 1);
  console.log("STAGE55_P3_PROVIDER_ROLLBACK_CHECK: PASS");

  const zeroBefore = await inventory.getByVariantId(variantId);
  await assert.rejects(
    service.prepare({ ...input, amountMinor: 0, attemptId: `p3-zero-${variantId}`, idempotencyKey: `p3-zero-${variantId}` }),
    /positive external payment amount/,
  );
  const zeroAfter = await inventory.getByVariantId(variantId);
  assert.deepEqual({ available: zeroAfter?.available, reserved: zeroAfter?.reserved }, { available: zeroBefore?.available, reserved: zeroBefore?.reserved });
  console.log("STAGE55_P3_ZERO_EXTERNAL_PAYMENT_CHECK: PASS");
} finally {
  if (successfulReservationId) await inventory.release(successfulReservationId).catch(() => undefined);
  await db.collection("inventoryReservations").deleteMany({ variantId });
  await db.collection("inventory").deleteMany({ variantId });
  await (await mongoClientPromise).close();
  console.log("STAGE55_P3_CLEANUP_CHECK: PASS");
}
