# AURA Changelog

Meaningful engineering changes are recorded by phase and stage.

## 2026-09-10 — Stage 4.2 P3.4 Final Integration Audit

Verified:
- Stage 4.2 registration and email-verification persistence, transport, UI, Atlas, regression, security, TypeScript, ESLint, production build, and direct npm audit checks pass.
- Gift Card integration cleanup passes after removing the exact residue fixture left by an interrupted earlier run; no broad data cleanup was performed.
- Repo-wide `git diff --check` remains non-zero only for documented unrelated baseline whitespace; the Stage 4.2-scoped check passes and the dirty worktree was preserved.

Status:
- Phase 3 — Commerce: APPROVED / COMPLETE.
- Stage 4.2 — Registration & Email Validation: COMPLETE.
- Stage 4.3 — Login, Logout & Sessions: READY — NOT STARTED.

## 2026-09-10 — Stage 4.1 Owner Decision: Credentials + JWT Sessions

Accepted:
- Owner-approved initial authentication architecture: email/password Credentials through Auth.js with JWT sessions.
- JWT claims remain minimal: canonical `userId`/subject plus a comparison `sessionVersion`; canonical AURA User status, role, ownership, and profile data remain server-authoritative.
- `authCredentials.sessionVersion` is the server-controlled revocation value. Password changes, successful password resets, sign-out-everywhere, account disablement, and security-driven forced logout are enforced by version/status policy in future protected boundaries.
- `authTokens` remains separate for single-use verification/recovery token digests. `authSessions` is not a current persistence requirement, and `@auth/mongodb-adapter` is not part of the initial path.

Status:
- Stage 4.1 — Authentication Architecture: COMPLETE.
- Stage 4.2 — Registration & Email Validation: READY — NOT STARTED.
- No Auth.js package, runtime, route, UI, or registration behavior was added in this documentation-only closure.

## 2026-09-10 — Stage 4.1 Auth.js Credentials/Session Compatibility Closure

Verified:
- Published metadata: `next-auth@5.0.0-beta.32` depends on `@auth/core@0.41.3`; the latest `@auth/mongodb-adapter@3.11.3` declares `mongodb ^6`, while AURA uses driver 7.5.0.
- Published core source and a disposable no-Atlas reproduction both return `UnsupportedStrategy` for Credentials-only plus `session.strategy: "database"`.
- The same reproduction with JWT strategy returns HTTP 200. No unused provider, Auth.js internal patch, AURA dependency, or application-code change was used.

Status:
- Stage 4.1 is `IMPLEMENTED / COMPATIBILITY VERIFICATION PENDING`; Stage 4.2 remains NOT STARTED pending an owner-approved supported session strategy.

## 2026-09-10 — Stage 4.1 Authentication Architecture

Added:
- Auth.js/AURA boundary documentation preserving the canonical AURA `users` domain for identity, status, roles, ownership, and authorization.
- Explicit database-session decision and future `authCredentials`, `authSessions`, and `authTokens` persistence contracts without creating collections or adding Auth.js.
- Credentials-only initial method scope, Argon2id target, secure cookie/CSRF/rate-limit/error/cache policies, route/layout boundaries, and Stage 4.8 Cart/Wishlist merge deferral.
- `domain:auth:architecture:check` static verification.

Verified:
- Architecture-only scope: no authentication runtime, account UI, password, session, recovery, email, provider, fixture, or business-data change was introduced.
- Stage 4.2 is READY — NOT STARTED; no later Phase 4 stage was started.

## Stage 3.12 — Phase 3 Sign-Off

- Localized and fixed the HTTP 404 regression to the root/storefront streaming `loading.tsx` boundaries; valid routes remain 200 and archived, unknown, or hidden resources now return actual 404.
- Added `domain:storefront:http-status:check` with status, final URL, and response-length evidence; it passes against a fresh production server.
- Corrected the current catalog inventory reference to 60 sellable variants / 60 UNTRACKED without changing historical Stage 3.6 evidence.
- Full commerce/storefront regressions, Atlas checks, TypeScript, ESLint, production build, and npm audit pass. Phase 4 remains READY — NOT STARTED.

## Stage 3.11 — Commerce Integration Tests

