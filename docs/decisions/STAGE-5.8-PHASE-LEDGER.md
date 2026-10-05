# Stage 5.8 — Payment Webhooks & Idempotency / Phase Ledger

**Status:** Goal Contract COMPLETE ✅ — Owner Decisions COMPLETE ✅ — Phase
Ledger COMPLETE ✅ — P1 COMPLETE ✅ — P2 COMPLETE ✅ — Stripe correlation amendment COMPLETE ✅ — Runtime P3 COMPLETE ✅ — P4 COMPLETE ✅ — P5 COMPLETE ✅ — P6 COMPLETE ✅ — P7 READY — NOT STARTED

**Governing contract:** [Stage 5.8 Goal Contract](STAGE-5.8-GOAL-CONTRACT.md)

This ledger authorizes the ordered implementation and verification of trusted
Stripe card and direct PayPal provider events. It does not authorize Stage 5.9,
customer/admin email, confirmation routes, wallet activation, or production
payment configuration.

## Accepted owner decisions

- Use a dedicated MongoDB `paymentProviderEvents` persistence boundary.
- Enforce unique `(provider, providerEventId)` delivery idempotency.
- Store safe metadata only; do not persist raw payloads, signatures, secrets,
  authorization headers, card data, PAN/CVC, buyer credentials, or unnecessary
  provider PII by default.
- Finalized `PROCESSED` and `VERIFIED_UNSUPPORTED` records retain for 180 days.
- `RETRYABLE` and `DEAD_LETTER` records do not expire while unresolved; after
  resolution, the 180-day retention window applies.
- Maximum eight processing attempts. Transient failures are `RETRYABLE`; after
  eight failures the record becomes `DEAD_LETTER` with no commercial mutation.
- Verified unknown events persist safe audit metadata as
  `VERIFIED_UNSUPPORTED`; they are not silently discarded and never mutate
  payment, inventory, Order, or email state.
- Future PayPal Sandbox configuration may use `https://aura-tsr3.onrender.com/`.
  `PAYPAL_WEBHOOK_ID` remains server-only and is not configured or requested in
  this ledger step.

## Global invariants

- Provider authenticity is verified before trusted processing.
- Browser callbacks, redirects, query parameters, and client status are never
  payment proof.
- Commercial mutation is at most once per trusted provider transition.
- Trusted terminal success is never downgraded by an older event.
- Missing correlation is retryable; unknown references are safely rejected or
  dead-lettered without commercial mutation.
- Stage 5.8 does not create AURA Orders, Order numbers, confirmation pages,
  customer/admin emails, or Admin UI.
- Apple Pay, Google Pay, and Klarna are Coming soon and have no webhook path.

## Ordered implementation and evidence gates

### P1 — Provider-event persistence boundary

**Scope:** Design and implement the server-only repository/model for
`paymentProviderEvents`, including the compound unique index, safe metadata
allowlist, processing states, retry fields, correlation fields, and retention
`expiresAt` policy. Add a compatible TTL index only for finalized records;
unresolved records must not be deleted by TTL.

**Evidence:** schema/index validation, duplicate insert race, redaction checks,
retention tests, and no `paymentAttempts` embedding.

**Exclusions:** no provider endpoint, webhook configuration, Order, email, or
commercial transition.

### P2 — Stripe authenticity boundary

**Scope:** Add the server-only Route Handler boundary using the raw
`request.text()`, `Stripe-Signature`, and `constructEvent` with
`STRIPE_WEBHOOK_SECRET`. Bound body size and reject malformed/unverified input
before inbox processing. Keep Test and Live endpoint secrets separate.

**Evidence:** valid signature, invalid signature, mutated-body rejection,
oversized/malformed body rejection, secret boundary, and safe response behavior.

### P1 completion evidence

`paymentProviderEvents` was initialized and checked against the non-production
Atlas database. The strict validator, compound unique provider/event index,
finalized expiry index, duplicate idempotency behavior, safe-field allowlist,
and finalized retention boundary passed. No webhook route, provider
verification, payment/order/inventory mutation, email, or external webhook
configuration was introduced.

### P2 — Stripe authenticity completion evidence

