# Stage 5.4 — Server Pricing, Tax & Inventory Review Phase Ledger

Status: Phase Ledger COMPLETE — implementation not started

This ledger is bound to `STAGE-5.4-GOAL-CONTRACT.md` and the approved Stage
5.4 Owner Decisions. It authorizes architecture/contract review only; it does
not authorize checkout runtime, tax runtime, inventory mutation, payment, or
Order behavior.

## Confirmed goal

Preserve server-authoritative commercial facts for checkout: current
Product/Variant price, integer minor-unit money, Sweden/25% VAT treatment for
the current fragrance catalog, VAT-inclusive customer prices, post-Discount
pre-shipping/pre-Gift-Card free-shipping qualification, deterministic
rounding/allocation, safe price-change refresh, and final inventory review
with real TRACKED inventory only.

Gift Card remains stored-value tender rather than Discount. Its effect on the
taxable base and shipping threshold is none; its voucher legal/accounting
classification remains a later verified boundary. Current 60-variant reality
remains 0 TRACKED / 60 UNTRACKED / 0 OUT_OF_STOCK, and production purchasing
is blocked until owner-supplied real quantities establish TRACKED inventory.

## P1 — Pricing, Tax & Threshold Contract

### Goal
Document the final server-authoritative pricing, VAT, shipping-threshold,
Discount, Gift Card, price-change, and rounding contracts.

### Scope
- Reconcile current canonical merchandise price and checkout re-resolution.
- Document Sweden jurisdiction, 25% current-catalog VAT, VAT-inclusive prices,
  VAT-inclusive Standard Delivery, and accepted Discount tax treatment.
- Document the `>= 799 SEK` post-Discount, pre-shipping, pre-Gift-Card,
  VAT-inclusive merchandise threshold.
- Document deterministic integer-öre tax/Discount allocation and zero/negative
  payable-total protection.
- Document stale-price refresh and customer review before payment creation.

### Allowed files/contracts
Stage 5.4 Goal Contract and Owner Decisions, Stage 5.1–5.3 contracts,
Product/Cart/Discount/Gift Card/money/Order architecture, accepted ADRs, and
Phase 5 documentation.

### Invariants
Current server facts win; no floating-point commercial arithmetic; tax failure
blocks checkout; Gift Card does not change taxable base or shipping threshold;
zero external payment is valid and negative payment is invalid.

### Required evidence
Pricing/tax/threshold decision table, tax-inclusive gross-price review,
Discount/Gift Card sequence review, deterministic rounding/allocation review,
price-change contract review, and proof that no runtime was introduced.

### Owner-decision dependencies
Only the approved Stage 5.4 decisions and later verified Gift Card voucher
accounting classification may be referenced; no new tax/legal policy may be
invented.

### Explicit exclusions
Tax engine/runtime, checkout pricing runtime, ShippingQuote runtime, checkout
UI, payment, Order, inventory, credentials, and Stage 5.5+.

### Completion criteria
All P1 pricing, VAT, threshold, Discount, Gift Card, price-change, and rounding
contracts are documented consistently without runtime implementation.

### ATLAS_STOP
Awaiting owner approval before P2.

## P2 — Final Inventory Review & Reservation Boundary

### Goal
Document final checkout inventory revalidation and the existing TRACKED
reservation boundary without mutating inventory.

### Scope
- Assign later server-side revalidation for publication/activity, variant
  activity, current price, inventory mode/state, permitted quantity, shipping,
  Discount, tax, Gift Card, and final payable facts.
- Preserve Cart as non-reserving purchase intent.
- Preserve reservation before provider payment creation with the existing
  15-minute TTL for legitimately TRACKED inventory only.
- Record that UNTRACKED is neither unlimited nor implicitly purchasable and
  that current production purchasing is blocked pending real stock.

### Allowed files/contracts
Stage 5.4 P1 contract, Stage 5.1 inventory boundary, Product/Cart/Inventory/
Order/Reservation contracts, Database/Security/API docs, and accepted ADRs.

### Invariants
No invented stock; no Cart reservation; stale Cart/browser state cannot
override server truth; unavailable or invalid commercial/inventory facts block
progression safely; current catalog remains 0 TRACKED / 60 UNTRACKED / 0
OUT_OF_STOCK.

### Required evidence
Revalidation ownership matrix, reservation-boundary review, UNTRACKED launch
blocker confirmation, current inventory-state citation, and no reservation or
stock mutation diff.

### Owner-decision dependencies
None beyond the approved production policy requiring owner-supplied TRACKED
quantities and the separately deferred Gift Card accounting verification.

### Explicit exclusions
Reservation runtime, stock seed/update, inventory commit, checkout, payment,
Order creation, Gift Card redemption, provider integration, and Stage 5.5+.

### Completion criteria
The final review and reservation boundary is documented without changing Cart,
Inventory, Order, or payment runtime.

### ATLAS_STOP
Awaiting owner approval before P3.

## P3 — Contract Audit & Documentation Reconciliation

### Goal
Reconcile Stage 5.4 contracts and prove the stage remains architecture-only.

### Scope
- Verify P1/P2 decisions and all approved Stage 5.4 invariants.
- Reconcile Project Status, Master Plan, Phase 5, Goal Contract, and related
  Product/Cart/Discount/Gift Card/Inventory/Order documentation.
- Confirm Stages 5.5–5.15 remain not started and no runtime was introduced.

### Allowed files/contracts
Stage 5.4 contracts, Phase 5 status/roadmap, Stage 5.1–5.3 contracts,
architecture/API/database/security/testing docs, and accepted ADRs.

### Invariants
Server authority, VAT-inclusive SEK arithmetic, post-Discount threshold,
deterministic rounding, safe tax/price failure, TRACKED-only reservation,
UNTRACKED production blocking, and all later-stage exclusions remain intact.

### Required evidence
Stage 5.4 documentation/status reconciliation, scoped diff check, and
`git diff --check`.

### Owner-decision dependencies
No new decisions; unresolved Gift Card voucher accounting classification stays
explicitly deferred.

### Explicit exclusions
Any checkout, tax, inventory, payment, Order, provider, UI, credential, or
Stage 5.5+ implementation.

### Completion criteria
Documentation is internally consistent, all approved policy is preserved, and
no implementation or invented business rule is present.

### ATLAS_STOP
After successful P3 completion:

Stage 5.4 — COMPLETE ✅
Stage 5.5 — Stripe Integration: READY — NOT STARTED

ATLAS_STOP:
Awaiting owner approval before Stage 5.5 — Stripe Integration.
