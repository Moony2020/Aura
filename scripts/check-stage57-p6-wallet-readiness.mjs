import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const packageJson = JSON.parse(read("package.json"));
const installedNext = JSON.parse(read("node_modules/next/package.json"));
const env = read("src/config/env.public.ts");
const wallet = read("src/components/payment/StripePaymentElement.tsx");
const checkout = read("src/app/(storefront)/checkout/page.tsx");
const source = read("src/server/payment/p4-checkout-action.ts");

assert.match(packageJson.dependencies.next, /^\^16\.3\./);
assert.equal(installedNext.version, "16.3.5");
assert.match(env, /NEXT_PUBLIC_SITE_URL/);
assert.match(env, /http:\/\/localhost:3000/);
assert.match(wallet, /ExpressCheckoutElement/);
assert.match(wallet, /applePay: "auto"/);
assert.match(wallet, /googlePay: "auto"/);
assert.match(wallet, /paymentMethods:/);
assert.match(wallet, /onReady=/);
assert.match(wallet, /onLoadError=/);
assert.match(checkout, /CheckoutPaymentHost/);
assert.match(checkout, /PayPalPaymentHost/);
assert.match(source, /requireServerEnv|StripePaymentProvider/);
assert.doesNotMatch(wallet, /ApplePaySession|merchantValidation|merchantIdentifier/i);
assert.doesNotMatch(wallet, /GooglePaymentsClient|google\.payments\.api/i);
assert.doesNotMatch(source, /NEXT_PUBLIC_STRIPE_SECRET|STRIPE_SECRET_KEY/);

console.log("WALLET_P6_WALLET_READINESS_BOUNDARY_CHECK — PASS");
console.log("WALLET_P6_NO_DOMAIN_INVENTION_CHECK — PASS");
console.log("WALLET_P6_NO_DOMAIN_REGISTRATION_CHECK — PASS");
console.log("WALLET_P6_STRIPE_WALLET_READINESS_CHECK — PASS");
console.log("WALLET_P6_DIRECT_APPLE_INTEGRATION_CHECK — PASS");
console.log("WALLET_P6_DIRECT_GOOGLE_INTEGRATION_CHECK — PASS");
console.log("WALLET_P6_SECRET_BOUNDARY_CHECK — PASS");
console.log("WALLET_P6_PAYPAL_PRESERVATION_CHECK — PASS");
console.log("WALLET_P6_EXTERNAL_DOMAIN_DEVICE_EVIDENCE — NOT YET VERIFIED");
