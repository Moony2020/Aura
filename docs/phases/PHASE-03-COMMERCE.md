# Phase 3 — Cart, Wishlist & Commerce

## Objective

Provide persistent, server-validated shopping state and connect storefront and cinematic purchase intent to real commerce without weakening the Phase 1/2 product, money, inventory, and error boundaries.

## Dependencies

Phase 1 foundation and Phase 2 storefront/product discovery are complete. Product, ProductVariant, Money, Inventory, Order snapshots, User/Address, Shared Validation, Error Architecture, MongoDB repository conventions, ADR-006 database-backed guest carts, and ADR-012 MongoDB Atlas are the foundation for this phase.

## Stages

- [x] 3.1 Commerce Architecture
- [x] 3.2 Cart Data Model
- [x] 3.3 Guest & Account Cart Persistence
- [x] 3.4 Cart Drawer
- [x] 3.5 Full Cart Page
- [x] 3.6 Quantity & Inventory Validation
- [x] 3.7 Wishlist
- [x] 3.8 Discount Foundation
- [x] 3.9 Gift Card Foundation
- [x] 3.10 Fragrance World -> Cart Integration
- [x] 3.11 Commerce Integration Tests
- [x] 3.12 Phase 3 Sign-Off

## Stage 3.1 — Commerce Architecture

**Status:** COMPLETE.

Stage 3.1 is architecture only. It defines commerce trust boundaries and future implementation contracts without creating a cart collection, cart schema, cart UI, Add to Bag action, wishlist UI, checkout, Auth.js, payment provider integration, inventory reservation from cart, or cinematic component changes.

### Commerce authority flow

```text
Browser interaction
        ↓
Validated commerce mutation
        ↓
Server/application service
        ↓
Canonical Product + Variant + Inventory
        ↓
MongoDB cart state
        ↓
Serializable cart view model
        ↓
UI
```

The browser may hold temporary display and pending-submission state. It is never authoritative for product names, variant attributes, unit prices, line totals, cart totals, inventory state, discount eligibility, gift-card value, ownership, or order/payment status.

### Source of truth

Cart persistence will be database-backed in MongoDB, consistent with ADR-006 as superseded by ADR-012. Active carts store identity, ownership, lifecycle, line references, quantities, versioning, and timestamps. They do not duplicate ordinary Product facts.

Canonical commercial facts remain in their owning domains:

- Product name, slug, media, publication state, audience, family, and notes remain Product/Collection/Fragrance domain facts.
- Variant ID, SKU, volume, concentration, active state, and price remain ProductVariant facts.
- Money remains integer minor units plus ISO currency.
- Inventory availability remains Inventory domain state.
- Immutable product/variant/price/address snapshots belong to Orders, not active carts.

### Guest cart identity

Guest carts use an opaque, non-guessable identifier stored in a secure cookie. The cookie identifies the guest cart but does not contain product data, prices, quantities, PII, MongoDB documents, or raw ObjectIds used as authorization.

Policy:

- Cookie name: `aura_guest_cart`.
- Value: random high-entropy opaque token generated server-side; do not derive it from MongoDB ObjectIds, product IDs, email, IP address, or user-agent strings.
- Scope: path `/`; same site only.
- Attributes: `HttpOnly`, `SameSite=Lax`, `Secure` in production HTTPS, and no JavaScript access.
- Expiration: 30 days of inactivity for the cookie and cart `expiresAt`, refreshed on successful cart mutation. A future cleanup job may delete or mark expired carts.
- Invalid or missing cookie: create a new guest cart only when a mutation needs one; read surfaces may return the canonical empty cart view.
- Rotation/replacement: replace the cookie when a cart is expired, missing, malformed, or converted. Do not reuse an expired identifier.

### Authenticated cart boundary

Phase 4 owns authentication and Auth.js. Phase 3 cart architecture must still support a future transition:

```text
Guest cart
    ↓
User logs in
    ↓
Safe cart merge
    ↓
Authenticated active cart
```

Future carts support two owner kinds: `GUEST` and `USER`. A guest owner is represented by the opaque guest token hash or equivalent non-reversible lookup key. A user owner is represented by canonical `userId`.

Merge policy for Phase 4/4.8:

- Merge is deterministic and idempotent.
- Same sellable variant lines are combined by quantity.
- Ownership is checked server-side before any read or mutation.
- At most one active user cart should exist if the one-active-cart policy is adopted.
- The guest cart is converted, expired, or otherwise made unavailable after a successful merge.

