# AURA Database Architecture

**Status:** MongoDB connection foundation implemented and verified in Stage 1.4. Catalog collection design begins in Stage 1.5.

## Technology

MongoDB Atlas is the primary database. The official MongoDB Node.js driver provides server-side access; collection validators, indexes, application policies, and multi-document transactions provide the required commerce integrity.

The reusable client is `src/server/db/mongodb.ts`. It is server-only, uses Stable API v1, shares a development connection promise across hot reloads, limits the pool to 10 connections, and does not expose `MONGODB_URI` to browser code.

## Planned Model Groups

- Identity: canonical `User`, `Address`, and future auth-owned `authCredentials` and `authTokens`. Auth.js provider Accounts, VerificationToken/magic-link records, and `authSessions` primary session persistence are not in the initial Credentials + JWT scope.
- Catalog: `Product`, `ProductVariant`, `ProductMedia`, `Collection`, `CollectionProduct`, `FragranceNote`, `ProductNote`.
- Commerce: `Cart`, `CartItem`, `Wishlist`, `WishlistItem`, `Discount`, `DiscountRedemption`, `GiftCard`, `GiftCardTransaction`.
- Orders: `Order`, `OrderItem`, `OrderStatusHistory`, `Payment`, `Shipment`.
- Content/operations: `NewsletterSubscriber`, `Boutique`, `SiteSetting`, `AdminAuditLog`.

## Commerce Architecture — Stage 3.1

No commerce collections were created in Stage 3.1. The cart model remains MongoDB-backed and follows ADR-022 through ADR-026.

Planned cart persistence:

- `carts` will store owner kind (`GUEST` or future `USER`), owner lookup, lifecycle status, line references, quantities, version, `expiresAt`, and timestamps.
- `cartItems` may be embedded or separate only if Stage 3.2 proves the need; the line identity remains `productId + variantId`.
- Cart documents must not duplicate Product names, prices, media, or inventory state as ordinary active-cart authority.
- Cart totals are derived server-side from ProductVariant prices stored in integer minor units.
- Guest cart lookup should use a non-reversible token lookup value when practical; cookie tokens must not be stored or logged as public authorization secrets.
- Active cart mutation should use atomic updates and/or MongoDB transactions when invariants span documents.

## Cart Collection — Stage 3.2

`carts` stores the active cart data model only. It does not implement cookie persistence, mutation services, UI, checkout, payment, wishlist, discount, gift-card, or cinematic commerce behavior.

- Owner: discriminated `owner.kind` of `GUEST` or `USER`. Guest carts store `guestTokenHash` as a 64-character lowercase SHA-256-style digest; user carts store canonical `userId`. Raw guest cookie tokens are never stored.
- Status: `ACTIVE`, `CONVERTED`, or `EXPIRED`.
- Items: embedded lines containing only `productId`, `variantId`, and positive integer `quantity`.
- Version: nonnegative integer initialized at `0` for later optimistic concurrency.
- Expiration: guest carts require `expiresAt`; no TTL index is created yet.
- Indexes: one active guest cart per token hash, one active user cart per user, status/expiry lookup, and status/activity lookup.
- The domain rejects duplicate `productId + variantId` lines. MongoDB multikey uniqueness is not used as the duplicate-line authority inside the same document.
- Active carts do not store product names, slugs, SKUs, media, fragrance data, prices, totals, discounts, gift-card values, inventory counts, or availability snapshots.

Commands: `npm run db:carts:init`, `npm run db:carts:check`, and `npm run domain:cart:check`.

No `cartItems`, `wishlists`, `discounts`, or `giftCards` collection exists yet.

## Product Collection — Stage 1.5

`products` is an empty, strict-validation collection initialized by `npm run db:products:init`. It contains the canonical facts that future storefront, cart, checkout, admin, and cinematic integration surfaces must share.

