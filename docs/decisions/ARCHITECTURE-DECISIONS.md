# AURA Architecture Decision Register

Accepted records are immutable in intent. A later change must add a superseding ADR rather than silently rewrite history.

## Index

| ADR | Decision | Status | Date |
|---|---|---|---|
| ADR-001 | Next.js modular monolith | Accepted | 2026-08-17 |
| ADR-002 | npm and `package-lock.json` are authoritative | Accepted | 2026-08-17 |
| ADR-003 | PostgreSQL with Prisma | Superseded by ADR-012 | 2026-08-17 |
| ADR-004 | Product domain is the single source of truth | Accepted | 2026-08-17 |
| ADR-005 | Zod validates application trust boundaries | Accepted | 2026-08-17 |
| ADR-006 | Database-backed guest carts | Accepted | 2026-08-17 |
| ADR-007 | Auth.js for authentication, application policies for authorization | Accepted | 2026-08-17 |
| ADR-008 | Stripe and PayPal with webhook authority | Accepted | 2026-08-17 |
| ADR-009 | Cloudinary remains the media provider | Accepted | 2026-08-17 |
| ADR-010 | Repository documentation is project memory | Accepted | 2026-08-17 |
| ADR-011 | Upgrade to Next.js 15.5.21 Maintenance LTS | Accepted | 2026-08-17 |
| ADR-012 | MongoDB Atlas with official Node.js driver | Accepted (supersedes ADR-003 and part of ADR-006) | 2026-08-17 |
| ADR-013 | Collections reference products by ID | Accepted | 2026-08-17 |
| ADR-014 | Normalized fragrance taxonomy and ID-only product links | Accepted | 2026-08-17 |
| ADR-015 | Dedicated owned address documents | Accepted | 2026-08-17 |
| ADR-016 | Variant inventory reservations and immutable order snapshots | Accepted | 2026-08-17 |
| ADR-017 | Small shared validation primitives | Accepted | 2026-08-17 |
| ADR-018 | Central safe error translation boundary | Accepted | 2026-08-17 |
| ADR-019 | Deterministic non-destructive cinematic seed | Accepted | 2026-08-17 |
| ADR-020 | Isolated storefront route group and server-rendered shell | Accepted | 2026-08-17 |
| ADR-021 | Explicit Product audience segmentation without inference | Accepted | 2026-08-17 |
| ADR-022 | Opaque secure guest cart identity | Accepted | 2026-08-18 |
| ADR-023 | Server-authoritative cart pricing and checkout-time inventory reservation | Accepted | 2026-08-18 |
| ADR-024 | Shared commerce mutation service with server-action-first transport | Accepted | 2026-08-18 |
| ADR-025 | Cart lifecycle, ownership merge, expiration, and concurrency policy | Accepted | 2026-08-18 |
| ADR-026 | One active cart per owner with embedded cart lines | Accepted | 2026-08-18 |
| ADR-027 | Independent persistent anonymous Wishlist | Accepted | 2026-08-18 |
| ADR-028 | Integer-safe Discount evaluation foundation | Accepted | 2026-08-18 |
| ADR-029 | Hash-only Gift Card bearer value and append-only ledger | Accepted | 2026-08-18 |
| ADR-030 | Canonical AURA identity and database sessions | Superseded by ADR-031 | 2026-09-10 |
| ADR-031 | Auth.js Credentials/session compatibility finding | Superseded by ADR-032 | 2026-09-10 |
| ADR-032 | Auth.js Credentials with JWT Sessions and Server-Side Revocation Authority | Accepted | 2026-09-10 |

## ADR-001 — Next.js Modular Monolith

**Status:** Accepted  
**Context:** The repository is already a small Next.js 14 App Router application. AURA needs many related commerce domains but has no demonstrated operational need for independently deployed services.  
**Decision:** Keep one Next.js application and enforce UI, application, domain, server, repository, and integration boundaries inside it.  
**Alternatives:** Microservices now; unstructured route/component growth.  
**Consequences:** Deployment remains simple and transactions stay local. Discipline is required to prevent business logic from accumulating in components or route handlers. Extraction remains possible if measured scale later justifies it.

## ADR-002 — npm Lockfile Authority