- Added the consolidated `domain:commerce:integration:check` runner while retaining every stage-specific check.
- Verified Atlas initializer idempotency, validators/indexes, Cart/Wishlist/Discount/Gift Card boundaries, cinematic ACQUIRE integration, cleanup, and cross-domain security.
- No business-code defect, schema expansion, UI feature, or Phase 8 scope change was required. A test-harness exit fix was added so the Wishlist collection check terminates after a successful result.

## 2026-08-18 — Stage 3.6 Quantity & Inventory Validation

Added:
- Real PDP Add to Bag via strict Server Action and existing `CartService`.
- Inventory-aware Add/Increase validation using target line quantity and current Inventory Domain state.
- Quantity `+ / −` steppers in the Cart Drawer and full `/cart` page with semantic buttons, accessible names, pending state, and live feedback.
- Safe cart view flags: `quantityValid`, `canIncrement`, and `canDecrement`.
- Cart drawer open request event for successful PDP Add, while keeping cart state server-authoritative.
- `domain:cart:inventory:check` integration check and updated cart/page/drawer/PDP/commerce guardrails.

Guardrails:
- Cart mutations still do not reserve, release, or commit inventory.
- UNTRACKED and OUT_OF_STOCK cannot be newly added/incremented under the current policy.
- Failed inventory validation does not create an orphan guest cart.
- No fake stock was added to the 36 current sellable variants; catalog inventory remains 36 UNTRACKED.
- No quick add, Buy Now, checkout, payment, Wishlist, Auth.js, inventory admin, or cinematic `ACQUIRE` integration was introduced.

Verified:
- `domain:cart:inventory:check`, `domain:cart:persistence:check`, `domain:cart:drawer:check`, `domain:cart:page:check`, `domain:commerce:architecture:check`, `domain:storefront:product-detail:check`, TypeScript, and local ESLint pass or are documented in the Stage 3.6 handoff.

## 2026-08-18 — Stage 3.5 Full Cart Page

Added:
- Private non-indexable `/cart` storefront route with server-authoritative initial cart read.
- Maison full Cart page with empty/error/content states, canonical line presentation, responsive line/summary layout, central money formatting, Remove/Clear mutations, and conflict refresh.
- Safe Header/Drawer/Page synchronization through the returned cart view model.
- Real View Bag link from the Cart Drawer.
- Stage 3.5 cart page contract check.

Guardrails:
- `/cart` is dynamic, while discovery routes remain outside the cookie read boundary; production build still reports `/` as static.
- No checkout, `/checkout`, quantity controls, PDP Add to Bag, wishlist, Auth.js, payment, inventory reservation, order creation, or cinematic `ACQUIRE` integration was introduced.

Verified:
- `domain:cart:page:check`, `domain:cart:drawer:check`, `domain:cart:persistence:check`, `domain:commerce:architecture:check`, HTTP smoke for `/cart`, TypeScript, local ESLint, production build, npm audit, and `git diff --check` pass or are documented in the Stage 3.5 handoff.

## 2026-08-18 — Stage 3.4 Cart Drawer

Added:
- Real Header Shopping Bag trigger and badge using total-unit `itemCount`.
- Isolated `StorefrontCartAction` client boundary with AURA Cart Drawer, loading/empty/error/content states, accessible modal lifecycle, body scroll lock/restoration, responsive layout, and reduced-motion-aware loading state.
- Minimal Server Action bridge for reading current cart, removing a line, and clearing the bag.
- Stage 3.4 drawer contract check.

Guardrails:
- StorefrontHeaderShell remains server-rendered and does not read cart cookies, preserving discovery-route caching.
- Drawer renders only the Stage 3.3 safe cart view model and central money formatting.
- No `/cart` page, checkout, PDP Add to Bag, quantity stepper, wishlist, Auth.js, payment, inventory reservation, or cinematic `ACQUIRE` integration was introduced.

Verified:
- `domain:cart:drawer:check`, `domain:cart:persistence:check`, `domain:commerce:architecture:check`, TypeScript, local ESLint, production build, npm audit, and `git diff --check` pass or are documented in the Stage 3.4 handoff.

## 2026-08-18 — Stage 3.3 Guest & Account Cart Persistence