### Cart lifecycle

Use only lifecycle states justified by current commerce needs:

- `ACTIVE`: mutable purchase-intent cart.
- `CONVERTED`: checkout/order flow has taken ownership; no further cart mutation.
- `EXPIRED`: cart is too old or its guest identifier is no longer valid; no further mutation.
- `ABANDONED`: optional reporting/cleanup state for inactive carts if needed later; not required for Stage 3.2.

Checkout conversion belongs to Phase 5. Active carts are not orders and do not provide historical price guarantees.

### Cart item identity

Cart lines reference canonical sellable variants by:

```text
productId
variantId
```

The variant ID is the existing ProductVariant UUID. Product name or price must never identify a cart line. If a mutation adds the same `productId + variantId` already present in an active cart, the line quantity is incremented rather than creating a duplicate line.

### Quantity policy

- Quantities are positive integers for active lines.
- Minimum line quantity is 1.
- Update-to-zero removes the line.
- Requested quantities must validate through the shared quantity primitive.
- A business maximum is deferred until inventory/commercial requirements justify one.
- If tracked inventory exists and the requested quantity exceeds available stock at the relevant validation point, return `INSUFFICIENT_INVENTORY`.
- If inventory is unavailable or untracked, do not silently treat that state as authoritative in-stock.

### Money authority

The Phase 1 money invariant remains mandatory:

```text
$75  -> 7500
$129 -> 12900
$159 -> 15900
```

Cart mutations accept variant IDs and quantities, then the server resolves canonical variant prices and calculates line totals and cart subtotal. Client-submitted unit prices, totals, discounts, taxes, shipping, or currency are ignored or rejected. Discounts remain Stage 3.8 and must be represented separately from base item pricing.

### Inventory and reservation boundary

Adding to cart does not reserve inventory. Cart means purchase intent.

Inventory reservation happens later, near checkout/payment preparation, through the existing Phase 1 inventory reservation lifecycle. This prevents inactive carts from locking stock indefinitely.

Recommended boundary:

```text
Cart
= purchase intent

Checkout/payment preparation
= inventory reservation boundary
```

### Untracked inventory policy

`UNTRACKED` means catalog display is allowed but purchase availability is not authoritative yet. It must not be interpreted as in stock.

Before Add to Bag can become real in later stages, AURA must either initialize inventory records for sellable variants or approve an explicit non-stock-tracked product policy. Until then, untracked variants can appear in discovery/PDP but checkout eligibility must be confirmed by the server.

### Mutation contracts

Future cart application services should expose controlled operations such as:

```text
getCart()
addItem()
updateItemQuantity()
removeItem()
clearCart()
```

Each operation must validate input, verify ownership, resolve canonical product and variant facts, enforce publication/sellability rules, calculate authoritative money, apply lifecycle rules, and return a safe serializable cart view model. UI surfaces never receive unrestricted MongoDB mutation access.

### Server Actions and Route Handlers

Use a controlled combination:

- Server Actions are the default for first-party storefront form/mutation flows such as PDP, Cart Drawer, Cart Page, and future quantity updates.
- Route Handlers are reserved for HTTP semantics such as the cinematic `ACQUIRE` integration if a non-form client bridge is clearer, future integrations, and checkout/provider boundaries.
- Both transports must call the same application service layer. They must not each implement separate cart business logic.

### Client state

Do not create a large global commerce provider by default. Future UI may need a small client coordination boundary for the bag counter, Cart Drawer open state, optimistic pending states, and mutation feedback. That boundary must consume server-returned cart view models and never become the commercial source of truth.

### Cache and freshness

Commerce reads and mutation responses must be dynamic. Cart totals, line availability, and variant prices are resolved server-side and must not rely on stale static rendering. Scope dynamic/no-store behavior to cart and checkout reads/mutations rather than disabling caching globally across the Storefront.

Product display pages may stay cache-conscious for discovery, but cart and checkout must re-resolve canonical pricing and availability before commercial action.

### Cart view model

Future UI receives a serializable view model, not raw MongoDB documents:

```text
cartId/public identifier
status
items[]
item quantity
product slug
product name
variant label
media thumbnail
unit price
line total
subtotal
currency
item count
availability state
empty state
```

The view model may expose a public cart identifier distinct from internal database IDs. It must not expose cookie token hashes, raw owner secrets, or unnecessary MongoDB internals.

### Header badge semantics

The bag badge represents total unit quantity, not distinct line count.

```text
Velvet Rose x 2
Oud Majeste x 1

Bag badge = 3
```

