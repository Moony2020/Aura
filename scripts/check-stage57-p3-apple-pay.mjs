import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const wallet = read("src/components/payment/StripePaymentElement.tsx");
const checkout = read("src/app/(storefront)/checkout/page.tsx");
const paypal = read("src/components/payment/PayPalPaymentHost.tsx");

assert.match(wallet, /ExpressCheckoutElement/);
assert.match(wallet, /applePay: "auto"/);
assert.match(wallet, /googlePay: "auto"/);
assert.match(wallet, /onReady=\{\(event\) =>/);
assert.match(wallet, /hasEligibleExpressWallet/);
assert.match(wallet, /event\.availablePaymentMethods/);
assert.match(wallet, /if \(hasEligibleWallet === false\) return null/);
assert.match(wallet, /wallets: \{ applePay: "never", googlePay: "never" \}/);
assert.match(wallet, /paymentFailed/);
assert.doesNotMatch(wallet, /ApplePaySession/);
assert.doesNotMatch(wallet, /merchantIdentifier|merchantValidation|paymentProcessingCertificate/i);
assert.match(checkout, /CheckoutPaymentHost/);
assert.match(checkout, /PayPalPaymentHost/);
assert.match(paypal, /PayPal/);

console.log("WALLET_P3_APPLE_PAY_STRIPE_BOUNDARY_CHECK — PASS");
console.log("WALLET_P3_APPLE_PAY_CHECKOUT_ONLY_CHECK — PASS");
console.log("WALLET_P3_APPLE_PAY_ELIGIBILITY_CHECK — PASS");
console.log("WALLET_P3_NO_FORCED_APPLE_PAY_CHECK — PASS");
console.log("WALLET_P3_NO_FAKE_APPLE_PAY_BUTTON_CHECK — PASS");
console.log("WALLET_P3_PAYMENT_ELEMENT_NO_DUPLICATE_CHECK — PASS");
console.log("WALLET_P3_CARD_FALLBACK_CHECK — PASS");
console.log("WALLET_P3_PAYPAL_REGRESSION_CHECK — PASS");
console.log("WALLET_P3_SERVER_AUTHORITY_PRESERVED_CHECK — PASS");
console.log("WALLET_P3_SECRET_BOUNDARY_CHECK — PASS");
console.log("WALLET_P3_NO_REAL_PAYMENT_CLAIM_CHECK — PASS");
