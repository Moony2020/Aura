# Stage 5.6 — PayPal Integration / Phase Ledger

**Status:** Phase Ledger COMPLETE ✅ — P1 COMPLETE ✅ — P2 COMPLETE ✅ — P3 COMPLETE ✅ — P4 COMPLETE ✅

**Governing contract:** [Stage 5.6 P0 Goal Contract](STAGE-5.6-GOAL-CONTRACT.md)

This ledger is bound to the approved PayPal Owner Decisions. PayPal remains a
separate provider boundary from Stripe, and every subphase stops for explicit
approval before the next one.

## Global invariants

- Cards use Stripe; PayPal uses PayPal; wallets remain Stage 5.7.
- PayPal Orders v2 uses `intent=CAPTURE`.
- AURA server review, integer SEK minor units, ownership, shipping, tax,
  discounts, Gift Card rules, and inventory remain authoritative.
- A legitimate TRACKED reservation with a 15-minute TTL precedes provider
  Order creation.
- Browser approval and redirects are not payment proof; trusted provider state
  and Stage 5.8 verified webhooks are authoritative.
- No PayPal account/email identity links to an AURA User automatically.
- No raw secrets, tokens, PAN/CVC/expiry, unnecessary PII, or browser
  authority enters AURA storage, logs, or provider references.
- Stage 5.8 owns webhook verification/idempotency; Stage 5.9 owns canonical
  Order creation and immutable snapshots; Stage 5.10 owns pending/failure/
  cancellation lifecycle; Stage 5.11 owns refunds; Stage 5.12 owns success/
  cancel routes.

## P1 — PayPal Server Boundary and OAuth Adapter

**Goal:** Add only the server-only PayPal adapter and OAuth/request boundary.

**Preconditions:** P0 and Owner Decisions complete; no live or sandbox
credentials are required until the runtime subphase that calls PayPal.

**Allowed scope/files:** Provider-neutral payment boundary only where required,
server environment validation, PayPal server adapter, OAuth token handling,
safe error normalization, and focused boundary tests.

**Evidence/prerequisites:** Boundary review; PayPal SDK/API version review;
server-only secret review; no-call proof; TypeScript, scoped lint, and scoped
diff checks.

**Invariants:** `PAYPAL_CLIENT_SECRET` is server-only; client ID exposure is
limited to the approved browser SDK boundary; no provider call, Order,
capture, reservation, checkout UI, or Atlas mutation is introduced by P1.

**Exclusions:** PayPal Order creation, browser button, capture, webhooks,
Orders, wallets, Stripe changes, and Stage 5.7+.

**Completion:** Server boundary is approved without payment behavior.

**ATLAS_STOP:** Await owner approval before P2.

## P2 — PayPal Order Creation and Browser Approval Boundary

**Goal:** Create a PayPal Orders v2 `intent=CAPTURE` object after authoritative
review and reservation, and expose only the approved PayPal-branded browser
approval boundary.

**Preconditions:** P1 complete; owner-supplied PayPal SANDBOX credentials;
non-production Atlas; an existing real AURA Product and canonical Cart; valid
TRACKED inventory and 15-minute reservation.

**Allowed scope/files:** Server Order creation, deterministic SEK minor-unit
formatting, `SET_PROVIDED_ADDRESS`, opaque `custom_id` mapping, official
PayPal JavaScript SDK v6 branded button, and server/client handoff tests.

**Evidence/prerequisites:** Real SANDBOX Order creation; amount/currency
authority; reservation-before-Order ordering; client ID boundary; no raw
credential exposure; browser approval handoff evidence.

**Invariants:** One PayPal Order per active canonical payment attempt; reuse
requires the same commercial fingerprint and valid reservation; no silent
amount patch; browser cannot set amount, currency, address, ownership, or
inventory.

**Exclusions:** Capture, webhooks, canonical payment transitions, Order
creation in AURA, confirmation pages, wallets, PayPal Card Fields, Pay Later,
Venmo, Stripe changes, and Stage 5.7+.

**Completion:** PayPal Order and branded approval boundary pass without
claiming payment success.

**ATLAS_STOP:** Await owner approval before P3.

## P3 — Server Capture, Retry, and Reservation Rollback

**Goal:** Add server-side capture and safe retry/rollback behavior for the
 approved PayPal payment attempt.

**Preconditions:** P2 complete; same non-production Atlas and PayPal SANDBOX;
approved active reservation and PayPal Order.

**Allowed scope/files:** Server capture boundary, stable create/capture
`PayPal-Request-Id` handling, provider-state retrieval/normalization, and
reservation release on provider failure.

**Evidence/prerequisites:** Sandbox approval-to-capture flow; ambiguous/network
retry with the same request ID; business-decline handling; amount-change and
expired-reservation rejection; rollback and cleanup.