The server-only `POST /api/webhooks/stripe` Route Handler reads the exact raw
body with `request.text()`, enforces a 128 KiB UTF-8 body limit, extracts
`Stripe-Signature`, and verifies it with Stripe's `constructEvent` boundary and
`STRIPE_WEBHOOK_SECRET`. Local valid, invalid, mutated-body, missing-signature,
malformed, oversized, missing-secret, safe-response, no-inbox-write, and
no-commercial-mutation checks passed. P2 performs no trusted event processing.

### P3 — Stripe event processing and idempotency

**Scope:** Allowlist only PaymentIntent event families required by the existing
Stripe card architecture. Correlate trusted PaymentIntent IDs to canonical
payment attempts, apply monotonic trusted state transitions, and make duplicate
delivery a no-op. Do not create an Order or send email.

**Evidence:** valid test PaymentIntent event, duplicate/replay, distinct event
IDs for one provider transition, missing attempt, out-of-order state, and
Stripe CLI/Dashboard resend behavior.

### P4 — PayPal authenticity boundary

**Scope:** Add the server-only PayPal verification boundary using the exact raw
body, PayPal transmission headers, official verification mechanism, and
`PAYPAL_WEBHOOK_ID`. Missing configuration must fail closed without requesting
or exposing the secret. Sandbox and Live configuration remain separate.

**Evidence:** valid Sandbox verification fixture, invalid signature/header,
body mutation rejection, missing configuration boundary, request bounds, and
redacted logging.

### P5 — PayPal event processing and idempotency

**Scope:** Allowlist direct-PayPal Orders v2 approval/completion and relevant
capture outcomes. Correlate by persisted `providerOrderId`, capture reference,
and opaque payment-attempt identity. Do not use customer email or browser IDs.

**Evidence:** verified Sandbox capture-related event, duplicate/replay,
missing attempt, unknown reference, out-of-order event, and no duplicate
capture/release/payment transition.

### P6 — Cross-provider retry, dead-letter, and ordering

**Scope:** Implement the eight-attempt policy, `RETRYABLE` classification,
`DEAD_LETTER` transition, provider-redelivery handling, safe unknown events,
and monotonic state guards. Do not sleep inside webhook requests or create an
unbounded internal retry loop.

**Evidence:** transient database/provider failures, attempt counts 1–8,
dead-letter behavior, recovery after retry, duplicate delivery, old failure
after terminal success, and no commercial mutation on dead-letter.

### P7 — External webhook evidence and security regression

**Scope:** With owner-approved endpoint configuration only, verify Stripe test
webhooks and PayPal Sandbox webhooks against the Render host. Run secret scan,
TypeScript, ESLint, build, audit, runtime, accessibility/security and existing
Stripe/PayPal checkout regressions.

**External evidence rule:** unavailable endpoint/domain/provider configuration
is `IMPLEMENTED — NOT YET VERIFIED`; no PASS result may be fabricated.

### P8 — Final audit and documentation reconciliation

**Scope:** Reconcile the Phase 5 ledger, Project Status, Master Plan, Testing,
Changelog, and Stage 5.8 records. Confirm Stage 5.9 remains untouched and
that the customer/admin email requirement remains assigned to the later
post-Order stage.

**Evidence:** documentation consistency, `git diff --check`, no Order/email/
confirmation implementation, and final owner report.

## Handoffs and stop conditions

Stage 5.8 hands trusted, idempotent provider-payment state to Stage 5.9.
Stage 5.9 owns canonical AURA Order creation and immutable order snapshots.
Stage 5.10 owns failure, cancellation, pending, recovery, and release
lifecycle. Later order-finalization stages own idempotent customer/admin email.

```text
Stage 5.8 Goal Contract — COMPLETE ✅
Stage 5.8 Owner Decisions — COMPLETE ✅
Stage 5.8 Phase Ledger — COMPLETE ✅
Stage 5.8 P1 — COMPLETE ✅
Stage 5.8 P2 — COMPLETE ✅
Stage 5.5 Stripe correlation prerequisite — COMPLETE ✅
Stage 5.8 Runtime — P3 COMPLETE ✅
Stage 5.8 P4 — COMPLETE ✅
Stage 5.8 P5 — COMPLETE ✅
Stage 5.8 P6 — COMPLETE ✅
Stage 5.8 P7 — READY — NOT STARTED

ATLAS_STOP:
Awaiting owner approval before Stage 5.8 implementation P7 — External webhook evidence and security regression.
Do not begin Stage 5.9.
```
