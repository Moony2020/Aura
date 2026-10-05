# Stage 5.7 — Wallet Eligibility / Phase Ledger

**Status:** Goal Contract COMPLETE ✅ — Owner Decisions COMPLETE ✅ — Phase Ledger COMPLETE ✅ — P1 COMPLETE ✅ — P2 COMPLETE ✅ — P3 COMPLETE ✅ — P4 COMPLETE ✅ — P5 COMPLETE ✅ — P6 DEFERRED / NOT YET VERIFIED — P7 COMPLETE ✅ — Stage 5.7 COMPLETE ✅

**Governing contract:** [Stage 5.7 Goal Contract](STAGE-5.7-GOAL-CONTRACT.md)

This ledger authorizes the ordered implementation and verification plan for
Stripe Express Checkout wallets. P1 has now added the rendering foundation;
wallet payment preparation remains outside this completed phase.

## Accepted decisions and global invariants

- Apple Pay and Google Pay are the only wallet methods in Stage 5.7.
- Both wallets use Stripe’s Express Checkout Element and the existing Stripe
  PaymentIntent architecture.
- The existing Stripe Payment Element remains the card surface. Wallets must
  not be duplicated there when Express Checkout is present.
- Direct PayPal from Stage 5.6 remains unchanged. Stripe PayPal, Link, Klarna,
  Amazon Pay, and all other Express Checkout methods are excluded.
- Wallet UI appears only on `/checkout` and only when Stripe/environment
  eligibility allows it.
- AURA remains authoritative for Cart, amount, SEK minor units, shipping, tax,
  discounts, checkout details, and tracked inventory reservations.
- Browser wallet completion is not canonical payment proof. Trusted Stripe
  state and the later signed webhook/order stages remain authoritative.
- No raw wallet credentials, card data, secrets, tokens, private keys, or
  unnecessary wallet identity data enter AURA storage or logs.
- No stage may create AURA Orders, Order numbers, confirmation pages, or
  webhooks.

## P1 — Stripe Express Checkout foundation

**Goal:** Add the narrow Stripe Express Checkout boundary without changing the
existing card or PayPal paths.

**Preconditions:** Goal Contract and Owner Decisions complete; Stripe
PaymentIntent boundary remains available.

**Allowed scope:** Express Checkout component wiring, explicit method allowlist
for `applePay` and `googlePay`, locale/layout configuration, and a no-wallet
fallback.

**Required invariants:** `/checkout` only; no additional payment method;
eligibility-driven rendering; no forced or fake wallet availability;
Payment Element and direct PayPal remain functional.

**Evidence:** Static boundary review, client/public-key review, no-call proof,
TypeScript, lint, and checkout runtime smoke test without creating a payment.

**Exclusions:** PaymentIntent creation changes, wallet capture/order semantics,
domain registration, webhooks, AURA Orders, and Stage 5.8.

**Completion:** P1 is complete after the local implementation and regression
evidence below. P2 remains separately gated and must not start automatically.

## P2 — Server-authoritative wallet payment preparation

**Goal:** Prove that a future wallet confirmation reuses the existing server
  review and PaymentIntent preparation authority.

**Allowed scope:** Focused server/client handoff contract for wallet-confirmed
  PaymentIntents, stable idempotency mapping, amount/currency/shipping checks,
  and reservation-before-payment-creation verification.

**Required invariants:** Browser wallet data cannot set amount, currency,
  shipping, discount, tax, inventory, ownership, or final payment state.

**Evidence:** Mocked/fixture review, mutation ordering, retry/idempotency,
  invalid amount/currency/reservation rejection, and regression against the
  existing Stripe card preparation path.

**Exclusions:** New real payment creation unless separately authorized by the
  later implementation gate; webhooks, AURA Orders, and confirmation routes.

## P3 — Apple Pay eligibility and rendering

**Goal:** Implement Apple Pay through the approved Stripe Express Checkout
  surface and render it only when Stripe reports it eligible.

**Required external prerequisites:** HTTPS, a real registered domain in the
  relevant Stripe mode, Stripe account/payment-method configuration, and a
  compatible Apple device/browser/account/card for real wallet evidence.

**Evidence split:** Code/rendering can be `IMPLEMENTED`; real Apple Pay device
  and domain evidence is `VERIFIED` only after the prerequisites exist.

**Exclusions:** Direct Apple Merchant ID/certificate/merchant-validation
  integration unless a later Stripe requirement and owner decision explicitly
  authorize it.

## P4 — Google Pay eligibility and rendering

**Goal:** Implement Google Pay through the approved Stripe Express Checkout
  surface and render it only when Stripe reports it eligible.

**Required external prerequisites:** HTTPS, a real registered domain in the
  relevant Stripe mode, Stripe account/payment-method configuration, and a
  compatible browser/device with a configured Google Pay payment method.