Added:
- Server-only `MongoCartRepository` and cart application service for guest/account read and mutations.
- Cryptographic guest cart token generation, SHA-256 hash lookup, and centralized `aura_guest_cart` cookie descriptors.
- Cart persistence contract checks covering no-read-create behavior, first mutation creation, persistence across reads, malformed/expired cookie handling, expiry rotation, trusted USER cart persistence, Product/Variant validation, current price freshness, duplicate add behavior, optimistic concurrency, update/remove/clear, no inventory reservation, UNTRACKED behavior, and token non-storage.

Guardrails:
- No Cart Drawer, Full Cart Page, PDP Add to Bag wiring, wishlist, checkout, Auth.js, payments, or cinematic `ACQUIRE` integration was introduced.
- Cart documents still do not store price/product/inventory snapshots; the view model resolves current ProductVariant money in integer minor units.

Verified:
- `domain:cart:check`, `db:carts:check`, `domain:commerce:architecture:check`, `domain:cart:persistence:check`, TypeScript, local ESLint, production build, npm audit, and `git diff --check` pass or are documented in the Stage 3.3 handoff.

## 2026-08-18 — Stage 3.1 Commerce Architecture

Added:
- Phase 3 commerce architecture covering guest cart identity, future account ownership/merge, lifecycle, line identity, money authority, inventory boundaries, mutation contracts, server/client transport, caching, concurrency, expiry, wishlist, discounts, gift cards, cinematic `ACQUIRE`, and security/error behavior.
- ADR-022 through ADR-025 for guest cart identity, cart pricing/inventory authority, shared mutation transport, and lifecycle/merge/concurrency policy.
- `domain:commerce:architecture:check` to verify Stage 3.1 stayed architecture-only and did not introduce cart implementation.

Changed:
- Corrected `PROJECT-STATUS.md` so Next Phase points to Phase 4 after Phase 3 sign-off.
- Moved the checkpoint to the next Phase 3 stage at the time; later Stage 3.3 completed the persistence layer and moved the checkpoint to Stage 3.4 ready/not started.

Verified:
- No cart collection/schema/UI, Add to Bag, wishlist, checkout, Auth.js, payments, or cinematic commerce integration was started.
- TypeScript, local ESLint, production build, full npm audit, `git diff --check`, and storefront regressions pass.

## 2026-08-18 — Stage 3.2 Cart Data Model

Added:
- Cart domain contract with GUEST/USER owner union, ACTIVE/CONVERTED/EXPIRED lifecycle, embedded canonical lines, duplicate-line rejection, positive integer quantities, version `0`, guest `expiresAt`, and no commercial/product/inventory snapshots.
- MongoDB `carts` collection initialization and verification scripts with strict validator and one-active-cart indexes.
- ADR-026 for one active cart per owner with embedded cart lines.

Verified:
- `domain:cart:check`, `db:carts:init`, `db:carts:check`, `domain:commerce:architecture:check`, storefront/foundation regressions, TypeScript, local ESLint, production build, full npm audit, and `git diff --check` pass.

Deferred:
- No guest cookie flow, cart services, Server Actions, Route Handlers, Cart UI, Add to Bag, wishlist, checkout, Auth.js, payments, inventory reservation from cart, or cinematic commerce integration was started.

## 2026-08-18 — Stage 2.13 Phase 2 Sign-Off

Changed:
- Completed final Phase 2 storefront/product-discovery review and moved the project checkpoint to Phase 3 Stage 3.1 ready/not started.
- Updated the foundation integration assertion for the current Phase 2 product archival policy while preserving seed/runtime separation and six cinematic mappings.

Verified:
- Storefront, search, filters, PDP, collections, New Arrivals, responsive/accessibility, money, cinematic mapping, and foundation integration checks pass.
- Database verification confirms 30 published catalog products, 10/10/10 audience integrity, hidden cinematic collection, minor-unit prices, no old dollar-price variants, and no invented New Arrivals.
- TypeScript, local ESLint, production build, full npm audit, and `git diff --check` pass.

Known non-blocking issues:
- Broken global npm shim, one root-layout font warning, Windows line-ending warnings, and missing browser automation for pixel-level responsive checks.

## 2026-08-18 — Stage 2.11 New Arrivals

Added:
- `/new-arrivals` as a real storefront route backed by canonical Product merchandising data.
- Optional Product `launchAt` with MongoDB validation/index migration for owner-approved commercial launch timing.
- Shared live New Arrivals desktop/mobile navigation and Stage 2.11 contract checks.

