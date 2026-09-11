# Phase 1 — Core Architecture & Domain Foundation

## Objective

Create a stable modular application and domain foundation so all future AURA experiences share one source of truth.

## Dependencies

Phase 0 signed off. Existing cinematic components remain protected integration surfaces.

## Stages

### Stage 1.1 — Application Architecture

**Goal:** establish application boundaries and route organization without changing the cinematic experience.  
**Tasks:** accept modular-monolith architecture; record ADRs; centralize site configuration; add shared class utility; place `/` in a semantic route group.  
**Files:** `docs/`, `src/app/(cinematic)/page.tsx`, `src/config/site.ts`, `src/lib/cn.ts`.  
**Tests:** TypeScript, production build, route output comparison.  
**Status:** **COMPLETE**.

### Stage 1.2 — Environment Configuration

**Goal:** define typed public/server environment boundaries and examples without exposing secrets.  
**Tasks:** environment schema, server/public split, fail-fast rules, `.env.example`, documentation, ESLint setup assessment.  
**Tests:** valid configuration, missing-required-variable behavior, typecheck/build.  
**Status:** **COMPLETE**.

### Stage 1.3 — Framework Security Upgrade

**Goal:** move from vulnerable Next.js 14/React 18 to the officially supported Next.js 15.5.21 Maintenance LTS and React 19 baseline before server/database expansion.  
**Tasks:** update framework/runtime types and matching ESLint config; review upgrade changes; run audit, lint, typecheck, build, and cinematic regression checks.  
**Tests:** dependency tree valid; npm audit zero vulnerabilities; lint pass with five existing warnings; TypeScript pass; production build pass; headless Chrome renders title, CTA, and six worlds with no page errors.  
**Status:** **COMPLETE**.

### Stage 1.4 — MongoDB Foundation

Initialize the MongoDB driver, database configuration, client lifecycle, collection-validation/index policy, and health verification. No destructive migration is permitted.

**Decision change:** Owner selected MongoDB Atlas. ADR-012 supersedes the PostgreSQL + Prisma decision and the PostgreSQL-specific portion of the guest-cart decision.  
**Implementation:** Added the official MongoDB Node.js driver, server-only `src/server/db/mongodb.ts` client factory/promise cache, Stable API v1 configuration, bounded connection pool, and `npm run db:check` ping command.  
**Verification:** A structurally valid, ignored non-production `MONGODB_URI` was confirmed; `npm run db:check` passed without exposing credentials. No collection, validator, index, seed, or migration was created.  
**Status:** **COMPLETE**.

### Stage 1.5 — Product Domain

**Goal:** Define Product/ProductVariant/media/status/currency models, business invariants, repository contracts, and tests without creating a second source of truth in the cinematic UI.  
**Implementation:** Added Zod-backed product contracts, a server-only MongoDB repository, empty strict `products` collection initialization, unique slug/SKU and publication-listing indexes, and a collection verification command. Monetary amounts are integer minor units; variants own sellable volume, concentration, SKU, and price.  
**Boundaries:** Notes/families, collection membership, inventory quantities, and the six-world seed/mapping are deferred to their named stages. `HeroPortalExperience.tsx`, `FragranceWorlds.tsx`, and `FragranceWorldSection.tsx` were not changed.  
**Verification:** TypeScript, lint, production build, `npm audit --audit-level=high`, `npm run db:check`, and `npm run db:products:check` all pass. The product database check confirms strict validation, required indexes, and rejection of an incomplete document.  
**Status:** **COMPLETE**.

### Stage 1.6 — Collection Domain

**Goal:** Define data-driven collections with ordered product references, publication/visibility rules, and campaign media without duplicating canonical product facts.  
**Implementation:** Added Collection contracts, server-only MongoDB repository, product-reference checks, and strict empty `collections` collection initialization with slug, visibility, and reverse-membership indexes.  
**Verification:** Domain tests reject duplicate membership products/positions and empty public published collections. Database checks confirm validator/index presence and reject an incomplete collection document. No products, collections, campaign data, or cinematic mappings were seeded.  
**Status:** **COMPLETE**.

### Stage 1.7 — Fragrance Notes Domain

**Goal:** Define reusable fragrance taxonomy and product associations without duplicating Product facts or seeding cinematic products.
**Implementation:** Added normalized note/family contracts, explicit NOTE/INGREDIENT/ACCORD kinds, TOP/HEART/BASE ordering, product-note and product-family ID-only repositories, strict MongoDB validators/indexes, and safe initialization/check commands.
**Verification:** Domain validation rejects duplicate note/tier and position conflicts, invalid tiers, and duplicate families. MongoDB taxonomy initialization/checks pass; TypeScript, lint, build, connectivity, and security audit pass.
**Boundaries:** No six-world seed/mapping, notes UI/search service, storefront, commerce, or cinematic file changes.
**Status:** **COMPLETE**.

