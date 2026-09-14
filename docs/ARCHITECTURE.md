# AURA Architecture

## System Shape

AURA is a **modular monolith** built with Next.js 14 App Router and TypeScript. It keeps one deployable application while enforcing domain and server boundaries that can be extracted later only if scale justifies it.

```text
App Router / UI composition
        ↓
Application services / use cases
        ↓
Domain models and policies
        ↓
Repositories and external integrations
        ↓
MongoDB / payment / email / media providers
```

## Source Layout

- `src/app/` — routes, layouts, metadata, route handlers, and server-action composition.
- `src/components/` — visual components. Existing cinematic components remain here until incremental organization is justified.
- `src/config/` — centralized non-secret site configuration and later typed environment access.
- `src/domain/` — provider-independent entities, value objects, policies, and domain types.
- `src/server/` — server-only application services, repositories, authorization, and integrations.
- `src/lib/` — small cross-cutting utilities without business policy.
- `src/validation/` — shared input schemas at trust boundaries.

## Accepted Technology Baseline

- Next.js 15.5.21 Maintenance LTS, React/React DOM 19.2.8, TypeScript, Tailwind CSS, and GSAP. Phase 0's historical baseline was Next.js 14/React 18.
- npm with the tracked `package-lock.json`; no mixed lockfiles.
- MongoDB Atlas with the official MongoDB Node.js driver for commerce data. MongoDB multi-document transactions are required wherever a commerce invariant spans documents.
- Zod at environment, form, API, and server-action boundaries.
- Auth.js for application authentication, with server-side authorization layered above sessions.
- Stripe and PayPal through official SDKs and verified webhooks.
- Cloudinary remains the cinematic/product media provider.

See `decisions/ARCHITECTURE-DECISIONS.md` for context and consequences.

## Domain Boundaries

- **Catalog:** Product, ProductVariant, ProductMedia, Collection, FragranceNote.
- **Identity:** User, Address, Session, role and account status.
- **Commerce:** Cart, Wishlist, Discount, GiftCard, inventory reservations.
- **Ordering:** Order, immutable OrderItem snapshots, Payment, Shipment, status history.
- **Content:** Campaign blocks, social/contact configuration, newsletter, boutique records.
- **Administration:** authorization policies and AdminAuditLog.

## Single Source of Truth

The product domain will become authoritative for cinematic worlds, storefront, product pages, search, cart, checkout, and admin. Client-submitted price, inventory, role, discount, or payment state is never authoritative.

Stage 1.5 establishes the first concrete boundary: `src/domain/product/product.schema.ts` owns the Product, Variant, Media, Money, lifecycle, and concentration contracts. `src/server/repositories/mongo-product-repository.ts` is the only current persistence adapter. UI components are not yet consumers; migrating the six cinematic worlds is reserved for Stage 1.12/Phase 8.

## Rendering and API Boundaries

- Prefer Server Components for reads and composition.
- Use Client Components only for browser state, animation, and immediate interaction.
- Mutations pass through validated server actions or route handlers into application services.
- Route handlers are reserved for public APIs, provider webhooks, and integrations requiring HTTP endpoints.
- Database access is isolated behind server-only repositories/services.

## Authentication and Customer Account Architecture — Stage 4.1

Auth.js is the authentication/session-mechanics boundary accepted by ADR-007. AURA remains authoritative for the canonical `users` record, `CUSTOMER`/`ADMIN` roles, `PENDING`/`ACTIVE`/`DISABLED` status, verification state, resource ownership, and admin authorization. A session is an identity signal, never an authorization decision.

The initial method scope is email/password Credentials only. Compatibility closure against `next-auth@5.0.0-beta.32` / `@auth/core@0.41.3` proved that Credentials-only with `session.strategy: "database"` returns `UnsupportedStrategy`; that proposal is superseded. The owner-approved strategy is Auth.js Credentials + JWT Sessions. JWT is transport for minimal identity and `sessionVersion` data, never authority for role, status, permissions, ownership, or profile facts. Protected server boundaries reload canonical AURA `userId` authority and compare the server-controlled `authCredentials.sessionVersion`. Password hashes and `sessionVersion` belong in future `authCredentials`; single-use verification/recovery token digests belong in `authTokens`; no `authSessions` primary collection is required for JWT sessions. Stage 4.1 creates none of these collections and installs no Auth.js package.

Future server policy composition is `session identity → canonical User lookup → active/verification check → role/ownership policy → repository/service`. Registration always creates a `CUSTOMER`/`PENDING` user; `ADMIN` is never client-selectable. Cart/Wishlist merge is implemented at the Stage 4.8 post-login handoff boundary.