Guardrails:
- New Arrivals uses `launchAt`, never technical `createdAt`.
- No product is invented as New Arrival; with zero approved `launchAt` values, the route intentionally renders a Maison empty state.
- Canonical Product Cards, minor-unit money formatting, PDP links, and published-product guards are reused.

Verified:
- Stage 2.11 checks, storefront regression checks, TypeScript, production build, npm audit, and `git diff --check` pass.

## Phase 0 — Audit & Baseline

Added:
- Permanent repository documentation protocol and Phase 0 audit record.

Verified:
- TypeScript passes.
- Next.js production build passes.
- Lint and automated-test gaps are documented.

Worktree:
- Removed the unintended, untracked `pnpm-lock.yaml` produced while working around the broken global npm shim.
- Retained the tracked npm `package-lock.json` as package-manager authority.

## Phase 1 — Stage 1.1 Application Architecture

Added:
- Modular-monolith architecture and ADR register.
- Central non-secret site configuration and shared `cn` class utility.
- App Router route group for the preserved cinematic `/` route.

Modified:
- Moved only the homepage route entry point; cinematic components and behavior were not rewritten.

Database:
- No schema changes.

Tests:
- TypeScript: PASS.
- Production build: PASS.
- Lint: not configured; tracked as foundation work.

## Phase 1 — Stage 1.2 Environment Configuration

Added:
- Zod-validated public build configuration and server-only environment schema.
- `.env.example` containing named placeholders without real secrets.
- Non-interactive Next.js ESLint configuration and `typecheck` script.

Modified:
- Cinematic video URL lookup now uses the centralized typed public environment module.
- Client validation was moved to build configuration after bundle testing showed Zod would add approximately 14 kB to the route; final route is approximately 1 kB over Phase 0.

Dependencies:
- Added Zod, ESLint 8.57.1, and matching Next.js 14 ESLint configuration. The npm-generated `package-lock.json` change is intentional.

Tests:
- Valid public environment: PASS.
- Invalid public URL rejection: PASS.
- Lint: PASS with five existing warnings.
- TypeScript: PASS.
- Production build: PASS.
- npm audit: five high-severity findings; Stage 1.3 added for remediation.

## Phase 1 — Stage 1.3 Framework Security Upgrade

Upgraded:
- Next.js 14.2.35 → 15.5.21 Maintenance LTS.
- React / React DOM 18.3.1 → 19.2.8.
- React TypeScript types and `eslint-config-next` to matching supported versions.
- Next.js-required TypeScript target to ES2017.

Security:
- Overrode Next's vulnerable transitive PostCSS and Sharp versions with PostCSS 8.5.26 and Sharp 0.35.3.
- npm audit reduced from five high-severity findings to zero vulnerabilities.

Tooling:
- Migrated the lint script from deprecated `next lint` to the ESLint CLI.
- `package-lock.json` was intentionally regenerated by npm for the framework, React, validation, lint, and security dependency changes. Its large diff also reflects npm normalization and updated transitive resolutions; this is an approved Stage 1 dependency migration, not an audit artifact.

Tests:
- Dependency tree: PASS.
- Lint: PASS with five existing warnings.
- TypeScript: PASS.
- Production build: PASS.
- Headless Chrome cinematic smoke test: PASS with zero page errors.

## Phase 1 — Stage 1.4 Database Foundation Checkpoint

Discovered:
- Local PostgreSQL 18 service is running on port 5432.
- No database connection variable exists in `.env.local`.
- Passwordless local access is rejected; Docker Desktop is not running.

Status:
- Superseded by the owner-selected MongoDB Atlas architecture; see ADR-012.

## Phase 1 — Stage 1.4 MongoDB Foundation Decision

Changed:
- The owner selected MongoDB Atlas as AURA's database platform.
- ADR-012 supersedes ADR-003 and the PostgreSQL-specific part of ADR-006.
- Environment naming changed from `DATABASE_URL` to the server-only `MONGODB_URI` placeholder. No secret value is tracked or recorded.

Status:
- BLOCKED until a structurally valid, non-production `MONGODB_URI` is visible to the application in ignored `.env.local`.
- No MongoDB dependency, database client, collection validator, index, seed, or migration has been created.

