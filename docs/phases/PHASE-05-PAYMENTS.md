# Phase 5 — Checkout & Payments

## Objective

Implement secure guest/customer checkout and webhook-verified payments.

## Dependencies

Product, cart, inventory, authentication, and order foundations.

## Stages

5.1 checkout architecture; 5.2 contact/address; 5.3 shipping; 5.4 pricing/tax/inventory review; 5.5 Stripe; 5.6 PayPal; 5.7 wallet eligibility; 5.8 webhooks/idempotency; 5.9 orders; 5.10 failures/cancellation; 5.11 refunds; 5.12 success/cancel routes; 5.13 security review; 5.14 tests; 5.15 sign-off.

All stages are **NOT STARTED**.

## Phase Acceptance Criteria

Sandbox payment flows and signed webhooks pass, totals are recalculated server-side, sensitive card data never reaches storage, and failure states preserve recoverable carts.

## Tests Performed

None.

## Known Issues

Merchant credentials, tax rules, shipping rules, and wallet eligibility are future owner dependencies.

## Architecture Decisions

Stripe and PayPal official SDKs; webhook state is authoritative.

## Final Sign-Off

Not started.