### Empty cart

An empty cart has one canonical interpretation: active ownership context with zero lines, subtotal `0` in the active currency, item count `0`, and no checkout eligibility. Header, Cart Drawer, and Cart Page must use the same empty-cart model instead of inventing separate meanings.

### Wishlist boundary

Wishlist implementation belongs to Stage 3.7. It does not require price snapshots or inventory reservations. Persistent wishlist ownership is deferred until authentication unless a later accepted requirement introduces anonymous wishlist persistence. Wishlist lines reference canonical products/variants and resolve current Product facts dynamically.

### Discount boundary

Discount Foundation belongs to Stage 3.8. Client code never calculates authoritative discounts. Discount eligibility, stacking, expiry, and redemption limits are server-side. Cart subtotal exists before discount; discount results are represented separately from base item pricing.

### Gift-card boundary

Gift Card Foundation belongs to Stage 3.9. Gift-card balances, validation, redemption, and transaction history must be server-authoritative. Raw gift-card secrets should not be stored when a one-way hash is sufficient. Client-submitted balance or validation claims are never trusted.

### Cinematic `ACQUIRE` boundary

Stage 3.10 owns Fragrance World -> Cart integration. The cinematic components are not modified in Stage 3.1. The future `ACQUIRE` path must call the same cart mutation service as PDP, Cart Drawer, Cart Page, and storefront product surfaces. The cinematic experience must not receive its own cart implementation.

### Error behavior

Reuse the existing `AuraError` taxonomy where possible:

- Missing cart, expired cart, variant not found, and product not sellable can map to `NOT_FOUND`, `VALIDATION_ERROR`, or `INVALID_STATE_TRANSITION` depending on operation context.
- Invalid quantity maps to `VALIDATION_ERROR`.
- Insufficient inventory maps to `INSUFFICIENT_INVENTORY`.
- Ownership failures map to `RESOURCE_OWNERSHIP_ERROR`.
- Concurrent mutation conflicts map to `CONFLICT`.
- Database failures map through existing safe `DATABASE_ERROR`.

Public errors remain safe and must not expose raw database messages, cookie values, owner identifiers, inventory internals, or provider details.

### Ownership, security, and CSRF

Every mutation must prove ownership server-side. Guest ownership uses the secure cookie token to locate the active guest cart, preferably through a stored hash rather than raw token. Authenticated ownership uses canonical `userId` once Phase 4 exists.

Security rules:

- Cart tokens are high entropy and non-guessable.
- Cookie values are never logged.
- Cross-user access is rejected before reading or mutating cart lines.
- Cookie-authenticated mutations require CSRF review before implementation; `SameSite=Lax` is a baseline, not the whole defense.
- Rate limiting belongs at mutation-heavy and abuse-sensitive boundaries.

### Concurrency

Stage 3.2/3.3 must avoid blind read-modify-write cart updates. Use atomic single-document updates and/or MongoDB transactions where multiple documents are involved. A cart `version` field is the preferred optimistic concurrency primitive for conflicting updates from multiple tabs or repeated submissions.

Duplicate add operations for the same variant should be idempotent at the line identity level: one line with an incremented quantity. Quantity updates use the latest accepted cart version or an equivalent conflict-safe operation.

### Expiration and cleanup

Guest carts carry `expiresAt`. Successful mutations refresh expiry. Expired or missing carts referenced by a cookie produce the canonical empty cart read or a replacement cart on mutation. Cleanup ownership belongs to a later worker/maintenance stage; Stage 3.1 does not implement it.

### Cart -> order boundary

Do not convert carts into orders in Phase 3. Phase 5 owns checkout/order creation.

Trust boundary:

```text
Active Cart
    ↓
Checkout validates current canonical price/inventory
    ↓
Inventory reservation
    ↓
Payment flow
    ↓
Immutable Order snapshots
```

An active cart is not an order, and cart prices are not historical guarantees.

## Stage 3.1 Verification

- Documentation correction made: `PROJECT-STATUS.md` now points Next Phase to Phase 4 after Phase 3 sign-off.
- `domain:commerce:architecture:check` passes for documented cart authority, guest identity, ownership, lifecycle, item identity, money, inventory, untracked policy, mutation boundary, transport decision, caching, concurrency, expiry, wishlist, discount, gift-card, cinematic boundary, and no accidental implementation.
- No cart implementation, UI, cookies, services, actions, wishlists, discounts, gift cards, checkout, payments, or cinematic commerce changes were introduced by Stage 3.1.
- TypeScript, local ESLint, production build, full npm audit, `git diff --check`, and existing storefront regressions pass.

