# Stage 5.3 — Shipping Methods Phase Ledger

Status: Phase Ledger COMPLETE — implementation not started

This ledger is bound to the approved Stage 5.3 P0 contract and Owner
Decisions. It does not authorize shipping runtime, persistence, UI, carrier
integration, tax, or any later Phase 5 stage.

## P1 — Shipping Eligibility & Method Contract

### Goal
Define the initial server-authoritative shipping destination and method contract.

### Scope
- Sweden-only destination eligibility.
- One customer-facing method: `STANDARD_DELIVERY` / Standard Delivery.
- Carrier-neutral presentation; no pickup, Express, same-day, economy, or carrier alternatives.
- No general weight/size rule; phone remains optional unless a later verified carrier rule applies.

### Allowed files/contracts
Stage 5.3 P0/Owner Decisions, Stage 5.2 contracts, Stage 5.1 checkout contract,
architecture/API/database/security docs, accepted ADRs, and Phase 5 docs.

### Invariants
- Address validation precedes Sweden eligibility evaluation.
- Unsupported destinations produce no eligible method.
- Eligibility, method, and carrier authority remain server-side.
- Shipping tax treatment remains owned by Stage 5.4.

### Required evidence
Destination/method contract table, invalid-destination authority review, no-carrier/no-pickup confirmation, and preservation of Stage 5.2 address/phone rules.

### Explicit exclusions
Shipping runtime, ShippingQuote persistence, checkout UI, carrier API, tax calculation, and Stage 5.4+.

### Completion criteria
The initial destination and method contract is documented without runtime implementation or unsupported carrier assumptions.

### ATLAS_STOP
Awaiting owner approval before P2.

## P2 — Price, Threshold & Estimate Contract

### Goal
Define Standard Delivery price, free-shipping threshold, and estimate without implementing quote calculation.

### Scope
- Standard Delivery: `5900` minor units / `59 SEK`.
- Free Standard Delivery at eligible order value `>= 799 SEK`.
- Order value affects shipping price only; it does not make Standard Delivery unavailable.
- Estimate: 2–4 business days, non-guaranteed.
- No weight/size tiers, fallback price, or silent method substitution.

### Allowed files/contracts
Stage 5.3 P0/Owner Decisions, P1 contract, Stage 5.1 pricing contract, accepted ADRs, and Phase 5 docs.

### Invariants
- Price and threshold are server-authoritative.
- `< 799 SEK` → `59 SEK`; `>= 799 SEK` → `0 SEK`.
- Shipping tax remains Stage 5.4.
- Stale/invalid/unavailable quote blocks checkout rather than falling back.

### Required evidence
Price/threshold/estimate table, minor-unit/currency review, tax deferral confirmation, and no runtime quote/persistence diff.

### Explicit exclusions
ShippingQuote runtime/persistence, tax, carrier, checkout, payment, Order, inventory, and Stage 5.4+.

### Completion criteria
Initial price, threshold, and estimate policy are documented without invented tax, carrier, or fallback behavior.

### ATLAS_STOP
Awaiting owner approval before P3.

## P3 — Contract Audit & Documentation Reconciliation

### Goal
Reconcile Stage 5.3 documentation and prove that shipping remains architecture/contracts only.

### Scope
- Verify all twelve P0 decisions.
- Reconcile current-status documentation.
- Confirm Stage 5.4+ remain not started and no runtime/UI/carrier work was introduced.

### Allowed files/contracts
Stage 5.3 contracts, Phase 5 status/roadmap, Stage 5.1/5.2 contracts, accepted ADRs, and API/database/security docs.

### Invariants
Sweden-only; Standard Delivery only; `59 SEK`/`799 SEK`; carrier-neutral; no pickup;
2–4 business days non-guaranteed; phone optional; no general weight/size policy;
no eligible method blocks checkout; shipping tax remains Stage 5.4.

### Required evidence
Stage 5.3 documentation/status reconciliation, scoped diff check, and `git diff --check`.

### Explicit exclusions
Shipping runtime, ShippingQuote persistence, carrier API, checkout UI, tax, inventory, payment, Order, and Stage 5.4+.

### Completion criteria
Documentation is internally consistent and the approved policy is preserved without implementation or invented rules.

### ATLAS_STOP
Awaiting owner approval before Stage 5.3 implementation.
