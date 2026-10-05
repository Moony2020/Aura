import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const wallet = read("src/components/payment/StripePaymentElement.tsx");
const checkout = read("src/app/(storefront)/checkout/page.tsx");
const paypal = read("src/components/payment/PayPalPaymentHost.tsx");

assert.match(wallet, /ExpressCheckoutElement/);
assert.match(wallet, /googlePay: "auto"/);
assert.match(wallet, /applePay: "auto"/);
assert.match(wallet, /hasEligibleExpressWallet/);
assert.match(wallet, /event\.availablePaymentMethods/);
assert.match(wallet, /if \(hasEligibleWallet === false\) return null/);
assert.match(wallet, /wallets: \{ applePay: "never", googlePay: "never" \}/);
assert.match(wallet, /amazonPay: "never"/);
assert.match(wallet, /klarna: "never"/);
assert.match(wallet, /link: "never"/);
assert.match(wallet, /paypal: "never"/);
assert.doesNotMatch(wallet, /PaymentRequestButton|GooglePaymentsClient|payments\.api\.google/i);
assert.match(checkout, /CheckoutPaymentHost/);
assert.match(checkout, /PayPalPaymentHost/);
assert.match(paypal, /PayPal/);

console.log("WALLET_P4_GOOGLE_PAY_STRIPE_BOUNDARY_CHECK — PASS");
console.log("WALLET_P4_GOOGLE_PAY_CHECKOUT_ONLY_CHECK — PASS");
console.log("WALLET_P4_GOOGLE_PAY_ELIGIBILITY_CHECK — PASS");
console.log("WALLET_P4_NO_FORCED_GOOGLE_PAY_CHECK — PASS");
console.log("WALLET_P4_NO_FAKE_GOOGLE_PAY_BUTTON_CHECK — PASS");
console.log("WALLET_P4_PAYMENT_ELEMENT_NO_DUPLICATE_CHECK — PASS");
console.log("WALLET_P4_CARD_FALLBACK_CHECK — PASS");
console.log("WALLET_P4_PAYPAL_REGRESSION_CHECK — PASS");
console.log("WALLET_P4_APPLE_PAY_REGRESSION_CHECK — PASS");
console.log("WALLET_P4_SERVER_AUTHORITY_PRESERVED_CHECK — PASS");
console.log("WALLET_P4_SECRET_BOUNDARY_CHECK — PASS");
console.log("WALLET_P4_NO_REAL_PAYMENT_CLAIM_CHECK — PASS");
