# AURA Security Architecture

## Baseline

The Phase 0 application is a public static/cinematic frontend with no database, authentication, payment, or private API surface. Security controls expand with each relevant phase.

## Mandatory Controls

- Validate all untrusted input server-side.
- Enforce authentication and role authorization on the server.
- Use secure, HTTP-only, same-site cookies where applicable.
- Hash passwords with a modern password hash; never log credentials or reset tokens.
- Apply rate limits to authentication, contact, newsletter, search abuse, and checkout initiation.
- Review CSRF protection for cookie-authenticated mutations.
- Encode output and restrict rich content to prevent XSS.
- Keep secrets in server-only validated environment variables.
- Verify payment webhook signatures and idempotency.
- Never store raw card numbers or CVV.
- Audit material admin and order state changes.
- Prevent negative inventory through transactional guards.

## Review Gates

Security assumptions are reviewed during each owning phase and comprehensively in Phase 9. Missing credentials or legal/business data must be documented rather than simulated.

## Stage 4.1 Authentication Architecture Controls

- AURA's existing `users` collection is the canonical identity; Auth.js session presence never grants role, status, ownership, or admin authority.
- The initial method scope is email/password Credentials only. No Auth.js package, provider, handler, password, token, or authentication collection is implemented in Stage 4.1.
- Credentials-only plus database sessions is not supported by the inspected Auth.js core: it returns `UnsupportedStrategy`. The owner-approved path is Credentials + JWT Sessions with an opaque `HttpOnly`, `SameSite=Lax`, production-`Secure` cookie and explicit expiry. JWT role/status/permission claims are not authoritative; protected boundaries reload canonical User status/verification and compare server-side `authCredentials.sessionVersion`.
- Password material belongs in future server-only `authCredentials` records as versioned Argon2id hashes; raw passwords, client hashes, reset tokens, and cookies are never logged or returned.
- Future `authTokens` records store only purpose-bound one-way digests for email verification and password reset. Expiry and atomic single-use consumption are authorization requirements; TTL is cleanup only.
- Registration is always `CUSTOMER` + `PENDING`; `ADMIN` is assigned only by an explicit server-side administrative policy. AURA loads the canonical User before account, Cart, Wishlist, address, or order authorization.
- Account responses are private/no-store where appropriate. Registration/login/recovery responses are non-enumerating, and each auth entry point has independent rate-limit and CSRF review requirements.
- Auth state remains out of root/storefront layouts and public discovery caches so the Phase 3 streaming/404 boundary is preserved. Guest-to-user Cart/Wishlist merge is implemented only at the Stage 4.8 post-login handoff boundary.

## Active Foundation Finding

The 2026-08-17 audit originally reported five high-severity findings centered on Next.js 14.2.35 and its lint tree. Stage 1.3 upgraded to Next.js 15.5.21 Maintenance LTS/React 19 and pinned compatible safe transitive PostCSS and Sharp versions through npm overrides. The post-upgrade npm audit reports **zero vulnerabilities**.

## Stage 1.4 Database Controls

- `MONGODB_URI` is server-only and remains in ignored `.env.local`; it is not included in examples, tracked files, logs, or browser bundles.
- MongoDB uses Stable API v1 and a bounded reusable connection pool.
- The connection verification command emits only a pass/fail result and an error class on failure, never the URI, database credentials, or server response.
- Collection validators, unique indexes, and transactions are mandatory defense layers for their later owning domain stages.

## Stage 3.1 Commerce Security Controls

- Guest carts use an opaque, high-entropy `aura_guest_cart` cookie with `HttpOnly`, `SameSite=Lax`, production `Secure`, and path `/`.
- The guest cart cookie contains no product data, prices, quantities, PII, raw MongoDB documents, or raw ObjectIds used as authorization.
- Every cart mutation must verify ownership server-side before reading or mutating lines.
- Cookie-authenticated mutations require CSRF review before implementation; `SameSite=Lax` is a baseline, not the full defense.
- Client-submitted prices, totals, discounts, gift-card balances, inventory state, and ownership claims are never authoritative.
- Cart tokens, token hashes, cookies, and owner identifiers must not be logged in public diagnostics.
- Cart abuse/rate-limit controls are reviewed in the owning mutation stages and again in Phase 9.

## Stage 3.2 Cart Model Security Controls

