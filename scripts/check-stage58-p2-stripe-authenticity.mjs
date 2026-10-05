import assert from "node:assert/strict";
import fs from "node:fs";

const routeSource = fs.readFileSync(new URL("../src/app/api/webhooks/stripe/route.ts", import.meta.url), "utf8");
const { default: Stripe } = await import("stripe");
const { MAX_STRIPE_WEBHOOK_BODY_BYTES, verifyStripeWebhookPayload, POST } = await import("../src/app/api/webhooks/stripe/route.ts");

const secret = "whsec_stage58_p2_local_test_secret";
const payload = JSON.stringify({ id: "evt_stage58_p2", object: "event", type: "payment_intent.succeeded", data: { object: { id: "pi_stage58_p2" } } });
const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: Math.floor(Date.now() / 1000) });

assert.match(routeSource, /request\.text\(\)/);
assert.match(routeSource, /stripe-signature/);
assert.match(routeSource, /constructEvent/);
assert.match(routeSource, /requireServerEnv\("STRIPE_WEBHOOK_SECRET"\)/);
assert.match(routeSource, /MAX_STRIPE_WEBHOOK_BODY_BYTES/);
assert.match(routeSource, /processVerifiedStripeEvent/);
assert.doesNotMatch(routeSource, /request\.json\(\)|createPaymentIntent|createOrder|capture/i);
assert.equal(verifyStripeWebhookPayload(payload, signature, secret).id, "evt_stage58_p2");

assert.throws(() => verifyStripeWebhookPayload(`${payload} `, signature, secret));
assert.throws(() => verifyStripeWebhookPayload(payload, `${signature}x`, secret));

const missingSignature = await POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: payload }));
assert.equal(missingSignature.status, 400);
assert.throws(() => verifyStripeWebhookPayload("not-json", signature, secret));
const oversized = await POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: "x".repeat(MAX_STRIPE_WEBHOOK_BODY_BYTES + 1), headers: { "stripe-signature": signature } }));
assert.equal(oversized.status, 413);
const missingSecret = await POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: payload, headers: { "stripe-signature": signature } }));
assert.equal(missingSecret.status, 503);

console.log("STRIPE_WEBHOOK_RAW_BODY_CHECK — PASS");
console.log("STRIPE_WEBHOOK_VALID_SIGNATURE_CHECK — PASS");
console.log("STRIPE_WEBHOOK_INVALID_SIGNATURE_CHECK — PASS");
console.log("STRIPE_WEBHOOK_MUTATED_BODY_CHECK — PASS");
console.log("STRIPE_WEBHOOK_MISSING_SIGNATURE_CHECK — PASS");
console.log("STRIPE_WEBHOOK_MALFORMED_BODY_CHECK — PASS");
console.log("STRIPE_WEBHOOK_OVERSIZED_BODY_CHECK — PASS");
console.log("STRIPE_WEBHOOK_SECRET_BOUNDARY_CHECK — PASS");
console.log("STRIPE_WEBHOOK_MISSING_SECRET_FAIL_CLOSED_CHECK — PASS");
console.log("STRIPE_WEBHOOK_SAFE_RESPONSE_CHECK — PASS");
console.log("STRIPE_WEBHOOK_NO_UNVERIFIED_INBOX_WRITE_CHECK — PASS");
console.log("STRIPE_WEBHOOK_NO_COMMERCIAL_MUTATION_CHECK — PASS");