## Phase 1 — Stage 1.4 MongoDB Foundation Completion

Added:
- Official `mongodb` Node.js driver 7.5.0 and the `db:check` script.
- Server-only reusable MongoDB client with Stable API v1, a bounded pool, and development hot-reload caching.

Verified:
- Owner-provided non-production MongoDB Atlas connection via an admin `ping`.
- `.env.local` is ignored; connection data was neither printed nor tracked.
- Lint passes with five known warnings; TypeScript, production build, and high-severity dependency audit pass.

Deferred:
- Domain collections, validators, indexes, data migrations, and seeds begin in their owning stages.

## Phase 1 — Stage 1.5 Product Domain

Added:
- Canonical Product, Variant, Media, Money, lifecycle, and concentration contracts with Zod invariants.
- Server-only MongoDB product repository interface and adapter.
- Idempotent product-collection initialization and verification commands.
- Strict empty `products` collection validator plus unique slug/SKU and publication-listing indexes.

Verified:
- MongoDB rejects incomplete product documents.
- Existing product collection preflight was empty before initialization.
- Database connectivity, lint, TypeScript, production build, and high-severity dependency audit pass.

Preserved:
- No product seed, collection membership, fragrance-note data, or cinematic-component rewrite was introduced.

## Phase 1 — Stage 1.6 Collection Domain

Added:
- Canonical collection contracts with stable IDs/slugs, lifecycle/visibility states, ordered product references, and campaign media.
- Server-only MongoDB collection repository with product-reference and public-publication validation.
- Safe collection initialization, database verification, and domain-contract commands.

Preserved:
- Product facts remain owned by Product Domain; no cinematic mappings, seeds, notes, families, storefront, or commerce work was introduced.

## Phase 1 — Stage 1.7 Fragrance Notes Domain

Added normalized fragrance notes, ingredients, accords, families, tiered product-note links, deterministic ordering, server-only repositories, safe MongoDB validators/indexes, and domain/database verification commands. No seed data or cinematic component changes were made.

## Phase 1 — Stage 1.8 User & Address Domain

Added canonical user/profile/role/status contracts, deterministic email normalization, dedicated ownership-scoped addresses, MongoDB validators/indexes, default-address uniqueness rules, repositories, and safe verification commands. Authentication and order snapshots remain deferred.

## Phase 1 — Stage 1.9 Order & Inventory Domain

Added variant/SKU inventory counters, transaction-safe reservation lifecycle, immutable order item/address snapshots, separate state machines, guarded transitions, strict validators/indexes, and negative/concurrency verification. Checkout, carts, payments, and shipping integrations remain deferred.

## Phase 1 — Stage 1.10 Shared Validation

Added small shared primitives for identifiers, email, slugs, money, quantities, pagination, countries, timestamps, and safe text, plus regression checks across Product, Collection, Fragrance, User, and Order domains. Business logic remains outside Zod primitives.

## Phase 1 — Stage 1.11 Error Architecture

Added stable error taxonomy, internal/public message separation, Zod/MongoDB translation, safe HTTP/server serializers, diagnostic logging boundaries, and deterministic redaction tests. No API or UI surfaces were added.

## Phase 1 — Stage 1.12 Seed & Legacy Product Mapping

Added deterministic, idempotent, non-destructive seeding for the six existing cinematic products, their variants, supported note/family relationships, and cinematic collection membership. Added duplicate/orphan/conflict verification; no cinematic component or GSAP rewrite was made.

## Phase 1 — Stage 1.13 Foundation Integration Tests

Added safe cross-domain integration verification for product/collection/taxonomy integrity, seed idempotency and runtime separation, snapshot immutability, concurrency, error translation, validators/indexes, and protected cinematic build regression. No feature surfaces were added.

## Phase 1 — Stage 1.14 Phase 1 Sign-Off

- Completed final Phase 1 acceptance review and authoritative verification suite.
- Signed off **PHASE 1 — APPROVED / COMPLETE** and moved the checkpoint to **Phase 2 / Stage 2.1 — Storefront Shell & Shared Layout: READY — NOT STARTED**.
- Recorded non-blocking host/tooling issues and intentionally deferred commerce, storefront, and cinematic integration work.

## Phase 2 — Stage 2.1 Storefront Shell & Shared Layout