**Evidence split:** Code/rendering can be `IMPLEMENTED`; real Google Pay device
  and domain evidence is `VERIFIED` only after the prerequisites exist.

## P5 — Fallback and cross-provider regression

**Goal:** Ensure ineligible wallet environments remain usable and completed
  Stripe cards and direct PayPal are not regressed.

**Required behavior:** Hide unavailable wallet buttons; preserve the Stripe
  card flow and direct PayPal; do not report wallet success as paid; preserve
  all existing validation, reservation, and error boundaries.

**Evidence:** Supported and unsupported browser/device matrix, localhost
  no-wallet fallback, `/checkout` runtime checks, Stripe regression, PayPal
  regression, accessibility, and responsive checks.

## P6 — HTTPS/domain/device external verification

**Goal:** Verify the external prerequisites without inventing domains or
  treating missing device/domain evidence as implementation failure.

**Required evidence:**

- Register the owner-supplied staging domain in Stripe test mode when available.
- Register the owner-supplied production domain in Stripe live mode when
  available.
- Verify HTTPS/TLS and Stripe domain configuration.
- Test Apple Pay on compatible Apple hardware/browser/account/card.
- Test Google Pay on compatible browser/device/account/payment method.

Until then, record the relevant result as `IMPLEMENTED — NOT YET VERIFIED`.
`localhost` is not proof of real wallet availability.

## P7 — Final audit and documentation reconciliation

**Goal:** Audit wallet method allowlisting, provider ownership, secret
boundaries, browser authority, Stripe/PayPal regressions, external evidence,
and documentation without opening Stage 5.8.

**Evidence:** TypeScript, ESLint, production build, `npm audit`, secret scan,
runtime routes, `git diff --check`, Stripe regression, PayPal regression,
documentation reconciliation, and explicit no-Order/no-webhook/no-confirmation
checks.

## Current ledger state

```text
Stage 5.7 — IN PROGRESS
Goal Contract — COMPLETE ✅
Owner Decisions — COMPLETE ✅
Phase Ledger — COMPLETE ✅
P1 — COMPLETE ✅
P2 — COMPLETE ✅
P3 — COMPLETE ✅
P4 — COMPLETE ✅
P5 — COMPLETE ✅
P6 — DEFERRED / NOT YET VERIFIED
P7 — COMPLETE ✅
Apple Pay real domain/device evidence — NOT YET VERIFIED
Google Pay real domain/device evidence — NOT YET VERIFIED
```

P2 completed the server-authoritative handoff by reusing the existing Stripe
Cart review, SEK amount/shipping calculation, tracked-inventory reservation,
PaymentIntent preparation, and idempotency boundary. No wallet-specific
PaymentIntent, capture, order, webhook, or commercial mutation was added.

P3 completed the Apple Pay eligibility/rendering boundary through Stripe
Express Checkout. Apple Pay is never forced or faked, is not duplicated in the
Payment Element, and the wallet container disappears when Stripe reports no
eligible wallet. No direct Apple Pay merchant integration or real transaction
was added. Real HTTPS/domain/device evidence remains NOT YET VERIFIED.

P4 uses the same existing Stripe Express Checkout boundary for Google Pay. It
does not add a separate Google Pay integration, provider, token store, or
payment flow.

P4 completed Google Pay eligibility/rendering through Stripe Express Checkout.
Google Pay is not forced or faked, is not duplicated in the Payment Element,
and remains limited to `/checkout`. Apple Pay, cards, and direct PayPal remain
available. Real HTTPS/domain/device evidence remains NOT YET VERIFIED.

P5 completed controlled no-wallet, partial-eligibility, both-wallet,
cancellation/error, accessibility, responsive, Stripe-card, and direct-PayPal
regression checks. No-wallet is a valid usable state; no fake or empty wallet
surface is shown, and browser wallet events are not payment proof.

P6 local readiness checks are complete: the implementation does not invent or
register domains, uses Stripe's existing Express Checkout implementation, and
contains no direct Apple Pay or Google Pay integration. Required real
HTTPS/domain/device evidence is deferred because no owner-supplied environment
is being provisioned. This is not an implementation failure.

P7 completed the final local audit and documentation reconciliation. Method
scope, provider ownership, server authority, secret boundaries, fallback,
Stripe/PayPal preservation, and the no-Order/no-webhook/no-confirmation
invariants passed. TypeScript, ESLint, production build, dependency audit,
runtime routes, and diff checks passed. Real Apple Pay and Google Pay
HTTPS/domain/device evidence remains NOT YET VERIFIED because the required
external environment is not configured.

ATLAS_STOP:
P7 — COMPLETE ✅.
P6 — IMPLEMENTED — NOT YET VERIFIED.
Stage 5.7 is complete under the superseding owner decision. Wallet activation
and external evidence remain deferred, but are not a blocker for the core
checkout architecture. Stage 5.8 is READY — NOT STARTED and requires separate
owner approval.