## Stage 3.2 — Cart Data Model

**Status:** COMPLETE.

Stage 3.2 implements the canonical Cart domain contract and MongoDB `carts` collection foundation only. It does not implement guest cookie persistence, token generation in HTTP flows, cart services, Server Actions, Route Handlers, Cart Provider, Cart Drawer, Add to Bag, Cart Page, inventory reservations, Wishlist, discounts, gift cards, authentication, checkout, payments, guest/account merge execution, or cinematic `ACQUIRE` changes.

### Cart domain contract

The Cart domain lives at `src/domain/cart/cart.schema.ts` and defines:

- Owner union: `GUEST` requires `guestTokenHash`; `USER` requires `userId`; mixed owner identifiers are rejected.
- Lifecycle: `ACTIVE`, `CONVERTED`, and `EXPIRED` only.
- Embedded lines: each line stores only `productId`, `variantId`, and positive integer `quantity`.
- Duplicate-line invariant: a cart cannot contain two lines with the same `productId + variantId`.
- Version: nonnegative integer, initial value `0`, reserved for Stage 3.3 optimistic concurrency mutations.
- Expiration: guest carts require `expiresAt`; user carts are not forced into the same 30-day guest expiry.
- Empty state: `items: []` is valid for an active cart. Derived UI values such as item count, subtotal, and checkout eligibility are not persisted.

### Storage model

MongoDB now has a `carts` collection with a strict validator and embedded cart lines. Stage 3.2 intentionally does not create a separate `cartItems` collection.

Persisted active cart documents do not store commercial snapshots:

- no product name, slug, SKU, media, family, notes, audience, or description;
- no `price`, `unitPrice`, `lineTotal`, `subtotal`, `total`, discount, or gift-card value;
- no `available`, `reserved`, `committed`, `inStock`, or inventory quantity snapshot;
- no raw guest token, cookie value, PII, or browser-owned ownership claim.

Prices remain ProductVariant authority in integer minor units and are resolved by future read/mutation services. Inventory remains Inventory Domain authority. Orders remain the only owner of immutable purchase snapshots.

### Indexes

Stage 3.2 adopts ADR-026:

- one `ACTIVE` guest cart per `owner.guestTokenHash`;
- one `ACTIVE` user cart per `owner.userId`;
- normal status/expiry lookup for future expiration cleanup;
- normal status/activity lookup for future operational reads.

Indexes created:

- `carts_active_guest_owner_unique`
- `carts_active_user_owner_unique`
- `carts_status_expires_at`
- `carts_status_updated_at`

No TTL index is created in Stage 3.2. Expiry lifecycle and physical cleanup remain distinct so later services can mark/read `EXPIRED` intentionally.

### Currency policy

Cart documents do not persist currency because active carts do not persist prices or totals. The eventual Cart View Model will return currency from server-resolved ProductVariant money/configuration. If multi-currency becomes a real requirement later, a future stage must introduce a server-controlled cart currency context and validate variant compatibility.

### Referential boundary

MongoDB cart lines are references, not foreign keys. Stage 3.3 services will resolve and verify that product exists, product is published/sellable, variant belongs to product, and variant is active before mutating cart state. Stage 3.2 does not duplicate Product data to compensate for MongoDB's lack of foreign keys.

### Verification

- `domain:cart:check` — PASS for owner union, lifecycle, embedded lines, duplicate-line rejection, positive integer quantities, version, guest expiration, empty carts, and no-snapshot rejection.
- `db:carts:init` — PASS, creating/updating the strict `carts` validator and justified indexes idempotently on an empty collection.
- `db:carts:check` — PASS, proving validator/index presence and database rejection of invalid owner shapes, unsupported status, invalid quantities, missing references, invalid version, unexpected fields, and commercial/product/inventory snapshots.
- Database inspection — PASS: `carts` exists, contains 0 documents after verification cleanup, and has the four expected indexes.
- `domain:commerce:architecture:check` — PASS, confirming premature UI/payment/cinematic commerce work remains absent while allowing the Stage 3.3 server persistence layer.

### Deferred boundaries

Stage 3.3 owns guest/account cart persistence, cookie handling, token hashing in request flows, ownership-aware read/create behavior, version-safe mutations, and service/repository operations. Stage 3.4 owns Cart Drawer UI. Stage 3.10 owns cinematic `ACQUIRE` integration.

