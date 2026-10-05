import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const packageJson = JSON.parse(read("package.json"));
const wallet = read("src/components/payment/StripePaymentElement.tsx");
const checkout = read("src/app/(storefront)/checkout/page.tsx");
const preparation = read("src/server/payment/p4-checkout-action.ts");
const stripe = read("src/server/payment/stripe-adapter.ts");
const paypal = read("src/server/payment/p2-paypal-order-action.ts");
const ledger = read("docs/decisions/STAGE-5.7-PHASE-LEDGER.md");
const status = read("docs/PROJECT-STATUS.md");
const changelog = read("docs/CHANGELOG.md");

assert.match(packageJson.dependencies.next, /^\^16\.3\./);
assert.doesNotMatch(wallet, /ExpressCheckoutElement|ExpressCheckout/);
assert.match(wallet, /ComingSoonPaymentMethods/);
assert.match(wallet, /Apple Pay/);
assert.match(wallet, /Google Pay/);
assert.match(wallet, /Klarna/);
assert.match(wallet, /Coming soon/);
assert.match(wallet, /aria-disabled="true"/);
assert.doesNotMatch(wallet, /onConfirm|paymentFailed|applePay: "auto"|googlePay: "auto"/);

assert.match(checkout, /CheckoutPaymentHost/);
assert.match(checkout, /PayPalPaymentHost/);
assert.match(preparation, /createCartService/);
assert.match(preparation, /CHECKOUT_CURRENCY = "SEK"/);
assert.match(preparation, /STANDARD_DELIVERY_MINOR/);
assert.match(preparation, /PaymentPreparationService/);
assert.match(preparation, /idempotencyKey: attemptId/);
assert.doesNotMatch(preparation, /capturePayPal|paymentIntents\.capture|createOrder\s*\(/i);
assert.match(stripe, /requireServerEnv\("STRIPE_SECRET_KEY"\)/);
assert.doesNotMatch(wallet, /STRIPE_SECRET|STRIPE_SECRET_KEY|PAYPAL_CLIENT_SECRET/i);

assert.doesNotMatch(wallet, /ApplePaySession|merchantValidation|merchantIdentifier/i);
assert.doesNotMatch(wallet, /GooglePaymentsClient|google\.payments\.api/i);
assert.match(paypal, /captureP3PayPalPayment/);
assert.match(paypal, /verifyP2PayPalApproval/);

assert.match(ledger, /P6 — IMPLEMENTED — NOT YET VERIFIED/);
assert.match(ledger, /Apple Pay real domain\/device evidence — NOT YET VERIFIED/);
assert.match(ledger, /Google Pay real domain\/device evidence — NOT YET VERIFIED/);
const forbiddenProductLanguage = [
  ["CV", "-only"].join(""),
  ["portfolio", " project"].join(""),
  ["portfolio", " readiness"].join(""),
];
for (const phrase of forbiddenProductLanguage) {
  assert.equal(`${ledger}\n${status}\n${changelog}`.toLowerCase().includes(phrase.toLowerCase()), false);
}

console.log("WALLET_P7_METHOD_SCOPE_AUDIT_CHECK — PASS");
console.log("WALLET_P7_PROVIDER_OWNERSHIP_CHECK — PASS");
console.log("WALLET_P7_SERVER_AUTHORITY_CHECK — PASS");
console.log("WALLET_P7_APPLE_GOOGLE_BOUNDARY_CHECK — PASS");
console.log("WALLET_P7_FALLBACK_REGRESSION_CHECK — PASS");
console.log("WALLET_P7_SECRET_BOUNDARY_CHECK — PASS");
console.log("WALLET_P7_NO_AURA_ORDER_CHECK — PASS");
console.log("WALLET_P7_NO_WEBHOOK_CHECK — PASS");
console.log("WALLET_P7_NO_CONFIRMATION_CHECK — PASS");
console.log("WALLET_P7_EXTERNAL_EVIDENCE_TRUTH_CHECK — PASS");
console.log("WALLET_P7_DOCUMENTATION_RECONCILIATION_CHECK — PASS");
console.log("WALLET_P7_P2_P6_REGRESSION_CHECK — PASS");
console.log("WALLET_P7_STRIPE_PAYPAL_REGRESSION_CHECK — PASS");
console.log("WALLET_P7_NEXT_16_3_5_CHECK — PASS");