- Added an isolated `(storefront)` route-group layout and lightweight server-rendered shell with reusable container, semantic landmarks, skip navigation, responsive Maison styling, and shared metadata defaults.
- Preserved the cinematic homepage as an independent `(cinematic)` experience; no GSAP, video, product, navigation, or commerce feature was added.

## Phase 2 — Stage 2.2 Global Navigation

- Added centralized storefront navigation configuration and a server-rendered Maison desktop navigation with active-route semantics and planned-route boundaries.
- Added accessible Search, Account, and Shopping Bag icon boundaries without implementing search, auth, cart, mobile navigation, or mega menus.
- Preserved cinematic/storefront runtime isolation and moved the checkpoint to Stage 2.4 — Mobile Navigation: READY — NOT STARTED.

## Phase 2 — Stage 2.4 Mobile Navigation

- Added a dedicated mobile full-screen Maison drawer with expandable planned Fragrances/Collections groups, focus trapping, Escape/close restoration, scroll locking, safe-area support, and responsive breakpoint separation.
- Kept MongoDB access server-only by passing serializable collection summaries to the isolated client controller.
- Moved the checkpoint to Stage 2.5 — Fragrance Catalog: READY — NOT STARTED.
## 2026-08-17 — Stage 2.5 Fragrance Catalog

- Added the domain-backed dynamic `/fragrances` route and Maison editorial catalog presentation.
- Added server-only published-product query mapping with canonical collection/family labels, lowest active-variant pricing, and Cloudinary poster derivation.
- Added safe error/empty states and non-navigational catalog cards pending Product Detail.
- Added catalog boundary verification and kept cinematic, search, filter, cart, and commerce behavior deferred.

## 2026-08-17 — Stage 2.6 Audience Campaign Pages

- Added server-rendered Women, Men, and Unisex editorial campaign routes.
- Added an optional canonical Product audience enum and reusable audience-filtered catalog query.
- Kept the six existing products unclassified rather than inferring commercial segmentation; routes provide intentional empty states.
- Promoted the three audience destinations to live desktop/mobile navigation links and added campaign boundary verification.

## 2026-08-17 — Accessible Luxury Catalog Data Decision

- Added the owner-approved 30-product AURA catalog at accessible-luxury price points.
- Added deterministic, non-destructive migration with explicit audience assignments, variant pricing, overlap updates, and archival of the three retired products.
- Preserved the cinematic mapping collection as hidden presentation data so archival catalog changes do not delete or rewrite cinematic assets.

## 2026-08-17 — Stage 2.7 Collection Landing Pages

- Added public `/collections` and guarded `/collections/[slug]` server-rendered routes.
- Added ordered, canonical Product resolution with published-product filtering and safe empty/error states.
- Promoted Collections navigation and public collection summaries to live links while keeping the hidden cinematic collection inaccessible.
- Added collection boundary verification without inventing commercial collections or duplicating Product facts.

## 2026-08-17 — Stage 2.8 Product Detail Page

- Added published-only `/product/[slug]` with canonical Product, media, taxonomy, collection, and inventory reads.
- Added editorial gallery, accessible media selection, ordered notes, and keyboard-operable variant selection without fake purchase actions.
- Linked catalog, audience, and collection cards to Product Detail and added route/isolation verification.
## 2026-08-18 — Stage 2.12 Responsive & Accessibility QA

- Completed responsive/accessibility QA across Storefront routes, navigation, mega menu, mobile drawer, search overlay, filter drawer, catalog, PDP, collections, and New Arrivals.
- Fixed accessible modal backdrops and scroll restoration while preserving focus traps, Escape handling, safe-area/`dvh`, reduced motion, and existing layout boundaries.
- Added `domain:storefront:responsive-a11y:check` and documented the viewport/keyboard QA matrix. Stage 2.13 Phase 2 Sign-Off was the next checkpoint after this QA stage.
# 2026-09-10 — Stage 4.2 P1 Auth Persistence Foundations

Added the server-only auth persistence foundation: exact `argon2@0.45.1` Argon2id hashing policy, strict Atlas `authCredentials`/`authTokens` validators and indexes, repositories, random hash-only email-verification tokens, and an email-sender abstraction without a provider. Atlas persistence verification passed with purpose binding, atomic single-use/expiry checks, strict rejection, and fixture cleanup.