## Stage 3.3 — Guest & Account Cart Persistence

**Status:** COMPLETE.

Stage 3.3 implements the real server-side cart persistence layer without introducing customer-facing cart UI, PDP Add to Bag wiring, Cart Drawer, checkout, wishlist, Auth.js, payments, or cinematic `ACQUIRE` changes.

### Implemented persistence boundary

- `MongoCartRepository` provides controlled server-only cart operations for active guest/user carts, creation, add-or-increment, quantity updates, remove, clear, and expiry marking.
- Guest tokens are generated with `crypto.randomBytes(32)` and encoded as opaque base64url values.
- MongoDB stores only `guestTokenHash`, a deterministic SHA-256 lowercase hex digest. Raw guest tokens are not persisted and are not returned in the cart view model.
- Cookie policy is centralized for `aura_guest_cart`: `HttpOnly`, `SameSite=Lax`, `Path=/`, production-only `Secure`, and a 30-day inactivity expiry descriptor.
- The Stage 3.3 transport boundary remains service-only. No Server Action or Route Handler was exposed yet because no UI is wired until Stage 3.4.

### Read/create lifecycle

- Reading a guest cart with no cookie, malformed cookie, unknown token, or expired cart returns the canonical empty cart view and does not create a MongoDB document.
- The first successful guest mutation validates the Product/Variant first, then creates the ACTIVE guest cart, returns a replacement cookie descriptor, and persists the mutation.
- Expired guest carts are safely marked `EXPIRED` and are not reactivated. The next successful mutation rotates to a fresh token and a fresh ACTIVE cart.
- Successful guest mutations refresh `updatedAt` and `expiresAt`; reads alone do not extend abandoned cart lifetime.

### Account cart boundary

- USER cart persistence now exists for trusted server-side user contexts.
- USER carts use canonical `userId`, never `guestTokenHash`, and do not create guest cookies.
- No Auth.js/session/login merge was introduced. Guest-to-user merge remains deferred to Stage 4.8.

### Server-authoritative cart view model

The cart service returns a safe serializable view model:

- no MongoDB `_id`
- no owner identifiers
- no guest token
- no `guestTokenHash`
- total-unit `itemCount`
- current Product/Variant name, slug, media, variant label, and minor-unit prices resolved at read time
- `subtotal` computed from currently sellable lines only
- conservative `checkoutEligible`

Cart documents still contain only ownership/lifecycle, line references, quantities, version, and timestamps. They do not contain price snapshots, product snapshots, inventory snapshots, subtotals, discounts, or totals.

### Product, price, and inventory policy

- Add/update mutations validate that product exists, is `PUBLISHED`, the variant belongs to that product, and the variant is active.
- Cart price display is resolved from the current ProductVariant. If the canonical variant price changes after the item was added, the next cart read returns the new current price.
- Cart persistence does not call inventory `reserve()`, `release()`, or `commit()`.
- Inventory state may resolve as `AVAILABLE`, `OUT_OF_STOCK`, or `UNTRACKED`; `UNTRACKED` is not treated as available.
- If a persisted line becomes unavailable after being added, reads do not crash or silently delete it. The line is returned as `UNAVAILABLE`, excluded from purchasable subtotal, and `checkoutEligible` becomes false.

### Concurrency and mutations

- `addItem()` atomically adds a new embedded line or increments the existing product/variant line; duplicate concurrent adds do not create duplicate embedded lines.
- Version-sensitive mutations use the Stage 3.2 `version` field. Successful mutations increment version; stale expected versions return `CONFLICT`.
- `updateItemQuantity()` accepts positive integers; `0` removes the line; negative/decimal/malformed values are rejected by strict validation.
- `removeItem()` and `clearCart()` preserve ownership and ACTIVE cart identity while incrementing version and refreshing guest expiry on successful guest mutations.

### Verification

- `domain:cart:check` — PASS.
- `db:carts:check` — PASS.
- `domain:commerce:architecture:check` — PASS after updating the guardrail to permit Stage 3.3 server persistence while continuing to block UI, payment, Auth.js, wishlist, checkout, and cinematic commerce integration.
- `domain:cart:persistence:check` — PASS for no-read-create, guest token/hash/cookie policy, first-mutation creation, persistence across reads, raw-token non-storage, current-price freshness, no inventory reservation, duplicate concurrent adds, stale-version conflict, update/remove/clear, expiry rotation, UNTRACKED behavior, Product/Variant validation, and trusted USER cart isolation.
- TypeScript — PASS.
- Local ESLint — PASS with the existing root-layout font warning only.