- Product identity: unique lowercase `slug`, name, brand, description, lifecycle status, and timestamps.
- Merchandising: optional `launchAt` marks owner-approved commercial launch eligibility for New Arrivals; technical `createdAt` is never used for that storefront decision.
- Variants: stable UUID, globally indexed SKU, label, volume in millilitres, concentration, active state, and integer-minor-unit money.
- Media: stable UUID, ordered image/video assets, provider, URL, accessibility alt text, and optional provider public ID.
- Indexes: unique `slug`, unique `variants.sku`, `status`/`updatedAt` for publication reads, and `status`/`launchAt` for New Arrivals merchandising reads.
- Database validation rejects incomplete product documents. Domain Zod validation additionally enforces unique nested IDs/SKUs/positions, media-reference integrity, and compare-at price rules.

Fragrance notes/families, collection membership, stock quantities, and product seed data intentionally belong to later stages and are not embedded as parallel product facts here.

## Collection Collection — Stage 1.6

`collections` stores only collection facts: stable slug/name/description, lifecycle status, visibility, ordered `productMemberships` containing product IDs and positions, and independent campaign media. It never stores a product name, price, stock value, notes, or copied product media.

- A collection is publicly visible only when `status` is `PUBLISHED` and `visibility` is `PUBLIC`.
- Product ID and position must each be unique within a collection; public published collections require at least one membership.
- Repository creation verifies every referenced product exists; public published collections may reference only published products.
- MongoDB has unique slug, visible-listing, and reverse membership indexes. Strict validation rejects incomplete documents; Zod/repository rules enforce cross-field and cross-collection invariants.
- `npm run db:collections:init`, `npm run db:collections:check`, and `npm run domain:collections:check` are the safe initialization/verification commands.

## Data Rules

- Money is stored as integer minor units plus ISO currency, never floating point.
- Product variants own SKU, volume, price, sale price, inventory, and availability.
- Order items contain immutable product/variant/price snapshots.
- Product notes use a tier (`TOP`, `HEART`, `BASE`) and explicit display order.
- Inventory cannot become negative; checkout updates use transactions and guarded writes.
- Slugs, SKUs, normalized emails, discount codes, and gift-card hashes require appropriate unique indexes.
- Gift-card and reset-token raw secrets are never stored when a one-way hash is sufficient.

## Schema and Migration Safety

Before every migration: review collection validation, document shape, indexes, defaults, backfill behavior, transaction requirements, and destructive operations. Afterward: apply only to the intended non-production database, inspect resulting indexes/validators, run relevant tests, and update this document.

No production database or existing business data currently exists.

## Collection Policy

- Collections, validators, and indexes are introduced only by the stage that owns the corresponding domain.
- Every collection change requires an idempotent forward migration or a documented manual deployment procedure; destructive changes require an approved backup and recovery plan.
- Unique identifiers and references use MongoDB `ObjectId` values internally; public routes use stable slugs or opaque IDs.
- Cross-document commerce invariants use sessions and transactions. Single-document invariants are enforced atomically in their repository operation.
- MongoDB collection validators complement, but never replace, Zod validation at application trust boundaries.

## Stage 1.4 Verification

- MongoDB Atlas is the owner-selected platform.
- `.env.local` provides a structurally valid, non-production `MONGODB_URI`; the value is ignored by Git and is not recorded in this repository.
- The official `mongodb` Node.js driver 7.5.0 is installed.
- `npm run db:check` performs an admin `ping` and passed without outputting credentials or the URI.
- No domain collection, validator, index, seed, or data migration has been created yet.
# Fragrance Taxonomy (Stage 1.7)

`fragranceNotes` stores reusable entities with stable slug/name/status and kind `NOTE`, `INGREDIENT`, or `ACCORD`. `fragranceFamilies` stores reusable family entities. Product facts, prices, variants, media, and publication remain owned by `products`.

`productFragranceNotes` references product and note IDs plus `tier` (`TOP`, `HEART`, `BASE`) and nonnegative `position`. `productFragranceFamilies` references product and family IDs plus deterministic position. Unique compound indexes prevent duplicate links; domain validation prevents duplicate positions within a tier.