**Status:** Accepted  
**Context:** `package-lock.json` is tracked. Invoking bundled pnpm during audit generated an untracked `pnpm-lock.yaml` and normalized installed modules.  
**Decision:** npm is the repository package manager and `package-lock.json` is the only accepted lockfile unless a future explicit migration ADR supersedes this decision. The audit-generated pnpm lockfile was removed.  
**Consequences:** Deterministic installs retain existing project convention. Host npm tooling must be repaired or a controlled npm runtime supplied before dependency changes.

## ADR-003 — PostgreSQL with Prisma

**Status:** Superseded by ADR-012  
**Context:** Products, variants, collections, notes, users, addresses, carts, inventory, orders, payments, discounts, gift cards, and audit history have strong relationships and transactional invariants. No existing database constrains the choice.  
**Decision:** Use PostgreSQL as the system of record and Prisma for schema, migrations, typed access, and transactions.  
**Alternatives:** Document database; raw SQL-only access; hosted proprietary data API.  
**Consequences:** Strong relational integrity and ACID transactions fit commerce. Schema/migration review becomes mandatory. Some advanced concurrency/search operations may require carefully reviewed SQL beyond basic ORM calls.

## ADR-004 — Product Domain as Single Source of Truth

**Status:** Accepted  
**Context:** Six cinematic products currently duplicate facts in client components. Future store, search, cart, checkout, and admin surfaces would drift if they copied those values.  
**Decision:** Product, variant, media, collection, and note data will be authoritative in the domain/database. Cinematic worlds consume stable product mappings and presentation metadata rather than independent prices/descriptions.  
**Consequences:** All purchase totals are consistent and admin changes propagate. Existing hard-coded data requires a careful seed/mapping transition without rewriting animations.

## ADR-005 — Zod at Trust Boundaries

**Status:** Accepted  
**Context:** TypeScript types disappear at runtime and cannot validate environment values, form input, requests, provider payloads, or persisted JSON.  
**Decision:** Use Zod for environment, forms, route handlers, server actions, and external payload normalization. Domain policies still enforce business invariants.  
**Consequences:** Runtime failures are earlier and structured, with some schema/type duplication avoided through inference. Zod does not replace authorization or database constraints.

## ADR-006 — Database-Backed Guest Carts

**Status:** Accepted  
**Implementation note:** The PostgreSQL-specific persistence wording is superseded by ADR-012. The database-backed-cart policy remains accepted; MongoDB transaction and index requirements now govern its later implementation.  
**Context:** AURA requires refresh persistence, server price/inventory validation, checkout continuity, and safe merge after login. Browser-only carts cannot be the system of record.  
**Decision:** Persist guest carts in PostgreSQL and reference them through an opaque secure cookie identifier. The authenticated user's active cart is database-backed; merge rules are transactional and idempotent.  
**Alternatives:** localStorage-only; signed cookie containing the full cart.  
**Consequences:** Cross-request consistency and checkout trust improve. Expiration/cleanup and merge conflict policies must be implemented in Phase 3.

## ADR-007 — Auth.js Authentication with AURA Authorization

**Status:** Accepted  
**Context:** The existing Next.js application needs secure sessions, credentials/recovery integration, and future provider flexibility. Authentication and domain authorization are distinct concerns.  
**Decision:** Use Auth.js for authentication/session mechanics, backed by the AURA user model. Application services and server policies enforce roles, ownership, account status, and admin permissions.  
**Alternatives:** bespoke session framework; external hosted identity service.  
**Consequences:** Standard session primitives reduce custom security code. Version compatibility and adapter behavior must be verified in Phase 4; Auth.js session presence alone never grants admin rights.

## ADR-008 — Official Payment SDKs and Webhook Authority

**Status:** Accepted  
**Context:** The product requirements specify Stripe and PayPal. Reliable order state cannot depend on client totals or redirects.  
**Decision:** Integrate official SDKs/APIs; calculate payable amounts server-side; verify signed webhooks idempotently; treat provider-confirmed events as payment authority.  
**Consequences:** Strong payment integrity and wallet eligibility through providers. Implementation depends on owner merchant credentials and sandbox/production configuration. Raw card data and CVV never enter AURA storage.

## ADR-009 — Cloudinary Media Provider

