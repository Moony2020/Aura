# Stage 5.2 — Contact & Delivery Address Phase Ledger

Status: COMPLETE — P0, Owner Decisions, Phase Ledger, P1, P2, and P3 complete; no checkout runtime implementation started

This ledger is bound to the approved Stage 5.2 P0 contract and Owner
Decisions. It does not authorize checkout UI, persistence, or runtime changes.

## P1 — Contact & Address Contract Boundaries

### Goal

Define the server-authoritative contact, delivery-address, and optional billing
address contracts for guest and authenticated checkout.

### Scope

- Map checkout contact data to the existing canonical validation boundaries.
- Preserve optional phone by default.
- Define delivery address as the required shipping context where applicable.
- Define billing address as optional, defaulting to delivery address.
- Permit a separately validated billing address when the customer selects one.
- Preserve server-derived ownership and guest identity rules.

### Allowed files/contracts

- `docs/decisions/STAGE-5.2-GOAL-CONTRACT.md` or equivalent P0 record.
- `docs/decisions/STAGE-5.1-CHECKOUT-ARCHITECTURE.md`
- `docs/decisions/ARCHITECTURE-DECISIONS.md` ADR-015 and ADR-016.
- Existing User/Address schemas and validation contracts.
- `docs/DATABASE.md`, `docs/API.md`, and `docs/SECURITY.md`.

### Invariants

- Browser input never supplies `userId`, `ownerId`, `customerId`, or `accountId`.
- Authenticated ownership derives from the existing Auth.js/sessionVersion/
  canonical User authority.
- Guest identity remains opaque and server-controlled.
- Phone is optional by default; conditional requirement belongs to a verified
  later shipping-method rule.
- Saved Address records remain mutable Address-domain data.
- Checkout address data does not become an immutable Order snapshot until the
  later Order-creation boundary.

### Evidence

- Contract map for contact, delivery, and billing inputs.
- Field authority and validation table.
- Cross-user and guest ownership boundary review.
- Confirmation that no new global required field was invented.

### Explicit exclusions

- Checkout UI or form implementation.
- Checkout persistence or draft collection.
- Address CRUD changes.
- Shipping, tax, payment, Order, or inventory runtime.

### Completion criteria

The contact/delivery/billing contract is documented without changing the
existing Address domain or inventing global field requirements.

### ATLAS_STOP

Awaiting owner approval before P2.

## P2 — Checkout-Lifetime Address Data & Snapshot Boundary

### Goal

Define how contact and address data may exist during an active checkout while
preserving the distinction between checkout data, saved Addresses, and future
immutable Order snapshots.

### Scope

- Permit checkout-lifetime data only within the authoritative ACTIVE checkout
  attempt/session when later persistence is implemented.
- Do not create a separate long-lived checkout-address-draft domain.
- Do not automatically save guest or authenticated checkout edits to Address.
- Allow saved account Addresses to prefill checkout without using them as
  historical Order references.
- Preserve billing-same-as-delivery default behavior and separate billing
  validation when selected.

### Allowed files/contracts

- Stage 5.1 architecture contracts.
- Stage 5.2 P0 contract and Owner Decisions.
- Existing Address and Order snapshot schemas/contracts.

### Invariants

- No permanent checkout-address draft collection or account resource.
- Checkout-lifetime data is server-owned, expires with the checkout lifecycle,
  and does not create an account Address automatically.
- Editing checkout fields never overwrites a saved Address.
- A saved Address is copied into a later Order snapshot by value, not by live
  reference.
- Billing address is not globally required and defaults to delivery address.

### Evidence

- Data-lifecycle diagram from saved Address/checkout data to Order snapshot.
- Proof that no draft schema or runtime mutation is introduced.
- Billing-same-as-delivery and separate-billing contract review.

### Explicit exclusions

- Checkout persistence implementation.
- Order creation or snapshot writes.
- Shipping/tax/payment provider integration.
- Address-book auto-save, checkout UI, and Stage 5.3+.

### Completion criteria

The checkout-lifetime and immutable-snapshot boundaries are explicit, with no
new durable draft domain or implicit Address mutation.

### ATLAS_STOP

Awaiting owner approval before P3.

## P3 — Contract Audit & Documentation Reconciliation

### Goal

Reconcile Stage 5.2 contracts and prove that implementation has not started.

### Scope

- Verify P0 decisions and the P1/P2 boundaries remain consistent.
- Reconcile current-status documentation.
- Confirm Stage 5.3 and later stages remain not started.

### Allowed files/contracts

Stage 5.2 contracts, Phase 5 status/roadmap, Address/Order architecture,
database/API/security documents, and accepted ADRs.

### Invariants

- Phone remains optional by default.
- Billing defaults to delivery and may be separate when selected.
- No new global mandatory address fields.
- No long-lived checkout-address draft.
- Saved Address remains distinct from immutable Order snapshot.
- No UI, persistence, shipping, tax, payment, Order, or inventory runtime.

### Evidence

- Documentation/status reconciliation check.
- Stage 5.2 scoped diff check.
- `git diff --check`.
- Explicit unresolved-policy review for later shipping-method conditions.

### Explicit exclusions

- Any implementation, runtime verification, or Stage 5.3+ work.

### Completion criteria

Documentation is internally consistent and the approved Stage 5.2 contract is
preserved without implementation.

### ATLAS_STOP

Awaiting owner approval before Stage 5.2 implementation.
