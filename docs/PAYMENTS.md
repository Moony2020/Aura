# AURA Payments

**Status:** Architecture accepted; implementation deferred to Phase 5 after product, cart, inventory, authentication, checkout, and order foundations exist.

## Providers

- Stripe through the official server/client SDKs.
- PayPal through official APIs/SDKs.
- Apple Pay and Google Pay only when provider, domain, browser, country, and merchant eligibility are confirmed.

## Trust Model

1. Server loads current product prices, discounts, inventory, shipping, and tax inputs.
2. Server creates the provider payment/order request with an idempotency key.
3. Provider-hosted elements handle card data; AURA never stores PAN or CVV.
4. Signed provider webhooks update payment and order state idempotently.
5. A browser success redirect is presentation only, never proof of payment.

## Required States

Pending, authorized where supported, paid, failed, cancelled, refunded, and partially refunded. Provider event IDs are recorded uniquely to prevent replay.

Real credentials, merchant accounts, tax rules, shipping rules, and legal business identity are owner-supplied production dependencies.