**Status:** Accepted  
**Context:** Existing cinematic videos are already delivered through configurable Cloudinary URLs, and preserving them is mandatory.  
**Decision:** Retain Cloudinary for videos and product/campaign media while storing metadata/public identifiers in the domain. Centralize poster, preload, transformation, and fallback policies.  
**Consequences:** Existing assets remain usable and optimized delivery is available. Provider availability/cost is a dependency, and hard-coded fallback URLs will be removed incrementally.

## ADR-010 — Repository Documentation as Project Memory

**Status:** Accepted  
**Context:** AURA will span many sessions and phases; conversation state is not durable enough for architecture and completion claims.  
**Decision:** `docs/PROJECT-STATUS.md`, `docs/MASTER-PLAN.md`, the current phase document, and this register are authoritative. Documentation and status updates are required for stage completion.  
**Consequences:** Continuity and auditability improve at the cost of ongoing documentation maintenance.

## ADR-011 — Upgrade to Next.js 15.5.21 Maintenance LTS

**Status:** Accepted  
**Context:** npm audit reports five high-severity findings on Next.js 14.2.35 and its lint tree. Official July 2026 Next.js guidance recommends 16.2.11 Active LTS or 15.5.21 Maintenance LTS. The application uses the App Router, so Next.js 15 requires React 19.  
**Decision:** Upgrade first to Next.js 15.5.21, React/React DOM 19, matching React types, and `eslint-config-next` 15.5.21 before introducing database/server features.  
**Alternatives:** Next.js 16.2.11 immediately; remain on vulnerable Next.js 14.  
**Rationale:** 15.5.21 is the security-supported Maintenance LTS and has a narrower migration surface than Next.js 16, which also changes the default bundler and routing conventions.  
**Consequences:** React 19 compatibility must be tested against GSAP and the cinematic experience. Async request API changes must be respected in new code. A later Next.js 16 upgrade remains planned through a separate ADR after the platform foundation stabilizes.  
**References:** https://nextjs.org/docs/app/guides/upgrading/version-15 and https://nextjs.org/blog

## ADR-012 — MongoDB Atlas with Official Node.js Driver

**Status:** Accepted — supersedes ADR-003 and the PostgreSQL-specific implementation detail in ADR-006  
**Context:** Before database implementation, the owner selected MongoDB Atlas instead of PostgreSQL. AURA still requires one authoritative product domain, persistent carts, inventory protection, immutable order snapshots, and payment-safe state transitions.  
**Decision:** Use MongoDB Atlas as the primary database and the official MongoDB Node.js driver for server-only data access. Collections use explicit document contracts, validators, indexes, and application-level repository boundaries. Multi-document commerce operations use MongoDB transactions; product and order facts are never duplicated across presentation surfaces.  
**Considered options:** Retain PostgreSQL + Prisma; use MongoDB with Mongoose; use MongoDB with the official driver.  
**Rationale:** The owner-selected managed MongoDB platform is authoritative. The official driver adds the smallest persistence abstraction, keeps schema and transaction policies explicit, and avoids introducing an ODM before actual domain needs are validated.  
**Consequences:** Relational integrity is no longer supplied by foreign keys; repositories, validators, unique indexes, transaction boundaries, and integration tests must enforce references and invariants. Reporting and joins require deliberate query/aggregation design. Payments, inventory, cart merge, and order creation must use transactions where their invariants span documents.  
**Related decisions:** ADR-004 (single product source), ADR-005 (Zod validation), ADR-006 (database-backed carts), ADR-008 (webhook authority), ADR-009 (Cloudinary media).  

## ADR-013 — Collections Reference Products by ID

**Status:** Accepted  
**Context:** Collections must curate products and campaign media without creating alternate product prices, names, notes, stock, or media records. MongoDB does not provide foreign keys.  
**Decision:** Store ordered product ObjectId references only. The collection repository verifies referenced products exist and requires published products for publicly visible published collections.  
**Consequences:** Product changes remain authoritative everywhere. Cross-document integrity is enforced by repository checks, indexes, and later integration tests; product deletion/archival policies must account for reverse membership in their owning stages.

## ADR-014 — Normalized Fragrance Taxonomy and ID-Only Product Links

**Status:** Accepted  
**Decision:** Store reusable notes, ingredients, accords, and families in dedicated MongoDB collections. Store product relationships as IDs with tier/position metadata; keep `NOTE`, `INGREDIENT`, and `ACCORD` distinct and order tiers TOP → HEART → BASE.  
**Consequences:** Taxonomy is reusable and indexed without duplicating Product facts. Repository checks and unique indexes enforce MongoDB referential/order invariants; search services and cinematic mapping remain deferred.