Commands: `npm run db:fragrance:init`, `npm run db:fragrance:check`, and `npm run domain:fragrance:check`. Stage 1.7 creates no taxonomy or cinematic seed data.

## User and Address Collections (Stage 1.8)

`users` owns canonical customer identity/profile fields, normalized email, roles (`CUSTOMER`, `ADMIN`), account status (`PENDING`, `ACTIVE`, `DISABLED`), and email verification timestamp. Email normalization is trim + lowercase only; provider-specific transformations are not performed. `users_normalized_email_unique` prevents duplicate identities.

`addresses` is a dedicated collection referencing `userId`. Postal codes remain strings and countries use two-letter ISO-style codes. Repository methods are ownership-scoped. Partial unique indexes prevent more than one default shipping or billing address per user. Saved addresses are not order history; Stage 1.9 orders must store immutable address snapshots. Authentication, sessions, passwords, and authorization middleware remain Phase 4 work.

## Authentication Persistence Architecture (Stage 4.1)

The existing `users` collection remains the canonical AURA identity. Stage 4.1 creates no authentication collection and does not change business data. Auth.js owns authentication/session mechanics at a future adapter boundary; AURA services load `users` by stable `userId` and enforce status, verification, role, ownership, and admin policy.

Database-backed sessions were evaluated but are not compatible with the initial Credentials-only Auth.js provider configuration. The owner-approved session strategy is JWT; future auth persistence remains separated from `users`:

- `authCredentials`: one server-only record per canonical `userId`, containing a versioned Argon2id password hash, nonnegative `sessionVersion`, and password-change timestamps. No plaintext, client hash, or password field belongs in `users`.
- `authTokens`: one-way, purpose-bound, single-use digests for `EMAIL_VERIFICATION` and `PASSWORD_RESET`, with expiry and atomic consumption. TTL is cleanup only and never the authorization check.

The official Auth.js MongoDB adapter is not part of the accepted initial path because JWT sessions do not require it. It must not create a competing Auth.js User model or violate the strict AURA validator. Validators, indexes, idempotent initialization, Atlas verification, and cleanup belong to Stages 4.2–4.4. Cart/Wishlist guest-to-user merge remains deferred to Stage 4.8.

## Order and Inventory Collections (Stage 1.9)

`inventory` is keyed by product variant UUID/SKU and tracks nonnegative `available`, `reserved`, `committed`, and a version counter. `inventoryReservations` records quantity, expiry, and lifecycle. Reserve/release/commit use MongoDB transactions and guarded updates so concurrent attempts cannot oversell or double-release.

`orders` stores immutable item snapshots and an embedded shipping address snapshot. Order, payment, fulfillment, and inventory reservation statuses are separate. Allowed transitions are `PENDING → CONFIRMED/CANCELLED`, `CONFIRMED → PROCESSING/CANCELLED`, `PROCESSING → SHIPPED/CANCELLED`, and `SHIPPED → DELIVERED`; terminal states do not regress. Expiry is represented by indexed `expiresAt`; cleanup workers are deferred.

## Cart Collection Runtime Policy (Stage 3.3)

`carts` remains a single-document active-cart collection with embedded canonical lines. Stage 3.3 now uses it through `MongoCartRepository` only; callers cannot pass arbitrary Mongo update objects.

Runtime policies:

- Reads without a valid guest token do not create documents.
- First successful guest mutation creates an ACTIVE cart after Product/Variant validation.
- Guest ownership uses `owner.guestTokenHash`; raw `aura_guest_cart` tokens are never stored.
- USER ownership uses `owner.userId`; USER carts never store `guestTokenHash`.
- Successful mutations increment `version` and update `updatedAt`.
- Successful guest mutations also refresh `expiresAt`.
- Expired guest carts are marked `EXPIRED`; a later mutation creates a replacement ACTIVE cart with a fresh token.
- Cart lines remain only `{ productId, variantId, quantity }`.
- Prices, product names, SKUs, media, inventory counters, subtotals, discounts, and totals are resolved into the cart view model at read/mutation time and are not persisted in active cart documents.