- The `carts` collection stores only `guestTokenHash`, never raw guest cookie tokens.
- Cart documents contain no customer PII.
- Cart lines contain no client-provided prices, totals, product snapshots, or inventory snapshots.
- One-active-cart ownership indexes are defense-in-depth for consistency and do not replace future server-side authorization checks.
- Stage 3.2 introduces no cookies, request-body ownership trust, Server Actions, Route Handlers, Cart UI, checkout, payments, or cinematic commerce integration.

## Stage 3.3 Cart Persistence Security Controls

- Guest cart tokens are generated server-side with cryptographic randomness and are opaque base64url values.
- MongoDB stores only SHA-256 `guestTokenHash`; raw cookie tokens are never persisted or included in cart view models.
- Cookie configuration is centralized for `aura_guest_cart`: `HttpOnly`, `SameSite=Lax`, `Path=/`, production-only `Secure`, and approximately 30-day inactivity expiry.
- Reading a cart without a valid cookie returns an empty view and does not create a database document.
- Mutations validate Product/Variant sellability before creating a first guest cart, preventing empty orphan carts for invalid requests.
- Expired guest carts are marked `EXPIRED` and rotated instead of being reactivated.
- USER cart persistence accepts `userId` only from trusted server context; no Auth.js/session or public user-selected ownership mechanism exists yet.
- Cart service outputs do not expose cart `_id`, owner identifiers, raw guest tokens, guest token hashes, or MongoDB internals.
- Cart persistence does not reserve inventory and does not treat `UNTRACKED` as available.

## Stage 3.4 Cart Drawer Security Controls

- Cart Drawer is a client presentation boundary only; it does not access MongoDB directly.
- Cart Server Actions derive guest ownership from the HttpOnly `aura_guest_cart` cookie and never from client-submitted owner/cart identifiers.
- The drawer receives only the safe cart view model. It does not receive raw guest tokens, token hashes, cart `_id`, owner identifiers, or MongoDB metadata.
- Remove/Clear mutations use the Stage 3.3 version contract and refresh on conflicts rather than overwriting stale state.
- Header server rendering does not call `cookies()` for badge display; cart freshness is scoped to the isolated cart action boundary.
- No `document.cookie`, localStorage/sessionStorage cart authority, checkout, payment, inventory reservation, Auth.js, or cinematic commerce integration was added.

## Stage 3.5 Full Cart Page Security Controls

- `/cart` is private user-specific state and is marked non-indexable.
- `/cart` reads ownership from server cookie context only; it does not accept cart ID, owner ID, guest token hash, or raw token from the browser.
- The page passes only safe cart view-model fields and public errors to the client component.
- `lineId` remains a UI coordination token only; ownership is still determined by the server-selected cart context.
- Remove/Clear use existing Server Actions and Stage 3.3 version conflict handling.
- Visiting `/cart` without a guest cookie does not create a persistent cart or set a cookie.
- No email, address, account data, payment data, checkout state, or order state is displayed.

## Stage 3.6 Quantity and Inventory Security Controls

- PDP Add to Bag submits only public `productSlug`, canonical `variantId`, and quantity intent; the browser cannot submit price, subtotal, inventory state, cart ID, owner, guest token, or guest token hash as authority.
- Quantity Server Actions use strict validation and reject negative, decimal, malformed, and unexpected-field inputs.
- Cart service validates Product publication, Variant membership/active state, Inventory existence, and target quantity before Add/Increase succeeds.
- Failed inventory validation occurs before first guest-cart creation, preventing empty orphan carts for UNTRACKED/OUT_OF_STOCK Add attempts.
- `INSUFFICIENT_INVENTORY` responses use the safe public message and do not expose stock counters or inventory document identifiers.
- Cart view models expose only presentation-safe `availability`, `quantityValid`, `canIncrement`, and `canDecrement`; they do not expose `available`, `reserved`, or `committed`.
- Cart mutations still do not call Inventory `reserve()`, `release()`, or `commit()`.
- Current catalog sellable variants remain UNTRACKED until owner-supplied stock or an explicit non-stock-tracked selling policy is approved.
## Authentication Persistence Foundations — Stage 4.2 P1

- Passwords are hashed server-side with `argon2@0.45.1` Argon2id using `memoryCost=19456`, `timeCost=2`, and `parallelism=1`; the stored hash is versioned and no plaintext/client hash is persisted.
- Verification tokens are cryptographically random, represented externally only as a raw one-time value, and persisted only as a lowercase SHA-256 digest with purpose and expiry. P1 creates `EMAIL_VERIFICATION` records only.
- Atlas strict validators reject unknown fields, including raw password/token fields. Token consumption is atomic and requires matching purpose, unconsumed state, and future expiry; TTL is cleanup rather than authorization.
- `sessionVersion` is initialized to `0` in `authCredentials`; Auth.js/JWT/session behavior remains deferred. No secrets, provider credentials, Auth.js package, or authentication UI was added.