## ADR-015 — Dedicated Owned Address Documents

**Status:** Accepted  
**Decision:** Store saved customer addresses in a dedicated `addresses` collection referencing `userId`. Enforce ownership in repository method shapes and one default shipping/billing address per user with partial unique indexes plus repository transition rules. Orders must copy immutable snapshots at purchase time.

## ADR-016 — Variant Inventory Reservations and Immutable Order Snapshots

**Status:** Accepted  
**Decision:** Track inventory per variant/SKU with `available`, `reserved`, and `committed` counters. Reserve, release, and commit are transaction-safe guarded mutations. Orders embed immutable product/variant and shipping-address snapshots; order, payment, fulfillment, and reservation statuses remain separate state machines.  
**Consequences:** Concurrent reservations cannot oversell and duplicate release/commit operations are rejected. Future checkout/payment stages must call these primitives; expiry cleanup is represented by indexed `expiresAt` and deferred to a worker stage.

## ADR-017 — Small Shared Validation Primitives

**Status:** Accepted  
**Decision:** Keep reusable representation checks as small primitives (`id`, `email`, `slug`, `money`, `quantity`, `pagination`, `country`, `timestamps`, and safe text). Domain schemas compose them incrementally; business rules remain in domain services/repositories.  
**Consequences:** Normalization stays consistent without a global mega-schema or leaking MongoDB types into UI contracts. Regression checks are required when a primitive changes.

## ADR-018 — Central Safe Error Translation Boundary

**Status:** Accepted  
**Decision:** Represent domain/application/infrastructure failures with a small stable taxonomy and translate them centrally to safe public contracts. Internal diagnostics and causes remain server-only; raw database/provider errors never cross the boundary.  
**Consequences:** Route handlers and server actions can share deterministic status/code/message behavior later without exposing implementation details. Logging may retain controlled diagnostics but must exclude secrets, credentials, cookies, full addresses, and connection strings.

## ADR-019 — Deterministic Non-Destructive Cinematic Seed

**Status:** Accepted  
**Decision:** Treat the six-world seed manifest as initialization input only. Use deterministic IDs/slugs/SKUs, preserve matching existing canonical records, fail on conflicts, and never reset/delete data. Keep cinematic presentation metadata separate from Product facts.  
**Consequences:** MongoDB becomes the canonical catalog after initialization while reruns remain safe. Full component/domain runtime integration is deferred to Phase 8; source conflicts must be documented rather than guessed.

## ADR-020 — Isolated Storefront Route Group and Server-Rendered Shell

**Status:** Accepted  
**Context:** AURA's cinematic homepage depends on GSAP, video media, and client-side presentation behavior, while future storefront routes need a lighter reusable layout.  
**Decision:** Keep `/` in the `(cinematic)` route group and establish a separate `(storefront)` route group with a server-rendered shell, shared brand primitives, semantic landmarks, skip navigation, and no cinematic runtime imports. Route groups must not alter public URLs.  
**Consequences:** Storefront routes can evolve independently and avoid downloading cinematic dependencies. Navigation, catalog, commerce state, and product surfaces remain owned by later stages.

## ADR-021 — Explicit Product Audience Segmentation without Inference

**Status:** Accepted  
**Context:** Stage 2.6 requires Women, Men, and Unisex campaign routes, but the six existing canonical products did not contain a reliable audience field. Assigning an audience from names, imagery, or model intuition would create an undocumented commercial decision.  
**Decision:** Add an optional Product `audience` enum (`WOMEN`, `MEN`, `UNISEX`) and filter campaign queries only by that stored value. Do not backfill or infer audience assignments during Stage 2.6. Until an owner-approved mapping exists, the campaign routes remain valid and render an intentional empty state.  
**Consequences:** Campaign pages cannot misclassify products. The owner-approved catalog migration assigned all 30 products through the canonical Product domain; no presentation component may create a second classification source. Future audience changes must use the same validated migration/domain boundary.

## ADR-022 — Opaque Secure Guest Cart Identity