### Deferred boundaries

Stage 3.4 owns Cart Drawer UI and customer-facing drawer mutation wiring. Stage 3.5 owns the full cart page. Stage 3.6 owns final quantity/inventory validation. Stage 3.7 owns Wishlist. Stage 3.10 owns cinematic `ACQUIRE` integration.

## Stage 3.4 — Cart Drawer

**Status:** COMPLETE.

Stage 3.4 adds AURA's first real cart UI surface: an isolated Header Bag trigger and Cart Drawer client boundary over the Stage 3.3 server-authoritative cart service.

### Scope implemented

- Header Shopping Bag is now a real accessible `<button>` with `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`, visible focus behavior, and AURA header styling.
- Bag badge uses the accepted total-unit `itemCount` policy and is hidden when `itemCount` is `0`.
- The drawer performs a fresh server read when opened and also refreshes the badge through the same isolated cart boundary after hydration.
- StorefrontHeaderShell remains a Server Component and does not call `cookies()` or cart reads directly.
- Discovery routes remain server-oriented; production build still reports `/` as static. Cart freshness is scoped to the client cart controller + Server Actions.

### Server bridge

Stage 3.4 adds the minimum Server Action bridge:

- `readCurrentCartAction()`
- `removeCartItemAction()`
- `clearCartAction()`

Each action delegates to the Stage 3.3 cart service. No REST cart API, no checkout route, and no full cart page were created. The drawer never accesses MongoDB directly.

The view model includes a server-generated opaque `lineId` for remove/clear coordination. It is not ownership proof. Ownership remains derived from the HttpOnly guest cookie on the server, and version conflicts still use the Stage 3.3 cart `version`.

### Drawer UX and accessibility

- Modal dialog semantics with accessible title/description.
- Semantic backdrop button.
- Close button.
- Escape close.
- Focus trap.
- Focus restoration to the trigger.
- Body scroll lock and scroll restoration.
- Safe-area-aware `100dvh` panel.
- Mobile near/full-width layout with internal scrolling.
- Reduced-motion handling for the loading spinner.
- Loading, empty, error, and content states.

### Cart content behavior

- Lines render only from the safe Stage 3.3 Cart view model.
- Money display uses the central minor-unit formatter.
- Product links use canonical slugs where available.
- `UNTRACKED` renders as neutral “Availability pending”, never “In Stock”.
- `OUT_OF_STOCK`/`UNAVAILABLE` states remain readable and removable.
- Remove uses the Stage 3.3 service and returns the new authoritative cart view model; the drawer and badge synchronize from that same response.
- Stale-version `CONFLICT` responses trigger a safe cart refresh and subtle user-facing message.
- Optional Clear Bag is implemented through Stage 3.3 `clearCart()`, preserving the ACTIVE cart document.

### Boundaries preserved

Stage 3.4 does not add:

- `/cart`
- checkout
- Stripe/PayPal
- wishlist
- discounts
- gift cards
- Auth.js
- guest/account merge
- PDP Add to Bag
- quantity stepper
- inventory reservation
- cinematic `ACQUIRE`

### Verification

- `domain:cart:drawer:check` — PASS for isolated cart UI, accessible dialog hooks, server-action bridge, central money formatting, no local storage, no checkout/full-cart/cinematic scope, and test-only loader protection.
- `domain:cart:persistence:check` — PASS, proving read-without-create, guest persistence, version conflicts, price freshness, no inventory reservation, expiry rotation, and USER isolation remain intact.
- `domain:commerce:architecture:check` — PASS.
- TypeScript — PASS.
- Local ESLint — PASS with the existing root-layout font warning only.
- Production build — PASS; `/` remains static and cart freshness is not globalized.

### Deferred boundaries

Stage 3.5 owns the full Cart Page. Stage 3.6 owns quantity controls and inventory-aware validation. Stage 3.10 owns cinematic `ACQUIRE` integration.

## Stage 3.5 — Full Cart Page

**Status:** COMPLETE.

Stage 3.5 adds the real private `/cart` storefront route backed by the Stage 3.3 server-authoritative cart service and coordinated with the Stage 3.4 Header Bag/Cart Drawer surface.

### Route and cache behavior

- `/cart` exists inside the storefront route group.
- `/cart` is intentionally dynamic and non-indexable with `robots: { index: false, follow: false }`.
- The route performs a server-side initial cart read using the HttpOnly guest cart cookie and `CartService`.
- Opening `/cart` without a cookie renders the canonical empty state and creates no MongoDB cart document.
- Discovery routes are not globalized for cart freshness. Production build confirms `/` remains static while `/cart` is dynamic.