## Registration Controls — Stage 4.2 P2

- Registration normalizes email server-side and assigns `CUSTOMER` plus `PENDING`; role/status are never accepted from the client.
- User, credential, and `EMAIL_VERIFICATION` persistence is one Atlas transaction, so failed registration cannot leave a partial identity. Unique email races return the same safe public response and do not disclose account existence.
- Raw passwords and raw verification tokens are never persisted or logged. Only the token digest is stored; the raw value is passed to the fake/in-memory email sender for this controlled stage.
- Resend is restricted to eligible pending accounts, rotates the outstanding token, and does not change the password or create a User. Delivery failure after commit preserves the pending account for resend.
- Auth.js, JWT/session, login/logout, verification activation, password recovery, `PASSWORD_RESET`, real email providers, and Cart/Wishlist merge remain outside P2.

## Login & Session Authority Controls — Stage 4.3 P2

- Auth.js Credentials accepts only canonical normalized email credentials for an `ACTIVE` User whose email is verified and whose server-side Argon2id credential matches. PENDING, DISABLED, invalid, wrong-password, and missing-credential cases fail without account enumeration.
- JWT transport is minimal and opaque to the browser: only the canonical subject and comparison `sessionVersion` are carried. Role, status, permissions, ownership, and profile facts remain server-authoritative.
- Session reads reload `users` and `authCredentials` from Atlas and compare the current server-controlled `sessionVersion`. Incrementing the version or disabling the User invalidates previously issued JWTs. No database sessions, `authSessions`, Auth.js MongoDB adapter, OAuth, Password Recovery, or Cart/Wishlist merge was added.

## Login UI & Logout Controls — Stage 4.3 P3

- The Maison `/login` form submits credentials only to a server action. Browser code does not store passwords, tokens, JWTs, or session state. Invalid credentials use one generic non-enumerating message.
- Auth.js `signIn("credentials")` and `signOut` are the only runtime login/logout mechanisms. The server session helper reloads canonical authority before exposing an authenticated state, preserving status, email-verification, credential, and `sessionVersion` checks.
- Atlas-backed runtime verification covered real callback login, session read, and logout with cleanup. Account/Profile, Password Recovery, OAuth, and Cart/Wishlist merge remain deferred.

## Password Recovery Controls — Stage 4.4

- Recovery requests normalize email server-side and return the same accepted message for unknown, PENDING, DISABLED, missing-credential, and eligible accounts. Account existence is not disclosed.
- `PASSWORD_RESET` values are generated server-side with cryptographic randomness. Atlas persists only the lowercase SHA-256 digest, purpose, expiry, and consumed timestamp; raw reset tokens and passwords are never persisted or logged.
- A recovery request invalidates outstanding reset tokens before creating one replacement for an eligible ACTIVE, email-verified account. Delivery is post-commit through the fake/in-memory sender; delivery failure does not roll back or delete the identity.
- GET inspection hashes and reads only. Password change requires explicit POST, strict input validation, matching purpose, unconsumed state, and future expiry. Token consumption and credential replacement occur in one Atlas transaction.
- Successful reset writes the Argon2id hash under the accepted policy and increments `authCredentials.sessionVersion`, invalidating previously issued JWTs. Replay, expiry, PENDING, and DISABLED cases cannot activate or replace credentials; concurrent use has one winner.
- Reset transport responses are `no-store`, `private` where applicable, and `no-referrer`. The browser does not persist raw tokens in localStorage/sessionStorage; the reset form removes the token from the URL after success.
- No production email provider, Account/Profile behavior, Password Recovery beyond this stage, or Cart/Wishlist merge was added.

## Order History Controls — Stage 4.7

- Order History authorization requires Auth.js session identity, current `sessionVersion`, and canonical ACTIVE + verified User authority; session presence alone is insufficient.
- List and detail reads are ownership-scoped in the repository. Cross-user order access is rejected without leaking another customer's data.
- The browser cannot control ownership fields. Customer Order History is read-only and cannot mutate status, payment, fulfillment, totals, ownership, or snapshots.
- Historical line items, addresses, and totals come from the stored Order snapshot. `orderNumber` is the visible customer reference; MongoDB `_id` is not exposed as that reference.
