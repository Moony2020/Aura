# Stage 5.6 — PayPal Integration / P0 Goal Contract

**Status:** P0 Goal Contract COMPLETE ✅ — Owner Decisions COMPLETE ✅ — Phase Ledger COMPLETE ✅ — P1–P5 COMPLETE ✅ — Stage 5.6 COMPLETE ✅

## Goal

Define the PayPal provider boundary for AURA while preserving the verified
Stage 5.5 Stripe checkout path. This P0 is documentation, architecture, and
authority analysis only; it does not install an SDK, create a provider object,
or modify checkout runtime.

## Preserved checkout authority

The canonical path remains:

```text
Real Product → canonical Cart → /cart → /checkout
→ server commercial review → TRACKED inventory review
→ 15-minute reservation → provider payment preparation
```

Cards continue to use Stripe. PayPal is a separate provider boundary. The
browser never controls amount, currency, tax, shipping, discounts, inventory,
ownership, or payment proof. Browser approval and redirects are presentation
signals only; trusted provider API state and Stage 5.8 verified webhooks remain
the payment-proof authorities.

## Authority classification

| P0 topic | Classification | Current authority / unresolved boundary |
| --- | --- | --- |
| PayPal client integration approach | ALREADY AUTHORITATIVE | Official PayPal JavaScript SDK v6; PayPal-branded button only; no Card Fields, standalone card UI, Pay Later, Venmo, or wallets. |
| PayPal provider object and lifecycle | ALREADY AUTHORITATIVE | Orders v2 with `intent=CAPTURE`; server create, browser approval, server capture. |
| Create → approve → capture responsibilities | ALREADY AUTHORITATIVE | AURA review → TRACKED reservation → server create → PayPal approval → server capture. |
| Provider object reuse/recreation | ALREADY AUTHORITATIVE | One Order per active canonical attempt; reuse only with the same commercial fingerprint and valid reservation. |
| PayPal account vs eligible guest funding | ALREADY AUTHORITATIVE | AURA exposes PayPal-branded PayPal only; provider-owned eligible funding remains inside PayPal UX. |
| Minimum customer/address data | ALREADY AUTHORITATIVE | AURA delivery address is authoritative; use `SET_PROVIDED_ADDRESS` semantics; phone remains optional and omitted by default. |
| Safe internal reference allowlist | ALREADY AUTHORITATIVE | `purchase_units[].custom_id` may contain only opaque `aura_payment_attempt_id`; no invoice ID before Stage 5.9. |
| SEK minor-unit → PayPal amount format | ALREADY AUTHORITATIVE | AURA uses integer SEK minor units; any provider decimal string must be a deterministic formatting conversion, never floating-point commercial authority. |
| PayPal API request idempotency | ALREADY AUTHORITATIVE | Provider requests use server-generated idempotency/retry context distinct from Stage 5.8 webhook idempotency. Exact PayPal mechanism remains implementation detail for the Ledger. |
| Capture/retry behavior | ALREADY AUTHORITATIVE | One logical capture; retry ambiguous/network/5xx results with the same stable `PayPal-Request-Id`; do not retry business declines. |
| Sandbox verification strategy | ALREADY AUTHORITATIVE | PayPal SANDBOX, non-production Atlas, and existing real AURA Product/Cart/Checkout path only. |

## Lifecycle boundary to define later

The future PayPal implementation must document, without weakening AURA
authority:

1. server-side provider-object creation after commercial review and a
   legitimate TRACKED reservation;
2. a browser approval handoff that returns only approved client-use data;
3. server-side capture or equivalent final provider mutation;
4. trusted provider retrieval and status normalization;
5. safe request reuse/retry and abandoned-object handling;
6. amount-change invalidation and re-review; and
7. rollback/release when provider creation or capture preparation fails.

No item above authorizes runtime implementation during P0.

## Commercial, inventory, and identity invariants

- PayPal receives only the final server-authoritative SEK amount.
- AURA integer minor units remain the commercial authority.
- Zero external payment creates no PayPal provider object.
- Cart mutations do not reserve inventory.
- Explicit payment preparation reviews the canonical Cart, verifies TRACKED
  inventory, reserves for 15 minutes, then creates the provider object.
- Provider failure must release the reservation safely.
- UNTRACKED is not unlimited and is not implicitly purchasable.
- Guest checkout remains supported; PayPal does not require an AURA account.
- Browser `userId`, `ownerId`, guest token, and account identity are never
  authority, and PayPal email is not used to link an AURA account.
- Saved Addresses remain separate from checkout data and immutable Order
  snapshots.

## Credential boundary

| Variable | Boundary |
| --- | --- |
| `PAYPAL_CLIENT_SECRET` | Server-only; never logged, documented, or exposed. |
| `PAYPAL_CLIENT_ID` | Exposure depends on the approved PayPal client SDK boundary; OWNER DECISION REQUIRED before runtime. |
| `PAYPAL_WEBHOOK_ID` | Stage 5.8 concern; absence does not block P0 and must not be requested now. |

PayPal credentials are owner-supplied through ignored local environment or
hosting secrets. P0 does not request or print values.

## Binding owner decisions

- PayPal uses the official JavaScript SDK v6 and a PayPal-branded button only.
- PayPal uses Orders v2 with `intent=CAPTURE`.
- One PayPal Order belongs to one active canonical AURA payment attempt and is
  reusable only while the commercial fingerprint and 15-minute reservation
  remain valid.
- Capture is server-side and retries use the same stable
  `PayPal-Request-Id`; business declines are not retried as new captures.
- AURA owns the delivery address and uses `SET_PROVIDED_ADDRESS` semantics; phone is
  optional and omitted by default.
- PayPal reconciliation may use only opaque
  `aura_payment_attempt_id` in `custom_id`; no invoice identity exists before
  Stage 5.9.

## Handoffs and exclusions

- Stage 5.8 owns webhook signature verification and canonical event
  idempotency.
- Stage 5.9 owns canonical Order creation and immutable snapshots.
- Stage 5.10 owns pending, failure, cancellation, and recovery states.
- Stage 5.7 owns wallet eligibility.
- No PayPal SDK, adapter, provider object, capture, button, webhook route,
  Atlas mutation, Stripe change, Order, confirmation page, or Stage 5.7+
  work is part of P0.

## Required P0 evidence

- PayPal authority and client/server responsibility analysis.
- Provider lifecycle and payment-proof boundary analysis.
- Amount/currency, reservation, rollback, guest/auth, identifier, and
  credential boundary review.
- Explicit classification of every unresolved owner-policy item above.
- `STAGE56_P0_DOCUMENTATION_CHECK — PASS`.
- `STAGE56_P0_SCOPED_DIFF_CHECK — PASS`.
- `git diff --check — PASS`.

## Completion / stop

```text
Stage 5.6 — COMPLETE ✅
P0 — COMPLETE ✅
Owner Decisions — COMPLETE ✅
Phase Ledger — COMPLETE ✅
P1–P5 — COMPLETE ✅
PayPal Runtime — VERIFIED ✅

ATLAS_STOP:
Awaiting owner approval before Stage 5.7 Wallet Eligibility.
```

The earlier P0-only runtime prohibition is historical. Stage 5.6 P1–P5
subsequently completed the approved PayPal Sandbox path without introducing
webhooks, canonical AURA Orders, confirmation routes, or production activation.
