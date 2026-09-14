import assert from "node:assert/strict";
import { PaymentPreparationService } from "../src/server/payment/payment-preparation-service.ts";

const calls = [];
const reservations = new Map();
const inventory = {
  async reserve(variantId, quantity, expiresAt) {
    calls.push(`reserve:${variantId}`);
    const id = `reservation-${reservations.size + 1}`;
    reservations.set(id, { variantId, quantity, expiresAt });
    return { id, variantId, quantity, status: "ACTIVE", expiresAt, createdAt: new Date(), updatedAt: new Date() };
  },
  async release(id) {
    calls.push(`release:${id}`);
    reservations.delete(id);
    return { id, status: "RELEASED" };
  },
};
const provider = {
  async createPaymentAttempt(input) {
    calls.push(`provider:${input.amount.currency}:${input.amount.amountMinor}`);
    return { provider: "STRIPE", providerPaymentId: "pi_test_fixture", status: "requires_payment_method", amountMinor: input.amount.amountMinor, currency: input.amount.currency, metadata: input.metadata };
  },
  async retrievePaymentAttempt() { throw new Error("not used"); },
  async updatePaymentAttempt() { throw new Error("not used"); },
};

const service = new PaymentPreparationService(inventory, provider);
const result = await service.prepare({
  attemptId: "attempt-fixture",
  idempotencyKey: "idempotency-fixture",
  lines: [{ variantId: "11111111-1111-4111-8111-111111111111", quantity: 1 }],
  amountMinor: 5900,
  metadata: { aura_checkout_attempt_id: "attempt-fixture" },
  now: new Date("2026-09-13T12:00:00.000Z"),
});
assert.deepEqual(calls, ["reserve:11111111-1111-4111-8111-111111111111", "provider:SEK:5900"]);
assert.equal(result.reservationIds.length, 1);
assert.equal(result.expiresAt.toISOString(), "2026-09-13T12:15:00.000Z");

const failingProvider = { ...provider, async createPaymentAttempt() { throw new Error("provider failure"); } };
await assert.rejects(
  new PaymentPreparationService(inventory, failingProvider).prepare({
    attemptId: "attempt-failure",
    idempotencyKey: "idempotency-failure",
    lines: [{ variantId: "11111111-1111-4111-8111-111111111111", quantity: 1 }],
    amountMinor: 5900,
    metadata: { aura_checkout_attempt_id: "attempt-failure" },
  }),
  /provider failure/,
);
assert.equal(reservations.size, 1, "successful preparation reservation should remain active");

await assert.rejects(
  service.prepare({
    attemptId: "attempt-zero",
    idempotencyKey: "idempotency-zero",
    lines: [{ variantId: "11111111-1111-4111-8111-111111111111", quantity: 1 }],
    amountMinor: 0,
    metadata: { aura_checkout_attempt_id: "attempt-zero" },
  }),
  /positive external payment amount/,
);

console.log("STAGE55_P3_PREPARATION_CHECK: PASS");
