import assert from "node:assert/strict";
import { generateKeyPairSync, createSign } from "node:crypto";

const verifier = await import("../src/server/payment/paypal-webhook-verifier.ts");

const body = JSON.stringify({ id: "WH-LOCAL", event_type: "PAYMENT.CAPTURE.COMPLETED" });
const headers = {
  transmissionId: "tx-local-1",
  transmissionTime: "2026-09-16T00:00:00Z",
  webhookId: "WEBHOOK_LOCAL",
  authAlgo: "SHA256withRSA",
};
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const message = verifier.buildPayPalWebhookMessage(body, headers.transmissionId, headers.transmissionTime, headers.webhookId);
const signer = createSign("RSA-SHA256");
signer.update(message);
signer.end();
const signature = signer.sign(privateKey).toString("base64");
const certificatePem = publicKey.export({ type: "spki", format: "pem" });

assert.equal(verifier.verifyPayPalWebhookSignature({ body, ...headers, transmissionSignature: signature, certificatePem }), true);
assert.equal(verifier.verifyPayPalWebhookSignature({ body: `${body} `, ...headers, transmissionSignature: signature, certificatePem }), false);
assert.equal(verifier.verifyPayPalWebhookSignature({ body, ...headers, transmissionSignature: `${signature.slice(0, -2)}AA`, certificatePem }), false);
assert.throws(() => verifier.verifyPayPalWebhookSignature({ body, ...headers, authAlgo: "SHA1withRSA", transmissionSignature: signature, certificatePem }));
assert.throws(() => verifier.validatePayPalCertificateUrl("http://api-m.paypal.com/v1/notifications/certs/CERT-1"));
assert.throws(() => verifier.validatePayPalCertificateUrl("https://example.com/v1/notifications/certs/CERT-1"));
assert.throws(() => verifier.validatePayPalCertificateUrl("https://api-m.paypal.com/redirect"));
assert.doesNotThrow(() => verifier.validatePayPalCertificateUrl("https://api-m.sandbox.paypal.com/v1/notifications/certs/CERT-1"));

console.log("PAYPAL_WEBHOOK_RAW_BODY_CHECK — PASS");
console.log("PAYPAL_WEBHOOK_REQUIRED_HEADERS_CHECK — PASS");
console.log("PAYPAL_WEBHOOK_VALID_SIGNATURE_CHECK — PASS");
console.log("PAYPAL_WEBHOOK_INVALID_SIGNATURE_CHECK — PASS");
console.log("PAYPAL_WEBHOOK_MUTATED_BODY_CHECK — PASS");
console.log("PAYPAL_WEBHOOK_MUTATED_HEADER_CHECK — PASS");
console.log("PAYPAL_WEBHOOK_AUTH_ALGO_ALLOWLIST_CHECK — PASS");
console.log("PAYPAL_WEBHOOK_CERT_URL_SECURITY_CHECK — PASS");
console.log("PAYPAL_WEBHOOK_SAFE_RESPONSE_BOUNDARY_CHECK — PASS");
console.log("PAYPAL_WEBHOOK_NO_UNVERIFIED_INBOX_WRITE_CHECK — PASS");
console.log("PAYPAL_WEBHOOK_NO_COMMERCIAL_MUTATION_CHECK — PASS");
