# AURA API & Server Boundaries

**Status:** Conventions accepted; endpoints are introduced only in their owning stage.

## Conventions

- Server Components perform authenticated reads directly through server services where appropriate.
- Server Actions handle first-party form/mutation flows when they provide the clearest boundary.
- Route Handlers expose provider webhooks, search suggestions, and integration endpoints that require HTTP semantics.
- All untrusted inputs are validated before domain execution.
- Authentication and authorization are separate checks.
- Errors use stable machine codes and safe user messages; internal details remain server-side.
- Prices, totals, inventory, roles, and payment status are recalculated or verified on the server.

## Authentication Boundary — Stage 4.1

Stage 4.1 defines no auth endpoint or runtime. The future boundary is Auth.js for authentication/session mechanics followed by an AURA canonical User lookup and explicit authorization policy. Server services must derive `userId` from that context; no browser body, URL, cookie, or session claim may choose ownership, role, or status.

Initial method scope is email/password Credentials only. Planned route families are narrowly scoped account/auth handlers for registration and email verification, login/logout/session operations, and password recovery; exact routes belong to Stages 4.2–4.4. OAuth, social login, magic links, passkeys, and provider Accounts are not implied.

The accepted initial strategy is Auth.js Credentials + JWT Sessions. JWT identifies the canonical `userId` and carries the comparison `sessionVersion`; protected services must reload the current `authCredentials` and canonical AURA User, enforce status/verification, and apply role/ownership policy. JWT role/status/permission claims are not authoritative. Future account responses are private/no-store as appropriate, cookie-authenticated mutations receive a CSRF review, and registration/login/recovery errors use safe non-enumerating messages. Cart/Wishlist guest-to-user merge is deferred to Stage 4.8 and must call shared services after successful authentication.

## Authentication Persistence Boundary — Stage 4.2 P1

P1 implements server-only repositories for `authCredentials` and `authTokens`, versioned Argon2id password hashing, random hash-only email-verification token helpers, and an email-sender interface. The repository boundary exposes `EMAIL_VERIFICATION` creation only; `PASSWORD_RESET` remains a future Stage 4.4 purpose. No public auth endpoint, Server Action, Auth.js runtime, JWT/session, registration flow, login, recovery, or email provider was added.

## Registration Boundary — Stage 4.2 P2

`POST /api/auth/register` validates and canonically normalizes registration input, then creates the server-assigned `CUSTOMER`/`PENDING` User, `authCredentials`, and `EMAIL_VERIFICATION` token in one Atlas transaction. `POST /api/auth/verification/resend` is limited to eligible pending accounts, invalidates the outstanding verification token, and creates a replacement without changing credentials or creating another User. Both endpoints return safe non-enumerating responses; verification activation belongs to P3. Email delivery is currently an injected/in-memory sender for controlled verification only, and post-commit delivery failure leaves the persisted account pending for resend.

## Login & Session Boundary — Stage 4.3 P2

Auth.js Credentials is mounted at `/api/auth/[...nextauth]` with `session.strategy: "jwt"`. Login returns only the canonical User id after server-side credential and lifecycle checks. Session reads reload the canonical AURA User and `authCredentials.sessionVersion` from Atlas; stale versions, disabled users, unverified users, and missing credentials are rejected. Logout UX and account routes remain deferred to P3.

## Login & Logout Experience — Stage 4.3 P3

`/login` renders the Maison credential form. Its server action delegates to Auth.js `signIn("credentials")`, returning a safe generic failure for invalid credentials and redirecting successful sign-in through Auth.js. The authenticated state on the page is obtained through the server session helper; its Sign out form delegates to Auth.js `signOut`. No Account/Profile API or Password Recovery boundary is introduced in P3.

`GET /api/auth/verification?token=...` is a non-mutating inspection boundary that returns only `READY`, `EXPIRED`, `USED`, or `INVALID`. `POST /api/auth/verification` accepts only the opaque token and delegates activation to the atomic verification service; it does not accept browser-selected identity, credential, or session fields. Both responses use `no-store` and `no-referrer` protection.

## Password Recovery Boundary — Stage 4.4

`POST /api/auth/password-reset/request` accepts a strict email payload and returns the same accepted message for every public case. Only an eligible ACTIVE, email-verified canonical User with credentials receives a rotated hash-only `PASSWORD_RESET` token through the fake/in-memory email abstraction; the route never returns the raw token or reveals account existence.