## Cart Quantity and Inventory Runtime Policy (Stage 3.6)

Cart documents continue to store only `{ productId, variantId, quantity }` line intent. Stage 3.6 does not add inventory counters, stock snapshots, prices, product snapshots, or checkout totals to `carts`.

Runtime mutation policy:

- Add/Increase resolves Product, Variant, and current `inventory` before writing.
- The Inventory Domain's existing `available` value is the permitted target-quantity comparison for cart validation.
- Missing inventory records are `UNTRACKED`, not in stock.
- `available <= 0` is OUT_OF_STOCK.
- Cart Add/Increase/Decrease/Remove/Clear do not mutate `inventory.available`, `inventory.reserved`, or `inventory.committed`.
- Same-cart quantity updates use cart `version` conflict protection; different carts are not reservations and may each contain the same last available unit until checkout reservation.

Current catalog coverage verified during Phase 3 sign-off: 60 sellable variants, 0 tracked, 60 untracked, 0 out-of-stock.

## Authentication Persistence — Stage 4.2 P1

P1 created and verified the auth-owned `authCredentials` and `authTokens` collections on the accepted non-production MongoDB Atlas database. Both use strict validators with `validationLevel: "strict"` and `validationAction: "error"`.

- `authCredentials` requires one canonical `userId`, an Argon2id PHC password hash, hash version, nonnegative `sessionVersion`, and timestamps. `auth_credentials_user_unique` enforces one credential record per user.
- `authTokens` requires a canonical `userId`, purpose, SHA-256 digest, expiry, creation time, and nullable consumption time. The validator knows `EMAIL_VERIFICATION` and future `PASSWORD_RESET`, while the P1 repository creates `EMAIL_VERIFICATION` only.
- `auth_tokens_hash_unique`, `auth_tokens_user_purpose_state`, and `auth_tokens_expiry_cleanup` support uniqueness, state lookup, and cleanup. TTL is cleanup only; repository expiry checks authorize consumption.
- Temporary Atlas fixtures proved strict rejection of unexpected fields, hash-only storage, atomic single-use consumption, expiry rejection, and cleanup. No User or registration data was created.

## Registration Persistence — Stage 4.2 P2

Registration uses a real Atlas transaction for the canonical `users` record, its one `authCredentials` record, and one `EMAIL_VERIFICATION` token. The User is always server-assigned `CUSTOMER`/`PENDING`; normalized email uniqueness makes concurrent duplicate attempts safe without creating partial identity. Resend invalidates the prior outstanding verification token and creates one replacement without changing the credential or creating a second User. Atlas-backed tests verify rollback, duplicate concurrency, resend rotation, post-commit delivery failure retention, and fixture cleanup.

## Shared Validation (Stage 1.10)

Reusable representation primitives live under `src/domain/shared`; database and domain business invariants remain enforced by their owning repositories and state machines.

## Error Boundary (Stage 1.11)

MongoDB errors are translated before crossing application boundaries: duplicate keys become `CONFLICT`, document validation becomes controlled validation failure, transaction failures become `DATABASE_ERROR`, and unknown errors become `INTERNAL_ERROR`. Public serialization never includes raw Mongo messages, stack traces, causes, collection names, paths, or connection data.

## Cinematic Seed and Legacy Mapping (Stage 1.12)

The six existing cinematic worlds are initialized by `scripts/seed-cinematic-products.mjs` from `scripts/cinematic-seed-manifest.mjs`. The manifest is seed input, not runtime catalog truth. MongoDB Product documents own names, prices, variants, concentration, publication state, and supported note/family relationships; cinematic values such as world number, video key, URL, and portal order remain presentation metadata.

The seed uses deterministic IDs/slugs/SKUs, upserts only matching records, fails on conflicting existing canonical data, and never deletes or resets collections. `npm run db:cinematic:seed` is safe to rerun. `npm run db:cinematic:check` verifies six unique mappings, valid collection membership, unique SKUs, and no orphan note/family references. Full cinematic/store integration remains Phase 8.
