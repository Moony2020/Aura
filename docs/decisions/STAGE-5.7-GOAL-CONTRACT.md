# Stage 5.7 — Wallet Eligibility / P0 Goal Contract

**Status:** Stage 5.7 COMPLETE ✅ — Stripe cards + direct PayPal ACTIVE — Apple Pay / Google Pay / Klarna COMING SOON / DEFERRED

## Objective

Define the secure eligibility boundary for Apple Pay and Google Pay in AURA
without changing the completed Stripe Stage 5.5 or PayPal Stage 5.6 flows.
Wallets must remain Stripe payment methods and must not become a separate
provider boundary.

## Current architecture dependencies

- Cards use the existing Stripe Payment Element and server-authoritative
  PaymentIntent preparation boundary.
- PayPal remains the separate PayPal Orders v2/Sandbox boundary completed in
  Stage 5.6.
- Cart totals, shipping, discounts, tax, checkout details, and tracked
  inventory remain server-authoritative.
- Wallet confirmation must flow through Stripe and later payment webhook/order
  stages; browser wallet success is not an AURA payment-proof or Order event.

## In scope for a later implementation

- Determine whether Apple Pay and Google Pay should be enabled for AURA’s
  checkout.
- Select the Stripe-approved wallet surface after owner decisions: existing
  Payment Element wallet display where appropriate, or a separate Stripe
  Express Checkout Element for wallet buttons.
- Define eligibility detection, graceful non-display, supported-device/browser
  testing, domain registration, and Stripe Dashboard configuration boundaries.
- Preserve the existing server amount, currency, shipping, tax, discount,
  reservation, PaymentIntent, webhook, and Order ownership boundaries.

## Explicitly out of scope

- Enabling Apple Pay or Google Pay now.
- Adding wallet buttons or changing checkout runtime.
- Creating PaymentIntents, PayPal Orders, AURA Orders, Order numbers, or
  confirmation pages.
- Webhooks, final payment/order transitions, inventory semantic changes,
  refunds, Stage 5.8, or any Stage 5.7 implementation ledger.
- Direct Apple Pay or Google Pay gateway integrations outside Stripe.
- Requesting or storing Stripe secrets, Apple credentials/certificates, Google
  credentials, private keys, wallet tokens, PAN, or CVC.

## Official capability constraints

### Stripe

Stripe’s Payment Element supports wallet display options and defaults to
showing wallets when possible. When Payment Element is combined with Express
Checkout Element, Stripe states that Apple Pay and Google Pay are displayed in
Express Checkout to avoid duplication. Express Checkout only presents payment
methods that are active, supported, configured, and eligible for the shopper’s
location, currency, browser, and device. Stripe requires registering every
domain that displays wallet payment methods in test and live mode.

Official references:

- [Stripe Payment Element](https://docs.stripe.com/payments/payment-element)
- [Stripe Wallets](https://docs.stripe.com/payments/wallets)
- [Stripe Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element)
- [Stripe payment-method domain registration](https://docs.stripe.com/payments/payment-methods/pmd-registration)
- [Stripe Apple Pay](https://docs.stripe.com/apple-pay?platform=web)

### Apple Pay

Apple Pay on the web requires HTTPS with a valid domain certificate and TLS
1.2+. Apple’s web setup includes a Merchant ID, payment-processing certificate,
merchant identity certificate, and registered/verified merchant domain for the
direct Apple web path. When Stripe handles merchant validation, AURA still
needs the Stripe domain/account configuration required by the selected Stripe
surface. Apple Pay availability also depends on a compatible Apple device,
browser, account, and configured card.

Official references:

- [Apple Pay on the web: setting up the server](https://developer.apple.com/documentation/applepayontheweb/setting-up-your-server)
- [Apple Pay sandbox testing](https://developer.apple.com/apple-pay/sandbox-testing/)
- [Configure Apple Pay on the web](https://developer.apple.com/help/account/capabilities/configure-apple-pay-on-the-web)

### Google Pay

Google Pay Web requires an HTTPS page with a domain-validated TLS certificate,
a supported browser, a Google account payment method, and compliance with
Google Pay’s acceptable-use policy. The official browser/device guidance lists
Chrome, Firefox, Safari, Edge, Opera, and UCWeb, while tokenized-card testing
still depends on compatible devices, Google Play services, wallet setup, and
issuer support. Stripe’s Sweden capability page lists Sweden and SEK for
Google Pay, but final display remains conditional on Stripe account activation
and shopper eligibility.

Official references:

- [Google Pay Web setup](https://developers.google.com/pay/api/web/guides/setup)
- [Google Pay Web integration checklist](https://developers.google.com/pay-wallet/products/api/web/guides/test-and-deploy/integration-checklist)
- [Stripe Google Pay in Sweden](https://stripe.com/en-se/payment-method/google-pay)

## Local, staging, and production reality

| Environment | What can be verified | What remains unavailable or conditional |
|---|---|---|
| `http://localhost` | Static boundary, no-wallet fallback, compile/build contracts, and mocked eligibility handling | Real Apple Pay/Google Pay wallet presentation and trusted wallet payment proof |
| HTTPS staging domain | Stripe domain registration, dashboard activation, browser/device eligibility, and test-mode wallet flow | Apple hardware/account/card requirements and any owner-specific merchant verification |
| Production HTTPS domain | Final domain registration, live Stripe configuration, and compatible customer wallet flows | Production activation remains owner-controlled and outside this Goal Contract |

No unavailable localhost or device evidence is a PASS. Later unavailable
external evidence must be recorded as `IMPLEMENTED — NOT YET VERIFIED`.

## Security and authority contract

- AURA recalculates and owns Cart amount, currency, shipping, tax, discounts,
  checkout details, and inventory reservation state.
- Stripe client publishable values may cross the browser boundary; Stripe
  secret keys, provider credentials, and OAuth-like server credentials remain
  server-only.
- Wallet success returned to the browser is not canonical payment proof.
  Trusted Stripe state and the later signed webhook/order architecture remain
  authoritative.
- AURA stores no raw card data, PAN, CVC, wallet credential, private key, or
  unnecessary wallet identity data.
- Wallets cannot bypass reservation, PaymentIntent, webhook, or Order
  ownership rules, and cannot link a wallet identity to an AURA User by email.

## Evidence strategy for a later implementation

- Prove the selected Stripe wallet surface renders only when Stripe and the
  shopper environment report eligibility.
- Test Apple Pay and Google Pay independently across supported browser/device
  combinations, with explicit no-wallet fallback.
- Verify HTTPS/domain registration and test/live Stripe Dashboard configuration
  without logging secrets or wallet tokens.
- Verify the same server-authoritative amount/currency/shipping path used by
  Stripe cards, followed by trusted Stripe confirmation and later webhook
  authority. Do not treat a wallet sheet close/return as payment proof.
- Preserve and rerun Stage 5.5 Stripe regression checks and all existing
  checkout quality gates.

## Genuine Owner Decisions required before implementation

1. Enable Apple Pay, Google Pay, or both for AURA checkout?
2. Use the existing Payment Element wallet presentation, or add Stripe Express
   Checkout Element as a distinct wallet-button surface?
3. Should wallets appear only on `/checkout`, or later on another approved
   storefront surface?
4. Which HTTPS staging/production domains should be registered in Stripe for
   test and live mode?

These are product/configuration decisions. Browser and Stripe capability
constraints above are not silently converted into owner decisions.

## Completion / stop

```text
Stage 5.7 Goal Contract — COMPLETE ✅
Stage 5.7 Owner Decisions — REQUIRED
Stage 5.7 Phase Ledger — NOT STARTED
Stage 5.7 Runtime — NOT STARTED

ATLAS_STOP:
Awaiting owner decisions before creating the Stage 5.7 Phase Ledger.
```

No Apple Pay or Google Pay runtime was enabled by this document.

## Superseding owner decision — current payment-method scope

The current checkout has exactly two functional payment paths: Stripe Payment
Element for cards and the existing direct PayPal integration. Apple Pay,
Google Pay, and Klarna are AURA-designed Coming soon options only. They are
accessible and responsive, but cannot initiate payment, open a wallet sheet,
create a PaymentIntent, reserve inventory, or report payment success.

The earlier Express Checkout implementation and its historical evidence remain
factual historical records. It is not part of the current checkout runtime.
The current deployment URL is `https://aura-tsr3.onrender.com/`; it is recorded
for reference only and is not registered for wallet activation.