**Invariants:** Capture is server-only and one logical operation; no automatic
retry of business declines; approval/capture is not an AURA Order or canonical
paid state; webhook authority remains Stage 5.8.

**Exclusions:** Webhooks, canonical AURA Payment/Order transitions, refunds,
failure/cancel lifecycle, success routes, wallets, Stripe changes, and Stage
5.7+.

**Completion:** Capture and rollback evidence passes with no stranded
reservation or duplicate capture operation.

**ATLAS_STOP:** Await owner approval before P4.

## P4 — Real PayPal Sandbox Commerce Verification

**Goal:** Verify the complete real Product → Cart → Checkout → PayPal Sandbox
path without synthetic PayPal products or carts.

**Preconditions:** P3 complete; PayPal SANDBOX credentials and approved client
ID; non-production Atlas; controlled TRACKED test inventory on existing real
variants.

**Allowed scope/files:** Focused runtime integration and fixture setup/cleanup
owned by the approved PayPal path only.

**Evidence/prerequisites:** Real Product PDP, canonical Cart, `/cart`,
`/checkout`, server review, reservation before PayPal Order, browser approval,
server capture, trusted provider retrieval, redaction, and cleanup.

**Invariants:** No live PayPal; no production Atlas; no browser payment
authority; no raw card fields; no account linking by email; no AURA Order or
webhook claim.

**Exclusions:** Stripe redesign, wallets, webhooks, canonical Orders,
confirmation/success routes, refunds, Stage 5.7+, and unrelated storefront
changes.

**Completion:** Real Sandbox flow and cleanup pass all approved evidence.

**ATLAS_STOP:** Await owner approval before P5.

## P5 — PayPal Audit and Documentation Reconciliation

**Goal:** Audit the complete Stage 5.6 PayPal scope and reconcile canonical
documentation without claiming later-stage work.

**Preconditions:** P1–P4 complete; all required sandbox/Atlas evidence exists.

**Allowed scope/files:** Stage 5.6 docs/status, focused regression checks,
secret/redaction scan, cleanup evidence, TypeScript, lint, build, audit, and
scoped diff verification.

**Evidence/prerequisites:** PayPal Sandbox regression; Stripe regression;
reservation/order/capture boundary audit; fixture cleanup; documentation
status check; quality gates; `git diff --check`.

**Invariants:** Stage 5.8 remains webhook authority; Stage 5.9/5.10 remain
canonical Order/payment lifecycle owners; Stage 5.7 and later remain unopened.

**Exclusions:** New PayPal features, Stage 5.7+, production activation, live
credentials, and policy/schema expansion.

**Completion:** Stage 5.6 is complete only when all P5 evidence passes. If a
required external system is unavailable: `IMPLEMENTED — NOT YET VERIFIED`.

**ATLAS_STOP:** Stage 5.6 complete; Stage 5.7 READY — NOT STARTED; await owner
approval.

## Current ledger state

```text
Stage 5.6 — IN PROGRESS (P5 audit remains)
P0 — COMPLETE ✅
Owner Decisions — COMPLETE ✅
Phase Ledger — COMPLETE ✅
P1 — COMPLETE ✅
P2 — COMPLETE ✅
P3 — COMPLETE ✅
P4 — COMPLETE ✅
P5 — READY — NOT STARTED
PayPal Sandbox commerce evidence — VERIFIED ✅

ATLAS_STOP:
Awaiting owner approval before Stage 5.6 / P5.
```

## P4 verification record — 2026-09-15

The existing controlled real Sandbox run was verified without creating a new
payment. The canonical Cart contained `Éclat de Neroli` at `699.00 SEK` plus
`59.00 SEK` standard delivery, for a total of `758.00 SEK`.

- Official PayPal Web SDK v6 loaded and the real Sandbox Buyer approval returned
  to AURA.
- The recovery attempt used a new tracked 15-minute reservation and a new
  provider Order; the expired prior reservation and provider Order were not
  reused.
- Server-side PayPal retrieval returned Order `COMPLETED`, one Capture with
  status `COMPLETED`, amount `758.00 SEK`, and a persisted capture reference.
- AURA persisted the new attempt as `PAYPAL_CAPTURED` and persisted the stable
  capture request ID. The provider reported exactly one Capture.
- The old approved provider Order remained `APPROVED` with zero Captures.
- No AURA Order, Order number, Confirmation page, or PayPal webhook processing
  was created.
- Secret-boundary review found PayPal client secret/OAuth values server-only;
  Buyer credentials, authorization headers, and raw card data were not stored
  or logged. Stripe’s existing preparation boundary remained intact.

P4 — COMPLETE ✅
P5 — READY — NOT STARTED

**ATLAS_STOP:** Awaiting owner approval before Stage 5.6 / P5.
