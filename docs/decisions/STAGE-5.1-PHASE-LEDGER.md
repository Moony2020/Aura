# Stage 5.1 — Checkout Architecture Phase Ledger

Status: COMPLETE — architecture/contracts only; runtime implementation not started

This ledger is limited to architecture and contracts. It does not authorize
provider integration, credentials, payment mutations, checkout UI, or any
later Phase 5 stage.

## P1 — Checkout Domain Boundaries & Lifecycle Contracts

### Goal

Define the server-authoritative boundaries between Cart, checkout preparation,
Order, Payment, inventory, pricing, tax, shipping, discounts, Gift Cards, and
provider adapters.

### Scope

- Define the conceptual checkout lifecycle and allowed state transitions.
- Define the Order/Payment relationship without creating either at runtime.
- Preserve immutable Order line-item and address snapshot principles.
- Define server revalidation requirements for price, sellability, inventory,
  tax, shipping, discounts, and Gift Cards.
- Define the existing checkout-time inventory reservation boundary.
- Define failure, cancellation, pending, and retry contract placeholders only
  where authoritative policy already exists.

### Allowed documents/contracts

- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/DATABASE.md`
- `docs/decisions/ARCHITECTURE-DECISIONS.md`
- `docs/phases/PHASE-05-PAYMENTS.md`
- New Stage 5.1 architecture/decision documentation only.

### Invariants

- Browser input never controls price, totals, inventory, payment state,
  ownership, tax result, shipping eligibility, or discount authority.
- Cart remains purchase intent; adding to Cart does not reserve inventory.
- Inventory reservation remains a checkout/payment-preparation boundary and
  uses the existing reservation lifecycle.
- Money remains integer minor units with server-side calculation.
- Order history facts use immutable historical snapshots and are not rebuilt
  from current Product or Address data.
- Payment proof comes from trusted provider API state and/or verified webhook;
  browser redirects are not payment proof.
- Stripe and PayPal remain separate provider adapters/boundaries.
- Raw card data, CVV, and provider secrets never enter AURA storage or docs.
- Stage 5.1 creates no Order, Payment, reservation, provider session, or
  provider-side order.

### Required evidence

- Contract map showing Cart → checkout preparation → Order/Payment boundaries.
- State/lifecycle diagram or equivalent transition table.
- Data-authority table identifying server, provider, and browser roles.
- Provider boundary table for Stripe, PayPal, and deferred wallets.
- Search evidence that no API key, webhook secret, provider SDK integration,
  Payment Intent, PayPal Order, checkout mutation, or checkout UI was added.
- Documentation/status check and `git diff --check`.

### Owner Decisions

- Tax jurisdiction/calculation — **OWNER DECISION REQUIRED**.
- Shipping pricing/eligibility — **OWNER DECISION REQUIRED**.
- Inventory reservation timing — **ALREADY AUTHORITATIVE**: reservation is
  near checkout/payment preparation, not Cart mutation.
- Inventory reservation duration/expiry policy — **OWNER DECISION REQUIRED**.
- Guest checkout identity/lifecycle — **OWNER DECISION REQUIRED**.
- Discount stacking — **ALREADY AUTHORITATIVE**: one-discount-at-a-time
  evaluation; no stacking is introduced here.
- Discount priority when multiple candidates qualify — **OWNER DECISION
  REQUIRED** unless an existing implementation contract is found.
- Gift Card application/liability — **OWNER DECISION REQUIRED**; existing
  Gift Card storage/ledger principles do not authorize checkout redemption.
- Final Payment/Order state transitions — **OWNER DECISION REQUIRED**;
  webhook/provider authority is accepted, but the complete state machine is
  not defined by the current authority.

### Explicit exclusions

- Stripe or PayPal integration.
- API keys, webhook secrets, sandbox credentials, or live credentials.
- Payment Intent, PayPal Order, provider session, or webhook creation.
- Checkout Order or Payment creation.
- Inventory reservation implementation or persistence mutation.
- Checkout UI, address/delivery UI, shipping selection UI, or payment UI.
- Changes to Cart, Wishlist, Address, Order History, Auth.js, or Phase 4.
- Stage 5.2 through Stage 5.15 and Phase 6+.

### Completion criteria

- Architecture/contracts are documented without inventing unresolved policy.
- Each listed policy point is classified as `ALREADY AUTHORITATIVE` or
  `OWNER DECISION REQUIRED`.
- Payment Credentials Policy is recorded and preserved.
- No runtime or persistence implementation is introduced.
- Required evidence passes.

### ATLAS_STOP

Awaiting owner approval before Stage 5.1 architecture implementation.

## P2 — Provider, Payment & Data-Integrity Contract Review

### Goal

Review the provider-neutral contracts and confirm that Stripe and PayPal can
be introduced later without coupling AURA to browser-controlled payment state.

### Scope

- Specify the minimum provider adapter interface at contract level only.
- Specify trusted API/webhook confirmation requirements.
- Specify redaction and secret-boundary requirements.
- Confirm deferred Apple Pay/Google Pay handling through a later eligibility
  stage based on actual provider support.

### Allowed documents/contracts

- Stage 5.1 architecture documents and accepted ADRs only.

### Invariants

- Stripe and PayPal adapters remain independently replaceable and testable.
- Provider-specific credentials are owner-supplied only in later integration
  stages.
- Redirect return data may assist navigation but cannot settle payment.

### Required evidence

- Provider-neutral adapter contract.
- Payment-proof and webhook-authority contract.
- Secret/redaction checklist.
- No provider SDK or credential diff.

### Owner Decisions

- Any provider-specific behavior not covered by the approved Payment
  Architecture remains `OWNER DECISION REQUIRED`.

### Explicit exclusions

All provider integration, credentials, webhooks, payment creation, and UI.

### Completion criteria

The provider boundaries are documented and no integration behavior exists.

### ATLAS_STOP

Awaiting owner approval before the next Stage 5.1 subphase.

## P3 — Contract Audit & Documentation Reconciliation

### Goal

Reconcile Stage 5.1 documents and prove that the architecture-only scope was
preserved.

### Scope

- Reconcile current-status documentation.
- Verify all exclusions and owner decisions remain explicit.
- Run scoped diff and documentation checks.

### Allowed documents/contracts

Stage 5.1 documents, project status, roadmap, architecture, API, database, and
accepted decision records.

### Invariants

- No later stage is started automatically.
- No credentials or secrets appear in evidence.
- Unresolved policy is not represented as implemented behavior.

### Required evidence

- Documentation/status checker — PASS.
- `git diff --check` — PASS.
- Stage 5.1 scoped diff check — PASS.
- Explicit list of deferred owner decisions.

### Owner Decisions

Any newly discovered business policy or architecture expansion requires a new
owner decision before implementation.

### Explicit exclusions

No Stage 5.2+ work, provider integration, runtime mutation, or Phase 6 work.

### Completion criteria

Stage 5.1 architecture/contracts are documented and audited, with no runtime
implementation or unresolved policy silently invented.

### ATLAS_STOP

Awaiting owner approval before the next phase.
