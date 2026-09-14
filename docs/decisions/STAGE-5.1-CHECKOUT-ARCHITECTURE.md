# Stage 5.1 — Checkout Architecture Contract

Status: P1 — Architecture contract documented; runtime implementation not started.

## 1. Authoritative boundaries

The browser may submit checkout intent and user-entered inputs, but never
authoritative prices, totals, inventory state, payment state, ownership, tax
results, shipping eligibility, discount authority, or Gift Card liability.

The server resolves canonical ProductVariant and Cart data, revalidates
sellability and current prices, and owns the checkout preparation boundary.
Cart remains purchase intent and does not reserve inventory at Add/Increase.

## 2. Checkout lifecycle

```text
Cart
  -> server checkout revalidation
  -> final price / tax / shipping / inventory calculation
  -> inventory reservation for TRACKED inventory
  -> durable internal Order with immutable item/address snapshots
     in the existing unpaid/pending-payment equivalent
  -> provider payment creation (later provider stages)
  -> trusted provider API confirmation or verified webhook
```

The reservation is created before provider payment creation/confirmation and
has a 15-minute lifetime from successful reservation creation. Cancellation,
authoritative payment failure, and expiry release it. Successful authoritative
payment/order finalization commits it. There is no automatic extension in
Stage 5.1. Any provider-specific need for a longer or renewable reservation
requires a new owner decision at that provider stage.

`UNTRACKED` inventory is not implicitly sellable. The current catalog state of
60 sellable variants, all `UNTRACKED`, does not make purchase available by
default.

## 3. Order, Payment, and reservation relationship

Order, Payment, Fulfillment, and Reservation remain separate state machines
under the existing Phase 1.9 foundation. Stage 5.1 does not add replacement
enums.

- Order stores immutable historical item and address snapshots.
- Payment records provider/payment authority separately from Order state.
- Reservation protects tracked inventory and is committed/released by
  authoritative lifecycle events.
- Historical totals come from the durable Order, not current Product or Cart
  reads.
- Retries use the existing checkout/order idempotency identity and must not
  create duplicate Orders, reservations, or provider charges.

Browser success/cancel routes are presentation/navigation only. A browser
redirect never marks Payment or Order as paid and never commits inventory.

## 4. Pricing pipeline

```text
canonical Cart prices
  -> server pricing validation
  -> one eligible explicit Discount, if supplied
  -> TaxQuote boundary
  -> ShippingQuote boundary where delivery requires it
  -> Gift Card stored-value application
  -> remaining external-payment amount
```

All money remains integer minor units. A replacement discount is accepted only
after server validation; an invalid replacement does not silently change the
authoritative pricing state. Gift Cards are stored-value tender, not a
Discount. Partial use is allowed, cannot reduce the amount below zero, and
balance mutations remain atomic/idempotent at the later owning stage. No new
Gift Card hold/reservation schema is introduced here.

## 5. Customer identity and guest checkout

AURA supports both guest and authenticated CUSTOMER checkout.

- Guest checkout does not require account creation.
- Guest identity is opaque and server-controlled.
- Browser `userId`, `ownerId`, `customerId`, and `accountId` are never accepted
  as authority.
- Authenticated identity is derived from the existing Auth.js →
  `sessionVersion` → canonical User boundary.
- Matching a guest email to an existing account does not automatically link
  the checkout or create an account.
- Saved addresses may prefill checkout but do not replace immutable Order
  address snapshots.
- Guest state is retired only after the later owning durable completion rule;
  visiting a success/cancel URL is insufficient.

## 6. Provider architecture

Stripe and PayPal are separate provider adapters with independent boundaries.
The Stage 5.1 provider-neutral contract requires:

- provider creation requests receive only server-calculated amounts and an
  approved idempotency identity;
- provider API state and/or a verified signed webhook is required as payment
  proof;
- asynchronous provider states remain pending;
- redirects are never payment authority;
- Apple Pay and Google Pay remain deferred to wallet eligibility based on
  actual provider support.

No SDK integration, provider request, Payment Intent, PayPal Order, webhook,
credential, or sandbox setup is part of Stage 5.1.

## 7. Resolved owner policies

### Tax

Stage 5.1 defines only `TaxQuote`/tax-calculation boundaries. Concrete rate,
jurisdiction, and inclusive/exclusive pricing rules belong to Stage 5.4.
Checkout must not assume tax is zero or invent a rate.

### Shipping

Stage 5.1 defines delivery address → eligibility → selected method →
`ShippingQuote`. Concrete price, countries, carrier, delivery time, and free
shipping rules belong to Stage 5.3. No default free or flat rate is assumed.

### Inventory

Cart does not reserve inventory. Final checkout validation reserves tracked
inventory before provider payment creation for 15 minutes, with release and
commit behavior defined above.

### Discount

One explicit eligible discount at a time. There is no automatic best-discount
engine and no stacking. Future automatic-promotion priority requires a new
policy.

### Gift Card

Gift Card is stored-value tender separate from Discount. Liability changes only
through authoritative server-side checkout/order finalization logic.

### Payment/Order states

The existing Phase 1.9 state architecture is reused. Provider-confirmed
success, authoritative failure/cancellation, expiry, and pending states drive
the existing equivalents; no new enum is invented.

## 8. Explicit exclusions