**Status:** Accepted  
**Context:** Phase 3 must support persistent guest carts before Auth.js exists. Browser-only carts and cookies containing full cart state would violate the server-authoritative commerce model. Raw MongoDB ObjectIds also should not become authorization tokens.  
**Decision:** Guest carts are identified by an opaque, high-entropy server-generated token stored in an `HttpOnly`, `SameSite=Lax`, production-`Secure` cookie named `aura_guest_cart`. The cookie is scoped to `/` and contains no product data, prices, quantities, PII, raw MongoDB documents, or raw ObjectIds used as authorization. MongoDB stores the cart. Future implementation should store a non-reversible token lookup value where practical.  
**Alternatives:** localStorage cart authority; signed cookie containing cart contents; raw cart ObjectId in a readable cookie.  
**Consequences:** Guest carts can survive refresh while preserving server authority. Cookie rotation, expiry, missing/malformed-token behavior, CSRF review, and cleanup must be implemented in later Phase 3 stages.

## ADR-023 — Server-Authoritative Cart Pricing and Checkout-Time Inventory Reservation

**Status:** Accepted  
**Context:** Phase 1 established ProductVariant prices as integer minor units and Inventory as transaction-safe available/reserved/committed counters. Adding an item to cart is purchase intent, not a completed purchase. Reserving inventory too early would allow inactive carts to lock stock.  
**Decision:** Cart mutations accept only product/variant identity and quantity from the browser. The server resolves canonical ProductVariant price, sellability, and inventory state, then calculates line totals and cart subtotal in integer minor units. Adding to cart does not reserve inventory. Inventory reservation happens near checkout/payment preparation through the existing reservation lifecycle. `UNTRACKED` inventory is viewable but not implicitly in stock; before real Add to Bag, variants need initialized inventory or an explicit owner-approved non-stock-tracked purchase policy.  
**Alternatives:** client-submitted prices/totals; cart-time reservation; treating untracked inventory as available.  
**Consequences:** Pricing remains consistent with checkout and refunds. Checkout must revalidate current price and inventory. Later cart UI may show availability guidance, but purchase eligibility remains server-resolved.

## ADR-024 — Shared Commerce Mutation Service with Server-Action-First Transport

**Status:** Accepted  
**Context:** Cart mutations will originate from PDP, Cart Drawer, Cart Page, storefront product surfaces, and later cinematic `ACQUIRE`. Duplicating mutation logic per UI surface would weaken validation and ownership boundaries.  
**Decision:** Implement future cart mutations in a shared server/application service layer. Use Server Actions by default for first-party storefront form and interaction flows. Use Route Handlers only where HTTP semantics are clearer, such as non-form cinematic bridges, provider/integration boundaries, or checkout APIs. Both transports call the same service and return the same serializable cart view model.  
**Alternatives:** route-handler-only cart API; independent mutations in each UI component; global client provider as source of truth.  
**Consequences:** Business rules stay centralized and testable. Future client state can coordinate pending UI and drawer/badge refresh, but server/database state remains authoritative.

## ADR-025 — Cart Lifecycle, Ownership Merge, Expiration, and Concurrency Policy

**Status:** Accepted  
**Context:** Phase 3 must support guest carts now and authenticated cart ownership later without a rewrite. Multiple tabs, repeated submissions, and future login merge can create conflicts if carts are updated with blind read-modify-write operations.  
**Decision:** Cart lifecycle states are `ACTIVE`, `CONVERTED`, and `EXPIRED`; `ABANDONED` is optional for reporting/cleanup if later needed. Cart owners are `GUEST` or future `USER`. Login merge is deterministic and idempotent: same variant lines combine quantities, ownership is checked, and the guest cart is made unavailable after successful merge. Guest carts carry `expiresAt`, and successful mutations refresh expiry. Future cart persistence should use atomic updates and/or MongoDB transactions, with a cart `version` field as the preferred optimistic concurrency primitive.  
**Alternatives:** one anonymous cart model requiring later rewrite; no lifecycle state; blind writes without versioning; duplicate lines for the same variant.  
**Consequences:** The model supports refresh persistence, safe account merge, cleanup, and concurrent mutation handling. Stage 3.2/3.3 must encode these policies in validators, indexes, and repository/service contracts.

## ADR-026 — One Active Cart per Owner with Embedded Cart Lines