### Page presentation

- Semantic `h1` page hierarchy with full Maison styling.
- Desktop layout uses cart lines plus a restrained summary panel.
- Mobile/tablet stack into a single-column layout with responsive media and wrapping text.
- Empty and safe error states link to `/fragrances`.
- Product images/names link to real PDPs only when a canonical `productSlug` exists.
- Unavailable lines render intentionally and remain removable.

### Cart behavior

- The page renders only the safe Stage 3.3 Cart view model.
- Money display uses the central minor-unit formatter.
- Subtotal and total-unit `itemCount` come from the server view model.
- Remove and Clear Bag reuse Stage 3.4 Server Actions, which delegate to the Stage 3.3 cart service.
- Mutations publish the returned safe cart view so Header badge and Cart Drawer presentation synchronize from the same server-authoritative result.
- Stale-version `CONFLICT` responses re-read and refresh the page presentation with a safe user message.
- `UNTRACKED` remains neutral “Availability pending”, not “In Stock”.

### Boundaries preserved

Stage 3.5 does not add:

- quantity `+/-`, dropdowns, or text editing
- checkout or `/checkout`
- tax/shipping/discount/gift-card totals
- PDP Add to Bag
- wishlist
- Auth.js
- guest/user merge
- Stripe/PayPal
- orders
- inventory reservation
- cinematic `ACQUIRE`

### Verification

- `domain:cart:page:check` — PASS for private route, server-authoritative initial read, central money formatting, accessible structure/status messaging, no quantity/checkout/cinematic scope, and test-only loader protection.
- `domain:cart:drawer:check` — PASS with the new real View Bag link.
- `domain:cart:persistence:check` — PASS.
- `domain:commerce:architecture:check` — PASS.
- HTTP smoke with `next start`: `/cart` returns 200 with no cookie and renders the empty state; `/` returns 200.
- Database sanity after `/cart` no-cookie smoke: `carts: 0`, Stage 3.3 fixtures: `0`.
- Production build — PASS; `/cart` is dynamic and `/` remains static.

### Deferred boundaries

Stage 3.6 owns quantity controls and inventory-aware validation. Checkout remains Phase 5. Cinematic `ACQUIRE` remains Stage 3.10.

## Stage 3.6 — Quantity & Inventory Validation

**Status:** COMPLETE.

Stage 3.6 makes the first storefront purchase-entry flow real while preserving ADR-023: adding to cart is purchase intent and does not reserve inventory.

### Scope implemented

- PDP Add to Bag is wired through a controlled Server Action using only public `productSlug`, canonical `variantId`, and quantity intent.
- `CartService` remains the authoritative mutation boundary: it resolves Product, Variant, current Inventory, current price, ownership, version, and guest-cookie lifecycle.
- Add/increment validates the resulting target line quantity against current Inventory `available`.
- UNTRACKED and OUT_OF_STOCK variants cannot be newly added or incremented under the current owner policy.
- Failed inventory validation happens before first guest-cart creation, so failed Add does not leave an orphan empty cart.
- Drawer and full `/cart` now include restrained `+ / −` steppers with semantic buttons, accessible names, pending state, and polite status feedback.
- Quantity `0` uses the existing remove/update-to-zero contract.
- Decrement remains allowed for stale, untracked, out-of-stock, or unavailable lines so the customer can reduce/remove purchase intent.
- The cart view model exposes only safe presentation booleans (`quantityValid`, `canIncrement`, `canDecrement`) and never exposes raw inventory counters.
- PDP Add success publishes the returned safe cart view and requests the existing Cart Drawer to open through the existing event coordination boundary.

### Inventory and checkout policy

Cart mutations do not call `reserve()`, `release()`, or `commit()`. Inventory counters remain unchanged by Add, Increase, Decrease, Remove, and Clear. Different guests may still each place the last unit in separate carts because carts are not reservations; checkout/payment preparation owns final inventory exclusivity.

`checkoutEligible` is still advisory and false when the cart is empty, a Product/Variant is unavailable, a line is OUT_OF_STOCK, a line is UNTRACKED, or a tracked line quantity exceeds current permitted availability. Phase 5 must revalidate inventory and pricing before checkout/order creation.

### Real catalog inventory coverage

Verification against the current catalog reported:

- Total sellable variants: 36
- TRACKED: 0
- UNTRACKED: 36
- OUT_OF_STOCK: 0

This is a business-data dependency, not an implementation failure. Before production purchasing or Phase 3 final sign-off, the owner must either provide initial inventory quantities for sellable variants or explicitly approve a non-stock-tracked selling policy. AURA has not silently chosen either option.

### Boundaries preserved

Stage 3.6 does not add checkout, `/checkout`, Buy Now, payments, tax, shipping, Wishlist, discounts, gift cards, Auth.js, guest/account merge, inventory admin, catalog/search quick-add buttons, or cinematic `ACQUIRE` integration.

### Verification

- `domain:cart:inventory:check` — PASS for tracked available add, first guest cart creation, failed-add no-orphan behavior, OUT_OF_STOCK/UNTRACKED rejection, inactive/archived/wrong-variant rejection, quantity increase/decrease/remove, invalid quantity rejection, same-cart near-limit concurrency, different-cart non-reservation behavior, stock-drop stale-line presentation, checkout eligibility, no raw inventory counters, and unchanged inventory counters.
- `domain:cart:persistence:check` — PASS under the stricter UNTRACKED policy.
- `domain:cart:drawer:check` and `domain:cart:page:check` — PASS with quantity-aware UI boundaries.
- `domain:storefront:product-detail:check` — PASS with real PDP Add to Bag while preserving cinematic isolation.

### Stage 3.10 — Fragrance World → Cart Integration

Complete. Cinematic `ACQUIRE` submits only a validated public world number to a server action. The server resolves ordered membership in hidden `cinematic-worlds` to the canonical Product, requires exactly one active Variant, and delegates to the existing `CartService.addItemBySlug`. Publication, variant activity, and inventory remain server-authoritative; archived/unpublished, multi-variant, OUT_OF_STOCK, and UNTRACKED targets cannot create a first guest Cart. Successful mutations publish the existing Cart view and request the existing Drawer. No cinematic Cart, local storage, reservation, checkout, payment, notes, preview, URL state, or animation refactor was added.

Atlas verification passed with six mappings and a temporary tracked fixture cleaned afterward. The actual report showed World 1 multi-variant/UNTRACKED, Worlds 2/4/6 archived, and Worlds 3/5 published single-variant/UNTRACKED.

### Stage 3.11 — Commerce Integration Tests

Complete. The consolidated `domain:commerce:integration:check` runner was added without replacing stage-specific checks. Atlas initializer/validator/index checks, Cart lifecycle/price/inventory/concurrency/ownership, Wishlist independence/concurrency/price freshness, Discount evaluation, Gift Card balance/idempotency/atomicity/concurrency, cinematic mapping/ACQUIRE integration, and storefront boundaries were rerun. No business-code defect was found, no schema or UI feature was added, and all temporary fixtures were cleaned. TypeScript, ESLint, production build, npm audit, security scans, and scoped diff verification remain green; the known repo-wide baseline whitespace issue remains separately documented.
- TypeScript — PASS.
- Local ESLint — PASS with the existing root-layout font warning only.

### Deferred boundaries

Stage 3.7 owns Wishlist. Checkout remains Phase 5. Cinematic `ACQUIRE` remains Stage 3.10.

## Phase Acceptance Criteria

Guest carts survive refresh, account merge is safe, price/inventory are server-authoritative, and `ACQUIRE` updates the live bag without reloading the scene.

## Known Issues

- The host global npm shim remains broken; direct local tool invocations are used for verification.
- Full ESLint now passes with 0 errors and 0 warnings after the next/font/google migration.
- Windows line-ending warnings appear during Git checks but are not whitespace failures.
- Browser automation is not installed, so pixel-level browser checks are not claimed in Stage 3.5.

## Final Sign-Off

### Stage 3.12 — Phase 3 Sign-Off

Complete. The first bad commit is not recoverable because the Phase 2–3 implementation exists as an uncommitted worktree overlay on `f52d72f`; however, controlled fresh builds localized the regression to streaming boundaries. Either root `src/app/loading.tsx` or storefront `src/app/(storefront)/loading.tsx` alone flushed a 200 response before the Product/Collection route could call `notFound()`. Removing both boundaries restored actual 404 status for archived/unknown Products and hidden Collections; the cinematic loading boundary remains isolated. The HTTP status regression check, Commerce integration suite, Storefront checks, TypeScript, full ESLint, production build, npm audit, and Atlas-backed checks pass. Phase 4 is READY — NOT STARTED.