### Stage 1.8 — User & Address Domain

**Goal:** Define canonical user/profile/role/status and ownership-scoped saved addresses without implementing authentication.
**Implementation:** Added Zod user/address contracts, trim/lowercase email normalization, dedicated `users` and `addresses` collections, server-only repositories, ownership-scoped address methods, unique normalized-email and default-address indexes, and safe initialization/check commands.
**Decisions:** Addresses are separate documents for account CRUD, checkout lookup, ownership enforcement, and bounded user growth. Historical order address snapshots remain a distinct Stage 1.9 concept. No plaintext password or authentication field is stored.
**Verification:** Domain validation, MongoDB validator/index checks, TypeScript, lint, production build, connectivity, audit, and diff checks pass.
**Boundaries:** No Auth.js, sessions, login/register UI, passwords, email workflows, checkout, order, cart, or admin implementation.
**Status:** **COMPLETE**.

### Stage 1.9 — Order & Inventory Domain

**Goal:** Establish order and variant/SKU inventory primitives without implementing checkout or payments.
**Implementation:** Added immutable order item and shipping-address snapshots, integer money/totals invariants, separate order/payment/fulfillment/inventory reservation states, explicit order transition map, variant-level available/reserved/committed inventory, transaction-safe reserve/release/commit repositories, and strict MongoDB collections/indexes.
**Verification:** Domain checks reject zero/negative quantities, mismatched line/totals, and invalid status transitions. Atlas checks pass; a live concurrency check proves only one reservation succeeds for the last unit, release is guarded against duplication, and duplicate order numbers are rejected.
**Boundaries:** No cart, checkout UI, Stripe, PayPal, webhooks, tax/shipping providers, email, or cinematic changes. Saved addresses remain distinct from immutable order snapshots.
**Status:** **COMPLETE**.

### Stage 1.10 — Shared Validation

**Goal:** Provide small reusable validation primitives without a mega-schema or business-logic leakage.
**Implementation:** Added shared ID/ObjectId, email, slug, money/minor-unit, quantity, pagination/sort, country, timestamp, and safe-text primitives under `src/domain/shared`.
**Verification:** Shared primitive checks reject malformed IDs/emails/slugs, negative money/quantities, invalid country codes, and unsafe pagination. Product, collection, fragrance, user, and order regression checks pass.
**Boundary:** Inventory availability, reservation state, order transitions, ownership, and other business invariants remain in their owning domains.
**Status:** **COMPLETE**.

### Stage 1.11 — Error Architecture

**Goal:** Establish a shared error language and safe translation boundary before APIs and commerce surfaces.
**Implementation:** Added stable error codes/statuses, `AuraError`, safe public/server serialization, Zod/MongoDB/transaction translators, safe logging shape, and future HTTP mapping helpers.
**Verification:** Checks cover Zod validation, duplicate-key conflict, invalid transitions, insufficient inventory, unknown exceptions, cause retention, redaction of Mongo diagnostics, no stack leakage, and deterministic serialization.
**Boundaries:** No API routes, Auth.js, Cart, Checkout, payments, UI error pages, observability platform, or cinematic changes.
**Status:** **COMPLETE**.

### Stage 1.12 — Seed & Legacy Product Mapping Strategy

**Goal:** Move the six existing cinematic product facts into canonical MongoDB/domain data through deterministic, non-destructive initialization.
**Implementation:** Added a source manifest derived from the six current worlds, deterministic product/variant IDs and SKUs, idempotent product/collection/note/family seeding, and verification for mappings, uniqueness, and orphan references. Presentation metadata remains in the seed manifest only; no Hero/GSAP/component rewrite was made.
**Conflict record:** World 1 presents `Élixir` in the heading and `Élixir de Rose` in its explicit product label. The seed uses the more specific existing product label `Élixir de Rose`; this is documented rather than silently inventing a new name.
**Verification:** Seed ran twice without duplicate documents. Six mappings resolve to valid products; SKU/slug and relationship checks pass. TypeScript, lint, build, MongoDB checks, audit, and diff checks pass.
**Boundaries:** No Cart, storefront integration, checkout, payments, or Phase 8 cinematic integration was started.
**Status:** **COMPLETE**.

### Stage 1.13 — Foundation Integration Tests

**Goal:** Verify the Phase 1 foundation as one coherent system without adding product features.
**Implementation:** Added a safe integration verifier covering seeded product contracts, collection/taxonomy references, seed/runtime separation, and product/address snapshot immutability. Existing seed, database, domain, concurrency, shared-validation, and error checks were executed as the integration suite.
**Verification:** Seed rerun/idempotency, six-world mapping, all Phase 1 validator/index checks, MongoDB connectivity, user/order/inventory/error/shared checks, TypeScript, lint, production build, audit, and diff checks pass. No runtime component imports seed scripts; cinematic surface remains build-stable and unchanged by this stage.
**Status:** **COMPLETE**.