**Status:** Accepted  
**Context:** Stage 3.2 introduces the first persistent Cart model. AURA carts are expected to be small retail carts, and Phase 3 needs duplicate-line prevention, simple atomic quantity changes, and safe guest/account ownership without creating premature analytics or line-item scale complexity.  
**Decision:** Store each cart as one MongoDB `carts` document with embedded `items[]` lines. Enforce one `ACTIVE` guest cart per guest token hash and one `ACTIVE` user cart per user through partial unique indexes. Cart lines reference only `productId`, `variantId`, and `quantity`; Product, price, media, inventory, discount, and subtotal facts remain resolved from canonical domains. Duplicate `productId + variantId` lines are rejected by the Cart domain rather than relying on MongoDB multikey uniqueness inside the same document.  
**Alternatives:** separate `cartItems` collection; unlimited active carts per owner; storing product/price snapshots in active carts; relying on MongoDB multikey unique indexes for duplicate lines.  
**Consequences:** Cart mutations can remain simpler and more atomic for the expected cart size. Stage 3.3 services combine duplicate adds into the existing line. If AURA later needs very large B2B carts or line-level analytics, a future ADR can split lines into a dedicated collection.
## ADR-027 — Independent persistent anonymous Wishlist

Stage 3.7 introduces one MongoDB Wishlist document per owner. Anonymous ownership uses a separate opaque, high-entropy `aura_guest_wishlist` HttpOnly cookie; only its SHA-256 digest is persisted. Wishlist items contain only canonical Product identity and `addedAt`, so current names, media, pricing, publication, and availability are resolved at read time. Wishlist state never creates or mutates Cart state and does not apply inventory eligibility. The owner union supports a trusted future USER boundary. Phase 4.8 will define and execute deterministic guest-to-user union/merge; this ADR does not implement authentication or merge hooks.

## ADR-028 — Integer-safe Discount evaluation foundation

Stage 3.8 keeps discounts as a separate server-authoritative layer over canonical ProductVariant prices. Percentage benefits use integer basis points (10% = 1000) and round down to minor units; fixed benefits use positive integer minor units and an ISO currency. Discounts support explicit lifecycle, validity windows, Product/Collection scope, thresholds, caps, and one-discount-at-a-time evaluation. Evaluation does not mutate Product prices, Cart documents, inventory, or usage counters. The MongoDB collection may remain empty until owner-approved discounts are created; Gift Cards and actual redemption remain separate later-stage domains.

## ADR-029 — Hash-only Gift Card bearer value and append-only ledger

Stage 3.9 treats Gift Cards as stored monetary value, not promotions. Cryptographically random bearer codes are normalized for lookup and only SHA-256 digests are persisted. Gift Card balances remain integer minor units in one currency; every issue or balance mutation creates an immutable ledger entry. Redemption is guarded and idempotency-keyed so retries cannot double-spend and concurrent attempts cannot create a negative balance. Expiration, ownership, purchase delivery, refunds, payment, and checkout redemption remain explicit future business/product decisions.

## ADR-030 — Canonical AURA Identity and Database Sessions

**Status:** Superseded by ADR-031 — the database-session choice is not adopted for Credentials-only Auth.js.  
**Context:** Phase 4 needs authentication mechanics without replacing the canonical User/Address domain or allowing stale session claims to authorize commerce and administration. The current application has no Auth.js package or authentication runtime.  
**Decision:** Preserve ADR-007: Auth.js will own authentication and session mechanics at a future boundary, while AURA `users` remains the identity authority and AURA services enforce status, verification, roles, ownership, and admin policy. Use database sessions rather than JWT sessions. Keep future password credentials in one `authCredentials` record per canonical user, future sessions in `authSessions`, and purpose-bound one-way verification/recovery tokens in `authTokens`.  
**Adapter boundary:** Do not adopt the standard Auth.js MongoDB User model by default. A tested custom/limited adapter must map sessions to the existing AURA user without creating a competing `users` collection or violating its strict validator; the mapping and package versions are implementation-stage gates.  
**Alternatives:** JWT sessions; a second Auth.js-owned User collection; storing password hashes in `users`; bespoke authentication/session mechanics.  
**Rationale:** Database sessions support immediate disabled-user enforcement, server-side revocation, sign-out-everywhere, and current canonical role/status reads. Dedicated auth persistence limits credential exposure and keeps identity/profile facts in their existing domain. AURA policy checks remain explicit and testable.  
**Trade-offs:** Each protected request may require a session/database lookup and a custom adapter adds implementation work. This is acceptable for the current modular monolith and can be measured before optimization; no role/status authority is duplicated into a JWT.  
**Consequences:** Stages 4.2–4.4 must implement strict validators/indexes, Argon2id password hashing, non-enumerating errors, rate limits, CSRF protection, secure cookies, atomic single-use tokens, and Atlas-backed verification. Stage 4.8 owns Cart/Wishlist merge. Stage 4.1 creates no auth collection, dependency, route, UI, or runtime behavior.