Deferred intentionally: registration and email delivery flow, Auth.js, JWT/session, login/logout, password recovery, account UI, and Cart/Wishlist merge. `PASSWORD_RESET` is schema-known but no such records are created in P1.
## 2026-09-10 — Stage 4.3 P2 Credentials Login & Server Session Authority

- Implemented Auth.js Credentials + JWT runtime at the approved transport boundary using `next-auth@5.0.0-beta.32`.
- Added server-authoritative login/session validation over canonical `users` and `authCredentials.sessionVersion`; PENDING, DISABLED, unverified, invalid, wrong-password, and missing-credential cases fail safely.
- Atlas-backed checks proved opaque minimal JWT claims, stale-token rejection after sessionVersion increment, disabled-user rejection, concurrency-safe fixture cleanup, and no secret leakage. Next Auth.js providers/session handlers returned HTTP 200; TypeScript, ESLint, direct npm audit, architecture, and scoped diff checks passed.
- The production build currently retains the baseline `PageNotFoundError` for `/_not-found`; it is recorded as later Stage 4.3 regression debt. P3 Login/Session UX & Logout remains READY — NOT STARTED.
## 2026-09-11 — Stage 4.3 P3 Logout, Helpers & Login UI

- Added the Maison `/login` page with accessible email/password fields and a server-action Auth.js Credentials login flow with safe generic failures.
- Added server-side current-session/required-session helpers and a real Auth.js sign-out action; linked the Maison Account action to `/login` without adding Account/Profile behavior.
- Atlas-backed runtime verification passed real callback login, session read, and logout with fixture cleanup. TypeScript, ESLint, production build, direct npm audit, architecture, P3 static, and scoped checks passed. Stage 4.3 P4 remains READY — NOT STARTED.
## 2026-09-11 — Stage 4.3 P4 Final Audit

- Completed the final Atlas-backed Auth.js Credentials + JWT audit: canonical User/status authority, `sessionVersion` revocation, DISABLED rejection, real logout, HTTP regressions, Stage 4.2 regressions, and fixture cleanup passed.
- Re-ran the full quality gates: TypeScript, full ESLint with zero warnings, isolated production build, direct npm audit with 0 vulnerabilities, commerce regressions, and `STAGE43_SCOPED_DIFF_CHECK`.
- Preserved the documented unrelated repo-wide whitespace baseline and broad dirty worktree. Stage 4.4 Password Recovery remains READY — NOT STARTED.
## 2026-09-11 — Stage 4.4 Password Recovery

- Added the Maison `/forgot-password` and `/reset-password` experiences with generic non-enumerating request feedback, safe token-state inspection, explicit POST reset, and URL cleanup after success.
- Added Atlas-backed `PASSWORD_RESET` token creation/rotation and atomic reset behavior: hash-only storage, purpose/expiry/single-use enforcement, Argon2id replacement, `sessionVersion` increment, old-JWT revocation, PENDING/DISABLED protection, rollback, and concurrency safety.
- Kept delivery behind the fake/in-memory email abstraction; no production provider, Account/Profile behavior, or Cart/Wishlist merge was introduced.
- Added Atlas service, UI-contract, and Next runtime checks. Stage 4.4 final checks passed: TypeScript, full ESLint with zero warnings, production build with process-only `AUTH_SECRET`, direct npm audit with `found 0 vulnerabilities`, auth/commerce regressions, cleanup, and scoped verification. The documented unrelated repo-wide whitespace baseline remains untouched.
## 2026-09-11 — Stage 4.5 P1/P2 Account Overview & Profile

- Added the protected Maison `/account` Account Overview and Profile UI over the existing canonical account boundary. The server derives the current user from Auth.js/sessionVersion authority and exposes only email, first name, last name, and phone.
- Added the exact strict profile allowlist (`firstName`, `lastName`, `phone`) with server-side user ownership, account-route revalidation, accessible pending/success/error UX, and safe same-origin login return handling.
- Atlas-backed persistence/reload, stale-session and disabled-user protection, protected-field rejection, fixture cleanup, Auth.js and Password Recovery regressions, HTTP 200/404 semantics, TypeScript, scoped ESLint, direct audit, and scoped diff checks passed. P3 and Stage 4.6 remain unstarted.