`GET /api/auth/password-reset?token=...` hashes and inspects the opaque token without consuming it or changing the User. It returns only `READY`, `EXPIRED`, `USED`, or `INVALID`. `POST /api/auth/password-reset` accepts only the token, new password, and confirmation; the server validates and atomically consumes the token, updates the Argon2id credential, increments `sessionVersion`, invalidates previous JWTs, and rejects replay/expiry/PENDING/DISABLED cases. Both reset routes use no-store/no-referrer response protection. Account/Profile and Cart/Wishlist merge remain outside this stage.

## Planned Endpoint Families

- `/api/search` — query suggestions/results.
- `/api/cart` — guest/account cart mutations where server actions are unsuitable.
- `/api/newsletter` and `/api/newsletter/unsubscribe`.
- `/api/contact`.
- `/api/checkout/*` — provider session/order initiation.
- `/api/webhooks/stripe` and `/api/webhooks/paypal` — signature-verified, idempotent events.
- `/api/admin/*` only where route handlers are preferable to server actions.

No application API routes exist at the Phase 0 baseline.

## Stage 3.1 Commerce Mutation Boundary

Future cart mutations use a shared server/application service layer regardless of transport.

- Server Actions are the default for first-party storefront mutations such as PDP, Cart Drawer, Cart Page, and quantity updates.
- Route Handlers are reserved for HTTP-oriented bridges such as future cinematic `ACQUIRE`, checkout/provider boundaries, and integrations where server actions are unsuitable.
- Both transports must validate input, verify cart ownership, resolve canonical Product/Variant/Inventory facts, calculate money server-side, and return the same serializable cart view model.
- No route handler or server action may accept raw MongoDB mutation objects, client-submitted unit prices, client-submitted totals, client-submitted discount results, or client-submitted inventory state.

## Stage 3.3 Cart Service Boundary

Stage 3.3 keeps cart persistence service-only. No public `/api/cart` route and no customer-facing Server Action is exposed yet.

Implemented server/application operations:

- `readCurrentCart(...)`
- `addItem(...)`
- `updateItemQuantity(...)`
- `removeItem(...)`
- `clearCart(...)`

These operations accept only ownership context from trusted server inputs and product/variant/quantity/version intent. They reject strict-schema input containing commercial snapshots such as price, line total, subtotal, product name, SKU, discount, or inventory claims.

Guest ownership is derived from the HttpOnly `aura_guest_cart` token when present. USER ownership is accepted only as a trusted server-side `userId`; there is still no route or request body where a browser can choose `userId`.

Stage 3.4 UI wiring calls this shared service through the minimum Server Action bridge rather than repositories directly.

## Stage 3.4 Cart Drawer Actions

Stage 3.4 introduces the minimum Server Action bridge for the Header Bag and Cart Drawer:

- `readCurrentCartAction()`
- `removeCartItemAction(...)`
- `clearCartAction(...)`

These actions call the Stage 3.3 cart service and return the same safe cart view model. The Storefront header itself does not read cookies or call cart services during server render, preserving discovery-route caching. Opening the drawer performs a fresh cart read from the action boundary.

No `/cart` page, `/api/cart` REST surface, checkout action, PDP Add to Bag action, quantity stepper action, or cinematic `ACQUIRE` transport was introduced.

## Stage 3.5 Full Cart Page Boundary

Stage 3.5 introduces the private `/cart` route as a Server Component route with a small client mutation component.

- Initial `/cart` rendering reads the current cart through `CartService`.
- Remove/Clear mutations reuse the Stage 3.4 Server Actions.
- The page receives only the safe cart view model and public error shape.
- `/cart` is dynamic and non-indexable; discovery routes remain outside this cookie read boundary.

At Stage 3.5 time, no checkout route/action, quantity mutation action, Add to Bag action, REST cart API, auth/payment/order endpoint, or cinematic transport had been introduced.

## Stage 3.6 Quantity and Inventory Actions

Stage 3.6 adds the controlled storefront purchase-entry and quantity Server Actions:

- `addCartItemAction({ productSlug, variantId, quantity })`
- `updateCartItemQuantityAction({ lineId, quantity, expectedVersion })`

Both actions use strict Zod validation and delegate to `CartService`. They do not accept cart IDs, owner identifiers, prices, SKUs as authority, inventory counts, raw guest tokens, guest token hashes, or MongoDB update objects. The service resolves Product/Variant ownership of the submitted variant, current Inventory state, current minor-unit price, and guest ownership from the HttpOnly `aura_guest_cart` cookie.

UNTRACKED and OUT_OF_STOCK variants cannot be newly added or incremented under the current policy. Decrement/remove remains available for stale cart lines. No `/api/cart` REST route, checkout route/action, payment provider endpoint, auth endpoint, or cinematic `ACQUIRE` transport was introduced.