## ADR-031 — Auth.js Credentials/Session Compatibility Finding

**Status:** Superseded by ADR-032 — the owner selected Option A.
**Context:** The exact published Auth.js combination proposed for AURA was tested before registration work: `next-auth@5.0.0-beta.32` depends on `@auth/core@0.41.3`. The published core source and a disposable no-Atlas reproduction reject Credentials-only with `session.strategy: "database"` by returning `UnsupportedStrategy`. The latest `@auth/mongodb-adapter@3.11.3` also declares `mongodb ^6`, while AURA uses driver 7.5.0.  
**Finding:** Credentials-only + database sessions is not a supported current Auth.js architecture for AURA. No unused provider, internal patch, custom JWT encode/decode workaround, or undocumented callback bypass is acceptable.  
**Options:** (A) Auth.js Credentials + JWT sessions, with every protected request loading canonical AURA User authority and a server-side revocation/version policy; (B) retain database sessions by changing the Auth.js usage model or evaluating another framework, which requires explicit approval and may supersede ADR-007; (C) a genuinely supported Auth.js mechanism providing the actual email/password UX plus database sessions, if later proven.  
**Recommendation:** Option A was the smallest supported Auth.js path and is recorded as the owner decision in ADR-032.
AURA `users` remains canonical under every option; `authCredentials` remains secret storage, not profile authority. This preserves the accepted canonical identity boundary.

## ADR-032 — Auth.js Credentials with JWT Sessions and Server-Side Revocation Authority

**Status:** Accepted — owner decision recorded 2026-09-10
**Context:** ADR-031 established that the proposed Credentials-only plus database-session combination is rejected by the published Auth.js core. AURA needs a supported initial strategy that preserves ADR-007, canonical AURA users, current status/role authorization, and future Cart/Wishlist merge ownership boundaries. Auth.js is not yet installed in AURA and no runtime behavior is introduced by this decision.
**Decision:** Adopt Auth.js email/password Credentials with JWT sessions for the initial authentication architecture. Do not use database sessions, a dummy second provider, an internal Auth.js patch, or the MongoDB adapter in the initial path. The exact `next-auth` package version remains a controlled dependency-selection gate before runtime installation.
**Canonical authority:** AURA `users` remains the canonical identity, profile, verification, status, role, ownership, and authorization source. JWT is authentication/session transport only. Protected server boundaries validate/decrypt the JWT, extract canonical `userId`/subject and the comparison `sessionVersion`, load the current `authCredentials` record, reject stale versions, load the current User, enforce status/verification, and then apply role/ownership policy. JWT role, status, permissions, addresses, Cart, Wishlist, and commercial claims are not authoritative.
**Revocation:** `authCredentials.sessionVersion` is a server-controlled nonnegative integer. It is included in issued JWTs only as a comparison value. Password changes, successful password resets, sign-out-everywhere, account disablement, and security-driven forced logout increment or invalidate the server value; normal logout invalidates the current browser JWT through Auth.js mechanics.
**Persistence:** `authCredentials` stores the server-only password hash metadata and `sessionVersion`; `authTokens` stores purpose-separated, hash-only, single-use verification/recovery tokens. JWT sessions do not require an `authSessions` primary collection. AURA repositories remain responsible for canonical User/auth persistence and no competing Auth.js User model is allowed.
**Trade-offs:** JWT avoids the unsupported database-session configuration and avoids the adapter/driver mismatch, but protected requests must perform canonical User and version checks, and revocation depends on that server-side authority. This is acceptable because immediate status/role enforcement and sign-out-everywhere are required.
**Consequences:** Stage 4.1 is complete. Registration, login runtime, password hashing implementation, token collections, account UI, and email delivery remain later-stage work. Stage 4.2 is READY — NOT STARTED. Cart/Wishlist merge remains owned by Stage 4.8, and the Phase 3 true-404 loading-boundary fix remains unchanged.