### Stage 1.14 — Phase 1 Sign-Off

**Final review:** Stages 1.1–1.13 are documented as complete with stage-specific verification. Final domain/integration, MongoDB, TypeScript, lint, production build, security audit, worktree, documentation, and cinematic-boundary checks passed. The global npm shim remains a host-environment issue; the local npm CLI was used for authoritative checks. Five existing lint warnings and the documented Next.js 15 bundle increase remain non-blocking technical debt.

**Acceptance review:** Product data is MongoDB/domain-owned; six deterministic cinematic mappings resolve without orphan references; validators, indexes, inventory transactions, snapshots, shared validation, and safe error translation were verified. Seed scripts are initialization-only and are not imported by runtime code. No secrets or tracked `.env` files were found; no pnpm lockfile or test artifact was introduced by Phase 1. The protected cinematic surface remains build-stable. Cart, checkout, payments, accounts/authentication, admin, storefront UI, shipping/tax, and Phase 8 cinematic integration remain intentionally deferred.

**Status:** **COMPLETE**.

## Phase Acceptance Criteria

- Database/domain layer is the defined product source of truth.
- Six cinematic products have deterministic domain mappings.
- Document shape, indexes, collection validation, money, inventory, transaction, and order-history rules are verified.
- Environment and error boundaries fail safely.
- Lint, typecheck, foundation tests, and production build pass.
- No regression or large rewrite of the cinematic homepage.

## Tests Performed

Stage 1.1: TypeScript and production build pass.  
Stage 1.2: valid public environment passes; invalid public URL fails fast; lint passes with five pre-existing warnings; TypeScript and production build pass. Dependency audit found five high-severity findings and created Stage 1.3.
Stage 1.3: Next.js/React dependency tree valid; npm audit reports zero vulnerabilities; lint passes with five existing warnings; TypeScript and production build pass; headless Chrome smoke test reports no page errors and confirms all six worlds.
Stage 1.4: MongoDB Atlas `ping` via `npm run db:check` passes; the driver is installed; lint passes with five existing warnings; TypeScript and production build pass; npm audit reports zero vulnerabilities.
Stage 1.5: Product collection initialization and validation/index check pass; lint passes with five existing warnings; TypeScript and production build pass; npm audit reports zero vulnerabilities. No seed product data was written.
Stage 1.6: Collection domain contract check and database validator/index check pass; no seed data was written.
Stage 1.7: Fragrance taxonomy domain validation and MongoDB validator/index checks pass; no taxonomy or cinematic seed data was written.
Stage 1.8: User/address validation and MongoDB validator/index checks pass; ownership/default rules remain repository-scoped; no authentication was implemented.
Stage 1.9: Order/inventory domain checks, transaction-safe concurrency/release checks, and MongoDB validator/index checks pass; no commerce integrations were added.
Stage 1.10: Shared primitive validation and regression checks pass across current domains.
Stage 1.11: Error translation/serialization checks pass for validation, MongoDB conflicts, domain errors, unknown failures, redaction, and deterministic output.
Stage 1.12: Deterministic cinematic seed ran twice without duplicates; mapping, SKU, relationship, and orphan checks pass; cinematic components were not modified.

## Known Issues

- Global npm shim is broken in the host environment.
- Existing lint warnings cover root-layout font loading and native images.
- Next.js 15/React 19 shared runtime increases `/` first-load JavaScript from the Phase 0 143 kB baseline to 159 kB; functionality-specific route code remains approximately 56.5 kB.

## Architecture Decisions

See `../decisions/ARCHITECTURE-DECISIONS.md`.

## Final Sign-Off

Stage 1.4 sign-off: **APPROVED — COMPLETE**.  
Stage 1.5 sign-off: **APPROVED — COMPLETE**. Pending completion of Stages 1.6–1.14.
Stage 1.6 sign-off: **APPROVED — COMPLETE**.
Stage 1.7 sign-off: **APPROVED — COMPLETE**.
Stage 1.8 sign-off: **APPROVED — COMPLETE**.
Stage 1.9 sign-off: **APPROVED — COMPLETE**.
Stage 1.10 sign-off: **APPROVED — COMPLETE**.
Stage 1.11 sign-off: **APPROVED — COMPLETE**.
Stage 1.12 sign-off: **APPROVED — COMPLETE**.
Stage 1.13 sign-off: **APPROVED — COMPLETE**.
Stage 1.14 sign-off: **APPROVED — COMPLETE**. Phase 1 is complete. Stage 2.1 is ready but not started.

## Phase 1 Sign-Off

**PHASE 1 — APPROVED / COMPLETE**

The AURA MongoDB/domain foundation is accepted as the source of truth for commercial product data. Final verification passed without starting Phase 2. Non-blocking warnings and deferred commerce/experience work remain documented in `PROJECT-STATUS.md` and `TESTING.md`.
