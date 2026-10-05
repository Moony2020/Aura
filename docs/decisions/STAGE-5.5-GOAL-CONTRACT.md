# Stage 5.5 — Stripe Integration / P0 Goal Contract

**Status:** P0 Goal Contract COMPLETE ✅ — Owner Decisions COMPLETE ✅; Pre-existing Payment Baseline AUDITED ✅; Phase Ledger COMPLETE ✅; P1–P5 COMPLETE ✅; Narrow Stripe correlation amendment COMPLETE ✅

## Objective

Define the Stripe card-payment provider boundary for AURA without implementing
Stripe runtime, credentials, SDK calls, payment objects, checkout UI, Orders,
webhooks, or payment mutation.

## Existing authoritative boundaries

| Boundary | Classification | Authority |
| --- | --- | --- |
| Card provider | ALREADY AUTHORITATIVE | Phase 5 payment policy: cards use Stripe; PayPal remains separate. |
| Payment proof | ALREADY AUTHORITATIVE | Provider API state and/or later verified webhook evidence; redirects are not proof. |
| Card-data handling | ALREADY AUTHORITATIVE | Raw PAN/CVC/expiry never enter AURA storage, logs, or domain models. |
| Amount/currency | ALREADY AUTHORITATIVE | Stages 5.1–5.4: final server calculation, integer minor units, SEK. |
| Inventory precondition | ALREADY AUTHORITATIVE | Stage 5.4: TRACKED-only reservation, existing 15-minute TTL; UNTRACKED is not implicitly purchasable. |
| Guest checkout | ALREADY AUTHORITATIVE | Stage 5.1: allowed; browser identifiers never establish ownership. |
| Billing/contact baseline | ALREADY AUTHORITATIVE | Stage 5.2: billing defaults to delivery, separate billing allowed, phone optional. |
| Zero external payment | ALREADY AUTHORITATIVE | Stage 5.1: no fake provider charge; later canonical finalization owns it. |
| Webhooks/idempotency | ALREADY AUTHORITATIVE | Stage 5.8 owns verified webhook processing and canonical event idempotency. |
| Order/state transitions | ALREADY AUTHORITATIVE | Stage 5.9/5.10 own Order and canonical Payment transitions. |

## Recorded Owner Decisions

| Decision | Classification |
| --- | --- |
| Stripe client integration approach | APPROVED: Stripe Payment Element + Payment Intents API; audit first, no raw-card form or hosted Checkout as primary flow. |
| Whether AURA initially creates and persists Stripe Customer objects | APPROVED: no persistent Stripe Customer initially; no saved cards or email-based linking. |
| Stripe payment-object type and lifecycle/reuse strategy | APPROVED: one PaymentIntent per active AURA attempt, reusable while safely mutable after authoritative review. |
| Minimum contact/billing fields sent to Stripe | APPROVED: billing name, checkout contact email, authoritative billing address; phone not sent by default. |
| Safe Stripe metadata allowlist and identifier mapping | APPROVED: `aura_checkout_attempt_id` and `aura_payment_attempt_id` only when canonical; no PII, secrets, tokens, payment data, Gift Card codes, or browser authority. |
| Controlled non-production test inventory strategy while the catalog has 0 TRACKED variants | APPROVED: use existing active catalog variants with explicitly controlled development-only TRACKED inventory in non-production Atlas; never treat UNTRACKED as unlimited or implicitly purchasable, and clean test inventory after verification. |

The zero-external-payment boundary is already authoritative and is not
reopened here. `PAYPAL_WEBHOOK_ID` remains deferred to Stage 5.6/5.8 and is
not required for this Owner-Decision step.

## P4 scope amendment — real commerce path

P4 verification uses AURA's real commerce path:

```text
Real published fragrance → real ProductVariant → existing Cart → /cart
→ /checkout → explicit payment preparation → Stripe TEST PaymentIntent
→ server-persisted PaymentIntent identity/status → client_secret → Stripe Payment Element
```

Existing catalog variants may receive controlled, non-production TRACKED test
inventory for this verification. This does not change the domain rule that
`UNTRACKED` is not unlimited and is not implicitly purchasable. Checkout must
derive its lines, prices, quantities, shipping, tax, discounts, Gift Card
boundary, and inventory review from the canonical server-side Cart and the
approved Stage 5.1–5.4 contracts; no synthetic product or hard-coded payment
amount is the primary P4 path.

## Pre-existing Payment Baseline Audit

Audit result: the current repository contains no installed Stripe or PayPal
SDK dependency, no Stripe/PayPal source runtime, no PaymentIntent creation or
retrieval service, no provider checkout UI, no provider webhook route, and no
provider capture flow. Existing environment boundaries are present only as
empty/non-secret variable declarations in `.env.example` and optional reads in
`src/config/env.server.ts`:

- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`.
- No secret values were read, printed, copied, or added to documentation.

Classification:

| Existing component | Classification |
| --- | --- |
| Environment variable boundary | KEEP AS-IS; later runtime stages own activation. |
| Provider architecture documentation | KEEP AS-IS; reconcile against later runtime evidence. |
| Stripe SDK / PaymentIntent / UI / webhook | NOT PRESENT — implement only under authorized later scope. |
| PayPal client/capture/webhook | NOT PRESENT — review in Stage 5.6/5.8. |
| `PAYPAL_WEBHOOK_ID` | DEFERRED — not required now. |

No tracked hard-coded secret was found in the inspected source/config boundary.
No runtime was modified during this audit.

## Contract boundaries for later runtime

- A server-only Stripe adapter must own provider calls and normalize errors.
- Stripe receives only the final server-authoritative commercial amount and SEK currency.
- Browser input, redirects, and client-reported success cannot establish payment success.
- Secret keys, webhook secrets, full client secrets, raw card data, and sensitive provider payloads remain server-only and redacted.
- Stripe API request idempotency is distinct from Stage 5.8 webhook/event idempotency.
- Stripe-specific statuses must be mapped later and must not leak into canonical AURA state.
- AURA must not automatically link a Stripe Customer by matching email.

## Explicit exclusions

No Stripe SDK/runtime, Elements or Payment UI, PaymentIntent creation or
confirmation, Stripe Customer creation, webhook route or verification, Order
creation, Payment mutation, inventory changes/reservations, credentials,
PayPal, wallets, refunds, success/cancel routes, or Stage 5.6+ work is part of
this P0 contract step. The later amended P4 runtime may connect the canonical
Cart to Payment Element preparation, but does not complete payment, create an
Order, or provide confirmation-page semantics.

## Required P0 evidence

- Stripe authority and client/server responsibility tables.
- Payment-proof, amount, inventory, identity, and secret-boundary review.
- Handoff review for Stage 5.8 and Stage 5.9.
- Owner-decision list above.
- Proof that no Stripe runtime, dependency, credential, or configuration was introduced.
- `STAGE55_P0_DOCUMENTATION_CHECK — PASS`.
- `git diff --check — PASS`.

## Completion / stop

P0, Owner Decisions, the Pre-existing Payment Baseline, Phase Ledger, and P1–P5 are complete:

```text
Stage 5.5 — IN PROGRESS
P0 — COMPLETE ✅
Owner Decisions — COMPLETE ✅
Pre-existing Payment Baseline — AUDITED ✅
Phase Ledger — COMPLETE ✅
P1–P4 — COMPLETE ✅
P5 — COMPLETE ✅

ATLAS_STOP:
Stage 5.5 is COMPLETE ✅. Stage 5.6 PayPal Integration is READY — NOT STARTED.
Awaiting owner approval before Stage 5.6.
```
