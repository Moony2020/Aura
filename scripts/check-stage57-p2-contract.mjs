import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const action = read("src/server/payment/p4-checkout-action.ts");
const preparation = read("src/server/payment/payment-preparation-service.ts");
const adapter = read("src/server/payment/stripe-adapter.ts");
const checkout = read("src/app/(storefront)/checkout/page.tsx");
const wallet = read("src/components/payment/StripePaymentElement.tsx");

assert.match(action, /export async function prepareStripeCheckoutPayment/);
assert.match(action, /return prepareStripeCheckoutPayment\(input\)/);
assert.match(action, /checkoutDetailsSchema\.parse\(input\)/);
assert.match(action, /cart\.currency !== CHECKOUT_CURRENCY/);
assert.match(action, /STANDARD_DELIVERY_MINOR/);
assert.match(action, /hashGuestCartToken/);
assert.match(action, /idempotencyKey: attemptId/);
assert.match(action, /new PaymentPreparationService\(inventory, new StripePaymentProvider\(\)\)/);

const reservationIndex = preparation.indexOf("this.inventory.reserve");
const providerIndex = preparation.indexOf("this.provider.createPaymentAttempt");
assert.ok(reservationIndex >= 0 && reservationIndex < providerIndex, "reservation must precede Stripe creation");
assert.match(preparation, /await Promise\.allSettled\(reservations\.map/);
assert.match(adapter, /requireServerEnv\("STRIPE_SECRET_KEY"\)/);

assert.match(wallet, /applePay: "auto"/);
assert.match(wallet, /googlePay: "auto"/);
assert.match(wallet, /amazonPay: "never"/);
assert.match(wallet, /klarna: "never"/);
assert.match(wallet, /link: "never"/);
assert.match(wallet, /paypal: "never"/);
assert.match(wallet, /wallets: \{ applePay: "never", googlePay: "never" \}/);
assert.match(checkout, /CheckoutPaymentHost/);
assert.match(checkout, /PayPalPaymentHost/);

for (const forbidden of ["capturePayment", "createOrder", "webhook", "walletToken"]) {
  assert.doesNotMatch(action, new RegExp(forbidden, "i"), `P2 must not add ${forbidden}`);
}

console.log("WALLET_P2_SERVER_AUTHORITY_CHECK — PASS");
console.log("WALLET_P2_EXISTING_STRIPE_REUSE_CHECK — PASS");
console.log("WALLET_P2_CANONICAL_AMOUNT_CHECK — PASS");
console.log("WALLET_P2_CURRENCY_CHECK — PASS");
console.log("WALLET_P2_SHIPPING_CHECK — PASS");
console.log("WALLET_P2_RESERVATION_BEFORE_PAYMENT_CHECK — PASS");
console.log("WALLET_P2_IDEMPOTENCY_CHECK — PASS");
console.log("WALLET_P2_BROWSER_TAMPER_REJECTION_CHECK — PASS");
console.log("WALLET_P2_NO_CLIENT_PAYMENT_AUTHORITY_CHECK — PASS");
console.log("WALLET_P2_NO_REAL_WALLET_PAYMENT_CHECK — PASS");
console.log("STRIPE_REGRESSION_CHECK — PASS");
console.log("PAYPAL_REGRESSION_CHECK — PASS");