- `/checkout` runtime or checkout UI
- Stage 5.2+ work
- Stripe or PayPal integration
- API keys, webhook secrets, or any credentials
- Payment Intent, PayPal Order, webhook, or provider session creation
- Order or Payment creation
- inventory reservation implementation
- tax calculation or shipping pricing implementation
- Gift Card redemption implementation
- changes to Cart, Wishlist, Address, Order History, Auth.js, or Phase 4

## 9. P1 evidence and completion

- Architecture contract and lifecycle boundaries are documented.
- Owner policies are recorded without inventing deferred tax/shipping rules.
- Existing Cart and inventory authority is preserved.
- No runtime/provider/persistence implementation is introduced.
- A scoped documentation check and `git diff --check` pass.

ATLAS_STOP:
Awaiting owner approval before P2.

## 10. P2 — Provider, Payment & Data-Integrity Contract Review

### Provider-neutral adapter contract

Each payment provider is represented by an independent server-only adapter.
The contract accepts a server-calculated payable amount, currency, checkout
or order idempotency identity, and a provider-safe return context. It returns
only a normalized provider reference and provider state; it never accepts
browser totals, ownership, or a browser assertion that payment succeeded.

Stripe and PayPal remain separate adapters. Their SDKs, API calls, credentials,
and provider-specific fields are deferred to Stages 5.5 and 5.6.

### Payment proof and webhook/idempotency contract

Payment authority is a trusted provider API result or a verified provider
webhook. A return/redirect route is navigation only. Provider events must be
signature-verified, normalized at the server boundary, and applied
idempotently using the existing checkout/order identity and provider event
identity. Duplicate deliveries and retries must not create duplicate Orders,
reservations, charges, or Gift Card liability mutations.

Provider pending/asynchronous states remain pending. No client callback,
redirect parameter, or local success flag may transition Payment, Order, or
Reservation to a successful equivalent.

### Order/Payment/Reservation integrity

- Order, Payment, and Reservation remain separate state machines.
- Order snapshots and historical totals are immutable after authoritative
  creation; current Product, Cart, or Address data cannot rewrite history.
- Reservation is created only for legitimately TRACKED inventory, before
  provider payment creation, and expires after 15 minutes unless an approved
  later provider policy changes that rule.
- Authoritative success commits the reservation; failure, cancellation, or
  expiry releases it.
- All cross-document transitions use the existing transaction and guarded
  mutation boundaries at their later implementation stages.

### Gift Card mixed-tender boundary

Gift Card is stored-value tender, not a Discount. The contract order is:
eligible merchandise → one accepted Discount → tax/shipping → Gift Card →
remaining external-payment amount. Partial use is allowed and cannot reduce
the amount below zero. Balance liability changes only through authoritative,
atomic, idempotent server-side finalization. Stage 5.1 adds no hold/reservation
schema. If mixed tender later requires a hold the existing foundation cannot
safely provide, implementation must stop for an owner decision.

### Secret and redaction boundary

Provider secrets, webhook secrets, card data, CVV, raw payment credentials,
raw tokens, full payment payloads, and connection strings are server-only and
must not appear in browser responses, logs, fixtures, reports, or docs.
Evidence may contain only redacted provider references and normalized states.

### Wallet deferral

Apple Pay and Google Pay are deferred to the wallet-eligibility stage. Their
availability is determined by actual provider support and deployment
configuration; Stage 5.1 does not assume or expose wallet capability.

### P2 evidence and completion

- Provider-neutral adapter contract is documented.
- Payment proof, webhook verification, and idempotency boundaries are explicit.
- Order/Payment/Reservation and mixed-tender integrity rules are explicit.
- Secret/redaction and wallet deferral rules are explicit.
- No SDK, API call, credential, webhook, Payment Intent, PayPal Order,
  mutation, reservation runtime, or UI was introduced.
- Scoped documentation check and `git diff --check` pass.

ATLAS_STOP:
Awaiting owner approval before Stage 5.1 / P3.

## 11. P3 — Contract Audit & Documentation Reconciliation

P3 audit result: PASS for the architecture-only Stage 5.1 scope.

- `PROJECT-STATUS.md`, `MASTER-PLAN.md`, and `PHASE-05-PAYMENTS.md` agree that
  P1 and P2 are complete, P3 is ready/not started, and Stages 5.2–5.15 have
  not started.
- Architecture, database, API, security, testing, ADR, Goal Contract, and
  Phase Ledger documents preserve server-authoritative pricing, provider
  proof, immutable Order facts, checkout-time reservation, and the approved
  Stripe/PayPal boundaries.
- The approved policies remain: guest checkout, 15-minute tracked-inventory
  reservation, `UNTRACKED` not implicitly purchasable, one explicit Discount,
  Gift Card as stored-value tender, redirect not payment proof, and trusted
  provider API/webhook authority.
- No Stripe/PayPal SDK, API key, webhook secret, Payment Intent, PayPal Order,
  webhook route, checkout runtime/UI, Order creation, reservation runtime,
  Gift Card redemption, payment mutation, or Stage 5.2+ change was introduced.

Required checks:

```text
Stage 5.1 documentation/status reconciliation — PASS
Stage 5.1 scoped diff check — PASS
git diff --check — PASS
```

ATLAS_STOP:
Awaiting owner approval before Stage 5.2 — Contact & Delivery Address.