Authentication request state must remain inside protected account routes/actions. Do not read global `auth()` or `cookies()` from the root or storefront layout; this preserves public discovery caching and the Phase 3 true-404 behavior. Cinematic loading and protected cinematic components remain isolated.

## Commerce Architecture

Stage 3.1 establishes commerce as server/database-authoritative. Cart reads and mutations resolve canonical ProductVariant prices in integer minor units, current sellability, and inventory state on the server. Browser state may coordinate interaction, pending UI, and drawer/badge refresh, but it never owns prices, totals, inventory, discounts, gift-card balances, or ownership.

Guest carts are future MongoDB documents identified by an opaque secure `aura_guest_cart` cookie. The cookie contains no cart contents, product facts, PII, raw MongoDB documents, or raw ObjectIds used as authorization. Authentication remains Phase 4, but cart ownership is designed around `GUEST` and future `USER` owner kinds so login merge can combine duplicate variant lines deterministically.

Adding to cart is purchase intent and does not reserve inventory. Inventory reservations remain a checkout/payment-preparation boundary that uses the existing Phase 1 reservation lifecycle. `UNTRACKED` inventory is displayable in discovery but is not silently treated as in stock.

Stage 3.2 adds the Cart data model: one MongoDB `carts` document with embedded lines, one active cart per owner, owner union (`GUEST` token hash or future `USER` ID), status `ACTIVE`/`CONVERTED`/`EXPIRED`, version `0`, guest `expiresAt`, and line references limited to `productId`, `variantId`, and `quantity`. Cart documents intentionally do not store price, product, or inventory snapshots.

Stage 3.3 adds the server-only cart persistence layer on that model. `MongoCartRepository` owns controlled database mutations, and `CartService` owns ownership resolution, lifecycle, Product/Variant validation, current-price resolution, inventory-state projection, view-model construction, version conflicts, and expiry rotation. Reads with no valid guest cookie return an empty view without creating a cart; the first valid mutation creates the guest cart and returns an HttpOnly cookie descriptor. USER cart persistence exists only for trusted server-side user context. No Cart Drawer, PDP Add to Bag wiring, public cart API, checkout, wishlist, Auth.js, payments, or cinematic commerce integration exists yet.

Stage 3.4 adds the isolated Cart Drawer presentation boundary. StorefrontHeaderShell remains server-rendered and does not read cart cookies. `StorefrontCartAction` is the small client coordinator for drawer open/close, badge state, loading/error state, remove/clear pending state, and focus/scroll lifecycle. Server Actions call the Stage 3.3 cart service for all authoritative reads and mutations, so Product/Variant money, inventory presentation, ownership, and version conflicts remain server-controlled.

Stage 3.5 adds the private `/cart` route. Unlike discovery routes, `/cart` is intentionally dynamic and non-indexable because it renders user-specific commerce state. The route performs a server-side initial cart read through `CartService`, then hands the safe view model to a small client component for Remove/Clear pending state and synchronization with the Header Bag/Drawer via a browser event carrying only that safe view model. Checkout, quantity editing, inventory reservation, authentication, payment, and cinematic commerce remain outside this stage.

Stage 3.6 adds the first real PDP Add to Bag and quantity controls without changing the reservation boundary. Add/Increase goes through strict Server Actions and `CartService`, resolves `productSlug -> Product`, verifies the selected Variant belongs to that Product, validates current Inventory and target quantity, then persists only cart intent. UNTRACKED and OUT_OF_STOCK variants cannot be newly added or incremented under the current policy. Decrement/remove remains available for stale lines, and the view model exposes only safe quantity flags rather than raw inventory counters. PDP, Header, Drawer, and `/cart` synchronize through safe cart-view events; the event layer is presentation coordination, not authority.

## Cinematic Preservation

`HeroPortalExperience.tsx`, `FragranceWorlds.tsx`, and `FragranceWorldSection.tsx` are protected integration surfaces. Domain adoption will be incremental and regression-tested; the portal is not replaced by a generic store homepage.

## Order History — Stage 4.7 P3

Customer Order History is a protected, read-only Account surface. Auth.js session identity is revalidated through `sessionVersion` and the canonical ACTIVE + verified User before ownership-scoped Order reads. The UI consumes stored immutable Order snapshots and historical totals; `orderNumber` is the customer-facing reference and MongoDB `_id` is not exposed as that reference. Reorder, customer Order mutation, and Stage 4.8 merge behavior remain out of scope.
