# AURA Testing Strategy

## Phase 0 Verified Commands

- TypeScript: direct bundled Node invocation of `node_modules/typescript/bin/tsc --noEmit` — **PASS**.
- Production build: direct bundled Node invocation of `node_modules/next/dist/bin/next build` — **PASS**.
- Build output: `/` static route, 56.1 kB route size, 143 kB first-load JavaScript at the recorded baseline.
- Original lint baseline: **NOT CONFIGURED**. Stage 1.2 adds a repository configuration; lint now exits successfully with five known media/font warnings.
- Automated tests: **NOT AVAILABLE**. `package.json` has no `test` script or test framework.
- Global npm: **ENVIRONMENT ISSUE**. The installed shim points to a missing roaming `npm-cli.js`.
- Dependency audit after Stage 1.2 tooling: **5 HIGH** findings; framework remediation is Stage 1.3.

## Stage 1.3 Framework Upgrade Results

- Dependency tree: Next.js 15.5.21, React/React DOM 19.2.8, PostCSS 8.5.26, Sharp 0.35.3 — **PASS**.
- `npm audit --audit-level=high` — **PASS, 0 vulnerabilities**.
- `npm run lint` — **PASS with 5 known warnings, 0 errors**.
- `npm run typecheck` — **PASS**.
- `npm run build` — **PASS**.
- Headless Chrome smoke test — **PASS**: correct title/heading, visible Explore CTA, six world elements, zero page errors.
- Next.js 15 build baseline: `/` 56.5 kB route size, 159 kB first-load JavaScript.

## Stage 1.4 MongoDB Foundation Results

- `npm run db:check` — **PASS**: secure non-production MongoDB Atlas admin ping; URI and credentials were not emitted.
- `npm run lint` — **PASS with 5 known warnings, 0 errors**.
- `npm run typecheck` — **PASS**.
- `npm run build` — **PASS**.
- `npm audit --audit-level=high` — **PASS, 0 vulnerabilities**.

## Stage 1.5 Product Domain Results

- `npm run db:products:init` — **PASS**: creates or refreshes only an empty product collection's validator/index configuration; it aborts if documents already exist.
- `npm run db:products:check` — **PASS**: strict validator and all required indexes exist; an incomplete document is rejected.
- `npm run db:check` — **PASS**.
- `npm run lint` — **PASS with 5 known warnings, 0 errors**.
- `npm run typecheck` — **PASS**.
- `npm run build` — **PASS**.
- `npm audit --audit-level=high` — **PASS, 0 vulnerabilities**.

## Stage 1.6 Collection Domain Results

- `npm run domain:collections:check` — **PASS**: duplicate memberships/positions and empty public collections are rejected.
- `npm run db:collections:init` and `npm run db:collections:check` — **PASS**: strict validator/indexes exist and incomplete documents are rejected.
- MongoDB ping, TypeScript, lint (five existing warnings only), production build, and high-severity audit — **PASS**.

## Stage Test Layers

- Static: TypeScript and lint.
- Unit: domain policies, value objects, pricing, discounts, status transitions.
- Integration: repositories, database constraints, route handlers, authentication/authorization, webhooks.
- Component: interactive navigation, search, cart, forms, error and empty states.
- End-to-end: discovery → cart → checkout → verified order, account flows, and admin workflows.
- Non-functional: accessibility, responsive layouts, performance, cross-browser, SEO, and security reviews.

## Completion Rule

Tests must be executed and results recorded. If a required external system is unavailable, status is `IMPLEMENTED — NOT YET VERIFIED`, never complete.

## Stage 2.12 Responsive and Accessibility QA

The Storefront QA matrix covers desktop/laptop/tablet/mobile/small-mobile targets at 1440, 1280, 1024, 768, 430, 390, 360, and 320px. It checks horizontal overflow, image/card/PDP gallery resilience, touch-sized controls, short/landscape overlays, breakpoint separation, safe-area and `dvh` behavior, keyboard-only operation, visible focus, heading/label/alt semantics, modal focus trapping, Escape/restore behavior, reduced motion, and readable empty/error/loading states.

- Static contract: `npm run domain:storefront:responsive-a11y:check` — **PASS**.
- The matrix records static/manual code review targets; no browser automation dependency is installed in this repository, so pixel-level browser measurements remain a follow-up verification item rather than being claimed as executed.
- `git diff --check` remains a successful command; Windows line-ending warnings are documented and are not whitespace failures.

## Stage 2.13 Phase 2 Sign-Off

- Storefront contracts passed: navigation, catalog, audience campaigns, collections, Product Detail, search, filters/sorting, New Arrivals, responsive/accessibility, and minor-unit money.
- Production HTTP smoke passed on a temporary local server: `/`, `/fragrances`, Women/Men/Unisex routes, `/collections`, `/search?q=elixir`, filtered catalog, and `/new-arrivals` returned 200; all 30 published PDP slugs returned 200; hidden collection, archived PDP, and invalid PDP returned 404; oversized search API returned 400.
- Foundation/cinematic checks passed after updating the integration assertion to allow the Phase 2 archived-retired-product policy while preserving six valid cinematic mappings and seed/runtime separation.
- Database verification passed: 30 published catalog products, 10 Women / 10 Men / 10 Unisex, zero old dollar-price values in published variants, hidden cinematic collection, and zero currently launched New Arrivals.
- Source scans found no storefront/runtime seed imports, cinematic/GSAP imports, cart provider, fake best-seller/trending/rating signals, or hard-coded storefront prices.
- TypeScript, local ESLint, production build, full `npm audit` with 0 vulnerabilities, and `git diff --check` passed.
- Known non-blocking issues: broken global npm shim, one root-layout font warning, Windows line-ending warnings, and no installed browser automation dependency for pixel-level responsive checks.

## Stage 3.1 Commerce Architecture

- `domain:commerce:architecture:check` verifies documented guest cart identity, ownership, lifecycle, item identity, money authority, inventory boundary, untracked inventory policy, mutation transport, cache/freshness, concurrency, expiry, wishlist, discount, gift-card, cinematic integration, error/security rules, and no accidental implementation.
- Database verification confirms Stage 3.1 did not create `carts`, `wishlists`, `discounts`, or `giftCards` collections.
- Source scans confirm no CartProvider, Add to Bag implementation, cart route, cart schema, localStorage cart authority, Auth.js implementation, checkout/payment work, or cinematic component modification was introduced.
- TypeScript, local ESLint, production build, full npm audit, `git diff --check`, and existing storefront regressions passed.

## Stage 3.2 Cart Data Model

- `domain:cart:check` passed for owner union, lifecycle, embedded canonical lines, duplicate-line rejection, positive integer quantity, version, guest expiration, empty cart support, and rejection of price/product/inventory snapshots.
- `db:carts:init` passed and created/updated the strict `carts` validator and indexes.
- `db:carts:check` passed for validator/index presence plus negative database checks for invalid owners, unsupported status, invalid quantities, missing references, invalid version, unexpected fields, and commercial/product/inventory snapshots.
- Database inspection confirmed `carts` exists with 0 documents after verification cleanup and indexes `_id_`, `carts_active_guest_owner_unique`, `carts_active_user_owner_unique`, `carts_status_expires_at`, and `carts_status_updated_at`.
- `domain:commerce:architecture:check` passed after Stage 3.2, confirming no premature Cart UI/actions/cookies/payments/cinematic commerce work.
- TypeScript, local ESLint, production build, full npm audit, `git diff --check`, and storefront/foundation regressions passed.
## Stage 1.7 Verification

- `domain:fragrance:check` rejects duplicate note/tier links, duplicate positions, invalid tiers, and duplicate families.
- `db:fragrance:init` and `db:fragrance:check` pass against the non-production Atlas database and verify validators/indexes without seed data.
- TypeScript, lint, production build, high-severity audit, and `git diff --check` pass; five existing lint warnings remain.

## Stage 1.8 Verification

- `domain:user:check` validates normalized emails, roles/statuses, international address fields, country codes, and rejects invalid inputs.
- `db:user:init` and `db:user:check` pass and verify strict `users`/`addresses` validators plus normalized-email/default-address indexes.

## Stage 1.9 Verification

- `domain:orders:check` rejects invalid quantities, totals, and order transitions while validating immutable item/address snapshot contracts.
- `db:orders:init` and `db:orders:check` pass for inventory, reservations, and orders validators/indexes.
- `domain:inventory:concurrency` proves one winner for two concurrent last-unit reservations, guarded release idempotency, and duplicate order-number rejection.

## Stage 1.10 Verification

- `domain:shared:check` validates shared primitive normalization/rejection behavior.
- Regression checks for collections, fragrance, users, and orders pass; product database validation remains passing.

## Stage 1.11 Verification

- `domain:errors:check` verifies taxonomy mapping, Mongo duplicate/validation translation, safe serialization, cause retention without leakage, and deterministic output.
- MongoDB connectivity, lint, TypeScript, production build, high-severity audit, and `git diff --check` pass.

## Stage 1.12 Verification

- `db:cinematic:seed` passed twice without duplicate products, collections, notes, families, or relationships.
- `db:cinematic:check` confirms six unique mappings, unique SKUs, valid collection membership, and no orphan product/note/family references.
- Existing cinematic components remain unchanged; full runtime integration is deferred to Phase 8.

## Stage 1.13 Foundation Integration Verification

- `domain:foundation:integration` passed product contract checks, six-world collection mappings, taxonomy references, seed/runtime separation, SKU uniqueness, and product/address snapshot immutability.
- Seed rerun, concurrency, shared-validation, error-architecture, all Phase 1 database validator/index checks, and MongoDB connectivity passed.
- TypeScript, lint, production build, high-severity audit, and `git diff --check` passed. Existing five lint warnings remain; no new cinematic runtime integration was introduced.

## Stage 1.14 Phase 1 Final Sign-Off

- Final domain/integration suites, MongoDB connectivity and validator/index checks, TypeScript, lint, production build, high-severity security audit, and `git diff --check` passed.
- Worktree review found no tracked `.env`/secret files, pnpm lockfile, test artifacts, or runtime seed imports. Existing prior cinematic-file modifications remain part of the established worktree baseline; no protected cinematic file was modified during Stage 1.14.
- Final product, collection, taxonomy, user/address, order/inventory, snapshot, error-boundary, and six-world mapping acceptance criteria passed. Phase 1 is **APPROVED / COMPLETE**.
- Non-blocking: global npm shim failure, five existing lint warnings, and the documented Next.js 15 shared-bundle increase. Deferred: storefront, cart, checkout, payments, authentication, admin, shipping/tax, and cinematic Phase 8 integration.

## Stage 2.1 Storefront Shell Verification

- The `(storefront)` layout and shell compile as server components and do not import cinematic components, GSAP, video logic, or product seed data.
- Semantic `header`/`main`/`footer` landmarks, skip-to-content focus behavior, responsive shell rules, Maison visual tokens, and reduced-motion compatibility are present.
- TypeScript, lint, production build, security audit, and `git diff --check` pass. No public catalog or commerce route was introduced.
- Production smoke request to `/` returned HTTP 200 and retained the AURA, Explore, and six-world markers; the existing cinematic route remains isolated from the storefront shell.

## Stage 2.2 Global Navigation Verification

- Central navigation configuration contains one live `/` destination and planned entries for routes not yet implemented; no fake 404 links are emitted.
- Header navigation and Search/Account/Bag boundaries remain server-rendered and do not add global client state, Mega Menu behavior, mobile drawer behavior, search overlay behavior, authentication, or cart behavior.
- TypeScript, lint, production build, high-severity audit, and `git diff --check` pass. Cinematic runtime imports remain absent from storefront files.
- `domain:storefront:navigation:check` passes centralized destination, keyboard interaction, canonical collection, and mobile isolation assertions.

## Stage 2.4 Mobile Navigation Verification

- Mobile drawer uses the shared navigation configuration and serializable canonical collection summaries; no MongoDB driver enters the client component.
- Focus trap, Escape/close/backdrop handling, trigger focus restoration, body scroll-lock cleanup, resize separation, safe-area padding, and small-screen overflow behavior are implemented and covered by navigation assertions.
- TypeScript, lint, production build, high-severity audit, and `git diff --check` pass. Stage 2.5 catalog routes and commerce features remain deferred.
## Stage 2.5 — Fragrance Catalog

- `domain:storefront:catalog:check` passes for the server-only published Product query, canonical media and pricing policy, safe states, live navigation, and prohibited cinematic/commerce dependencies.
- HTTP smoke test: `/fragrances` returned 200 and rendered the six canonical seeded products (`Élixir de Rose`, `Noir Cashmere`, `Citrus Vetiver`, `Amber Mystique`, `Jasmine Nocturne`, `Golden Santal`) without MongoDB diagnostics.
- TypeScript, lint, production build, `npm audit --audit-level=high`, and `git diff --check` pass. Existing five lint warnings remain documented non-blocking baseline warnings.
- No mock catalog array, seed/runtime manifest, Product detail link, cart, search, filter, GSAP, or cinematic import was introduced.

## Stage 2.6 — Audience Campaign Pages

- `domain:storefront:campaigns:check` passes for the three audience routes, explicit Product audience filter, safe states, live navigation, and cinematic/commerce isolation.
- HTTP smoke test returned 200 for `/`, `/fragrances`, `/fragrances/women`, `/fragrances/men`, and `/fragrances/unisex`.
- `db:catalog:migrate` passed with exactly 30 published products and 10/10/10 audience counts; overlapping products were updated and three retired products archived without deletion. No audience was inferred from names or imagery.
- TypeScript, lint, production build, full `npm audit` (0 vulnerabilities), and `git diff --check` pass.

## Stage 2.7 — Collection Landing Pages

- `domain:storefront:collections:check` passes for public visibility guards, ordered membership, canonical Product resolution, live navigation, and cinematic/commerce isolation.
- HTTP smoke test: `/collections` returned 200; hidden `/collections/cinematic-worlds` returned 404; `/`, `/fragrances`, and all three audience routes returned 200.
- No public collection was invented without owner-approved membership. The index uses an intentional empty state until a published/public collection exists.
- TypeScript, lint, production build, full `npm audit` (0 vulnerabilities), and `git diff --check` pass.

## Stage 2.8 — Product Detail Page

- `domain:storefront:product-detail:check` passes for published-only access, canonical media/taxonomy/variant/inventory reads, accessible gallery/selector controls, card navigation, and runtime isolation.
- HTTP smoke test: published PDPs returned 200; archived `noir-cashmere` and an invalid slug returned 404. Regression routes `/`, `/fragrances`, audience pages, and `/collections` remained available.
- Variant data is canonical: Velvet Rose, Élixir de Rose, and Oud Majesté expose their explicit 50/75/100 ml prices; other products expose no invented sizes.
- TypeScript, lint, production build, full `npm audit` (0 vulnerabilities), and `git diff --check` pass.

## Stage 3.3 — Guest & Account Cart Persistence

- `domain:cart:persistence:check` covers:
  - read-without-cookie does not create a cart document;
  - malformed guest cookie reads as empty;
  - first valid guest mutation creates an ACTIVE cart and returns an `aura_guest_cart` cookie descriptor;
  - raw token is not stored in MongoDB, only SHA-256 `guestTokenHash`;
  - subsequent reads with the same token resolve persisted MongoDB state;
  - ProductVariant price changes are reflected on the next cart read;
  - cart adds do not reserve inventory;
  - concurrent duplicate adds produce one embedded line with incremented quantity;
  - stale same-version updates produce exactly one success and one `CONFLICT`;
  - quantity `0`, remove, and clear semantics persist correctly;
  - expired carts are marked `EXPIRED` and next mutation rotates ownership;
  - `UNTRACKED` inventory remains distinct and not checkout-eligible;
  - trusted USER carts persist and remain isolated from other USER contexts.
- `domain:commerce:architecture:check` now permits the Stage 3.3 server persistence layer while continuing to block premature Cart UI, checkout, wishlist, Auth.js, payments, local storage, and cinematic commerce integration.

## Stage 3.4 — Cart Drawer

- `domain:cart:drawer:check` covers:
  - Header Bag uses an isolated `StorefrontCartAction` client boundary;
  - StorefrontHeaderShell does not call `cookies()` or cart service reads directly;
  - button/dialog semantics, `aria-expanded`, `aria-controls`, semantic backdrop, Escape/focus-trap/restoration hooks, and body scroll lock/restoration are present;
  - drawer states include loading, empty, error, and content;
  - drawer rendering uses the safe Stage 3.3 cart view model and central minor-unit money formatter;
  - `UNTRACKED` renders as neutral availability, not “In Stock”;
  - Remove/Clear use Server Actions backed by Stage 3.3 service;
  - conflict responses refresh the cart presentation;
  - no localStorage/sessionStorage, checkout, PDP Add to Bag, inventory reservation, payment, wishlist, or cinematic integration exists; at Stage 3.4 time the full `/cart` page was still deferred and was later introduced by Stage 3.5;
  - `scripts/server-only-loader.mjs` remains test-only and is not imported from `src/**`.
- Production build confirms `/` remains static; cart freshness is scoped to the isolated action boundary rather than globalizing storefront caching.

## Stage 3.5 — Full Cart Page

- `domain:cart:page:check` covers:
  - `/cart` route exists, is dynamic, and has noindex/nofollow metadata;
  - route uses `CartService` and server cookie context, not direct MongoDB/repository access in React;
  - page client renders h1, live status messaging, empty/error/content states, canonical product links, quantities, availability, server subtotal, and central money formatting;
  - Remove/Clear reuse cart Server Actions and publish returned safe cart view for Header/Drawer/Page synchronization;
  - conflict handling triggers a refresh;
  - no checkout, `/checkout`, quantity controls, Add to Bag, inventory reservation, localStorage/sessionStorage, Auth.js/payment/cinematic work, or production `server-only-loader` import exists.
- HTTP smoke with `next start` returned 200 for `/cart` without a cookie and 200 for `/`.
- DB sanity after the no-cookie `/cart` visit reported `carts: 0`.
- Production build reports `/cart` as dynamic and `/` as static.

## Stage 3.6 — Quantity & Inventory Validation

- `domain:cart:inventory:check` passed with controlled temporary Product/Inventory/Cart fixtures and cleaned them afterward.
- Coverage includes AVAILABLE Add to Bag, first guest-cart creation, failed-add no-orphan behavior, OUT_OF_STOCK and UNTRACKED rejection, inactive/archived/wrong-variant rejection, quantity increase exactly to availability, rejection above availability, decrement, quantity-to-zero remove, negative/decimal quantity rejection, stale-version/concurrency protection, same-cart near-limit no-overshoot, different-cart non-reservation behavior, stock-drop stale-line presentation, checkout eligibility, current-price authority, no raw stock counters, and unchanged inventory counters.

## Stage 3.11 — Commerce Integration Tests

- `domain:commerce:integration:check` passed while retaining individual stage checks and their output.
- Atlas initializers and validator/index checks passed for carts, wishlists, discounts, and gift cards.
- Cart lifecycle, current-price authority, inventory/quantity, concurrency, ownership, no-reservation, and synchronization checks passed.
- Wishlist independence/concurrency/price freshness, Discount evaluation/separation, Gift Card idempotency/atomicity/concurrency, and cinematic six-world/ACQUIRE checks passed.
- Temporary fixtures were cleaned; real catalog state remains `60` sellable variants, `0` TRACKED, `60` UNTRACKED, `0` OUT_OF_STOCK.
- No browser automation evidence is claimed. The known unrelated repo-wide `git diff --check` baseline remains separate; Stage 3.11 scoped verification passes.

### Stage 3.12 — Phase 3 Sign-Off

- Fail-before evidence: fresh builds with either `src/app/loading.tsx` or `src/app/(storefront)/loading.tsx` returned HTTP 200 for archived `/product/noir-cashmere`, unknown `/product/not-a-real-product`, and hidden `/collections/cinematic-worlds`.
- Root cause: either ancestor loading boundary could flush the streaming response before the Product/Collection route could call `notFound()`; content appearance was not used as the authority.
- Minimal fix: removed the root and storefront loading boundaries; retained the separate cinematic loading boundary. No Product/Collection business data or visibility rule changed.
- Fresh final matrix: `/`, published `/product/elixir-de-rose`, `/cart`, and `/wishlist` returned 200; archived/unknown Product and hidden Collection routes returned actual 404. `STOREFRONT_HTTP_STATUS_CHECK: PASS`.
- `COMMERCE_INTEGRATION_SUITE: PASS`, Storefront collection/catalog/campaign/search/filter/new-arrivals/price checks pass, TypeScript passes, full ESLint passes, production build passes, and `npm audit --audit-level=low` reports `found 0 vulnerabilities`.
- No published/public collection exists in the current Atlas database. No browser automation evidence is claimed.
- Real catalog inventory coverage reported by the check: total sellable variants `60`; TRACKED `0`; UNTRACKED `60`; OUT_OF_STOCK `0`.
- `domain:cart:persistence:check` passed under the stricter UNTRACKED purchase policy.
- `domain:cart:drawer:check`, `domain:cart:page:check`, `domain:commerce:architecture:check`, and `domain:storefront:product-detail:check` passed after updating the Stage 3.6 boundaries.
- TypeScript passed; full ESLint passed with 0 errors and 0 warnings after the next/font/google migration.

## Stage 4.1 — Authentication Architecture

- `domain:auth:architecture:check` verifies the documented Auth.js/AURA boundary, accepted Credentials + JWT/sessionVersion contract, canonical User schema, planned auth persistence separation, absence of Auth.js packages/runtime, protected-layout boundary, and preservation of the Phase 3 root/storefront loading fix.
- Published metadata/source inspection and the disposable reproduction **pass the accepted Credentials + JWT combination**; the rejected Credentials-only + database-session combination returns `UnsupportedStrategy`. Stage 4.1 is COMPLETE; no Auth.js runtime behavior is claimed because the package is not installed in AURA.
- Stage 4.1 is architecture-only: no registration, login, logout, password hashing, recovery, email delivery, Auth.js handler, account UI, auth collection, fixture, or successful-authentication behavior is claimed.
- Existing User/Address, Cart/Wishlist/commerce, storefront HTTP, foundation, TypeScript, full ESLint, production build, npm audit, and worktree/security checks remain the regression gates.
- The current worktree is intentionally broad and contains pre-existing baseline changes; documentation and the new static auth check are scoped additions, and unrelated whitespace findings remain untouched.
## Stage 4.2 P1 — Auth Persistence Foundations

Verified against the accepted non-production Atlas database using the safe `.env.local` loading path (the URI was not printed):

- `domain:auth:check` — PASS: Argon2id runtime/hash policy, strict schemas, session version `0`, random hash-only email-verification token, and purpose separation.
- `db:auth:init` — PASS: idempotent strict validators and required indexes for `authCredentials` and `authTokens`.
- `db:auth:check` — PASS: actual Atlas validators, Argon2id contract, purpose separation, and indexes.
- `domain:auth:persistence:check` — PASS: actual Atlas persistence, strict rejection, raw-secret exclusion, purpose binding, atomic single-use/expiry behavior, and fixture cleanup.
- TypeScript — PASS.
- Full ESLint — PASS, zero errors and zero warnings.
- Production build — PASS.
- Direct local npm audit — PASS, `found 0 vulnerabilities`.

P1 deliberately did not test or implement registration, email delivery, Auth.js, JWT/session, login, password recovery, account UI, or Cart/Wishlist merge.

## Stage 4.2 P2 — Registration Flow

Verified against the accepted non-production Atlas database using the safe `.env.local` loading path (the URI was not printed):

- `domain:auth:registration:check` — PASS: strict registration validation, canonical email normalization, server-assigned `CUSTOMER`/`PENDING`, atomic User/credential/`EMAIL_VERIFICATION` persistence and rollback, race-safe duplicate handling, resend rotation, post-commit delivery failure retention, secret boundaries, and fixture cleanup.
- TypeScript — PASS.
- Full ESLint — PASS, 0 errors and 0 warnings.
- Production build — PASS.
- Direct local npm audit — PASS, `found 0 vulnerabilities`.
- The verification sender is intentionally fake/in-memory for P2. Email verification activation belongs to P3; no Auth.js, JWT/session, login, recovery, Cart/Wishlist merge, or `PASSWORD_RESET` records were introduced.

At the P2 checkpoint, P3 Email Verification Experience was NOT STARTED and required owner approval.

## Stage 4.2 P3 — Email Verification Experience

- P3.1 Atlas verification service — PASS: hash-only server tokens, purpose/expiry enforcement, single-use replay protection, pending-only activation, disabled protection, atomic activation, and concurrent one-winner behavior.
- P3.2 transport — PASS: GET inspection is non-mutating and returns only safe state; POST accepts only the opaque token and delegates to P3.1. Privacy headers and browser-authority rejection are covered.
- P3.3 UI — PASS: explicit Verify Email action, accessible pending/status states, safe terminal states, explicit resend, URL cleanup after success, no client persistence, and responsive/reduced-motion contract.
- P3.1/P3.2/P3.3 Atlas runtime checks, registration regression, TypeScript, scoped/full ESLint, clean-server HTTP status matrix, and scoped whitespace checks passed.

## Stage 4.2 P3.4 — Final Integration Audit

- Auth architecture reconciliation — PASS: legitimate Stage 4.2 `/api/auth` transport is recognized; Auth.js/JWT/session runtime and Login/Account surfaces remain forbidden.
- `npm audit --audit-level=low` via the direct npm CLI — PASS, 0 vulnerabilities.
- Full ESLint — PASS, 0 errors and 0 warnings.
- Repo-wide `git diff --check` — NON-ZERO only for documented unrelated baseline whitespace in `src/app/layout.tsx` and `src/components/HeroPortalExperience.tsx`; those files were preserved. P3.4 scoped whitespace check passes.
- Production build — PASS: `next build` compiled successfully, completed type/lint checks, and generated the full route output including `/verify-email`.
- Commerce integration rerun — PASS: the prior failure was traced to a residue fixture from an interrupted run; the exact test Gift Card fixture was removed and the isolated integration check then passed with cleanup.
- Stage 4.2 — COMPLETE. Stage 4.3 — Login, Logout & Sessions: READY — NOT STARTED.

## Stage 4.3 P1 — Dependency & Runtime Gate

- Runtime evidence: Node `v24.19.0`, Next `15.5.25`, React/React DOM `19.2.8`, TypeScript `5.9.3`.
- Published metadata: `next-auth@latest` is `4.24.15`; the official Auth.js Next.js installation path uses `next-auth@beta`, currently `5.0.0-beta.32`. The selected package accepts AURA's Next 15 and React 19 peer versions.
- Installed tree: `next-auth@5.0.0-beta.32` with `@auth/core@0.41.3`; no `@auth/mongodb-adapter`.
- `domain:auth:architecture:check` — PASS: the dependency is pinned and no Auth.js config, Credentials provider, route handler, callbacks, JWT/session runtime, login/logout, UI, or account route was implemented in P1.
- TypeScript — PASS.
- Direct npm audit after installation — PASS, `found 0 vulnerabilities`.
- Scoped dependency diff check — PASS. Repo-wide diff check remains NON-ZERO only for the documented unrelated baseline whitespace findings.

## Stage 4.3 P2 — Credentials Login & Server Session Authority

- `domain:auth:login:check` — PASS against the accepted non-production Atlas database. The check covered canonical email/password login, Argon2id verification, rejection of wrong-password/PENDING/DISABLED/missing-credential/invalid-input cases, opaque JWT claims, `sessionVersion` revocation after increment, disabled-user rejection, and fixture cleanup.
- Auth.js runtime transport — PASS: Next `/api/auth/providers` and `/api/auth/session` returned HTTP 200 with the process-only test secret; no secret value was printed or persisted.
- `domain:auth:architecture:check` — PASS after allowing only the intended Stage 4.3 Auth.js transport and server-auth boundaries; unrelated app/component/domain surfaces remain prohibited.
- TypeScript — PASS.
- Full ESLint — PASS, 0 errors / 0 warnings.
- Direct local npm audit — PASS, `found 0 vulnerabilities`.
- Stage 4.3 P2 scoped `git diff --check` — PASS; no whitespace errors in the P2-touched files. Repo-wide diff check remains NON-ZERO only for the documented unrelated baseline whitespace in `src/app/layout.tsx` and `src/components/HeroPortalExperience.tsx`.
- Production build — FAIL on the pre-existing `PageNotFoundError: Cannot find module for page: /_not-found/page`. The failure is retained as later Stage 4.3 regression/final-audit debt; the Auth.js route itself compiled and returned HTTP 200 in Next dev.

P2 is complete within scope. The earlier P2 build attempt was invalidated by concurrent dev/build `.next` artifact contention; the isolated final Stage 4.3 P3 production build passed. P3 Login/Session UX & Logout is READY — NOT STARTED and requires owner approval.

## Stage 4.3 P3 — Logout, Helpers & Login UI

- `domain:auth:p3:check` — PASS: Maison `/login`, accessible credential fields, server-action login, real server-action logout, current-session helpers, and the Maison Account link are present; Account/Profile and registration surfaces remain outside P3.
- `domain:auth:runtime:check` — PASS against the accepted non-production Atlas database and a temporary Next runtime. Real Auth.js Credentials callback login issued a session cookie, the Auth.js session endpoint returned the Atlas fixture identity, and real Auth.js signout cleared the session. No token, password, secret, or URI value was printed; the fixture was cleaned up.
- Final dev runtime — PASS: `/login` and `/api/auth/providers` returned HTTP 200.
- TypeScript — PASS.
- Full ESLint — PASS, 0 errors / 0 warnings.
- Production build — PASS: Next generated `/login` and `/api/auth/[...nextauth]` successfully.
- Direct local npm audit — PASS, `found 0 vulnerabilities`.
- Repo-wide `git diff --check` — NON-ZERO only for documented unrelated baseline whitespace in `src/app/layout.tsx` and `src/components/HeroPortalExperience.tsx`; P3-scoped whitespace check passes and those files remain untouched.

## Stage 4.3 P4 — Regression, Documentation & Final Audit

- `db:auth:init` / `db:auth:check` — PASS against the accepted non-production Atlas database: strict `authCredentials`/`authTokens` validators, Argon2id pattern, purpose separation, and expected indexes.
- Auth Atlas regressions — PASS: `domain:auth:persistence:check`, `domain:auth:registration:check`, `domain:auth:login:check`, `domain:auth:verification:check`, transport/UI contract checks, and runtime verification. These covered canonical User role/status authority, PENDING/DISABLED rejection, opaque JWT claims, `sessionVersion` revocation, logout, atomic registration/verification, replay/expiry/concurrency, resend, secret boundaries, and fixture cleanup.
- HTTP regressions — PASS: clean local server returned 200 for valid storefront/auth routes and 404 for archived/unknown/hidden resources. The Next development MCP endpoint was unavailable (HTTP 404), so runtime evidence used the documented HTTP smoke fallback.
- Phase 2–3 and commerce regressions — PASS: storefront catalog/search/filter/navigation/responsive checks, Cart/Wishlist/Discount/Gift Card/Cinematic checks, commerce integration suite, and architecture boundaries.
- TypeScript — PASS (`tsc --noEmit`).
- Full ESLint — PASS, 0 errors / 0 warnings.
- Production build — PASS: isolated `next build` completed successfully and generated `/api/auth/[...nextauth]`, `/login`, `/verify-email`, and all expected storefront routes.
- Direct local npm audit — PASS, `found 0 vulnerabilities`; the global npm shim was unavailable and was not used.
- `STAGE43_SCOPED_DIFF_CHECK` — PASS: zero trailing-whitespace errors in Stage 4.3 source/scripts; Markdown hard-break spaces in documentation were preserved as intentional formatting.
- Repo-wide `git diff --check` — NON-ZERO only for the documented unrelated baseline whitespace in `src/app/layout.tsx` and `src/components/HeroPortalExperience.tsx`; the broad dirty worktree was preserved intentionally.

Stage 4.3 — Login, Logout & Sessions: COMPLETE ✅. Stage 4.4 — Password Recovery: READY — NOT STARTED. No later-stage feature work was started.

## Stage 4.4 — Password Recovery

- `db:auth:init` / `db:auth:check` — PASS against the accepted non-production Atlas database: strict validators, `PASSWORD_RESET` purpose separation, and expected indexes.
- `domain:auth:password-recovery:check` — PASS: real Atlas non-enumerating request behavior, ACTIVE/verified eligibility, hash-only reset persistence, token rotation, expiry/replay/DISABLED protection, Argon2id password replacement, `sessionVersion` revocation, transaction rollback, concurrency one-winner behavior, and cleanup.
- `domain:auth:password-recovery:ui:check` — PASS: explicit request/reset POST boundaries, non-mutating token inspection, generic request copy, READY-state mutation guard, URL cleanup, and no browser storage for raw tokens.
- `domain:auth:password-recovery:runtime:check` — PASS on a real Next dev runtime: GET left the Atlas token and User unchanged, POST reset the fixture, replay returned `USED`, and unknown requests returned the same accepted response without creating a token.
- Stage 4.2–4.3 Auth regressions — PASS: registration, verification, login, JWT/session authority, logout, transport, UI, and cleanup checks.
- TypeScript — PASS (`tsc --noEmit`). Full ESLint — PASS, 0 errors / 0 warnings. Production build — PASS with a process-only temporary `AUTH_SECRET` (the ignored `.env.local` does not provide one). Direct local npm audit — PASS, `found 0 vulnerabilities`.
- Repo-wide `git diff --check` remains NON-ZERO only for the documented unrelated baseline whitespace in `src/app/layout.tsx` and `src/components/HeroPortalExperience.tsx`; the Stage 4.4 scoped source/script check is clean and no unrelated files were modified.

At the Stage 4.4 closeout, Password Recovery was COMPLETE ✅ and Stage 4.5 — Account Overview & Profile was READY — NOT STARTED. No Account/Profile or Cart/Wishlist merge behavior had been started at that checkpoint.

## Stage 4.5 P1/P2 — Protected Account Overview & Profile

- `domain:auth:account-profile:check` — PASS against Atlas: canonical safe reads, strict `firstName`/`lastName`/`phone` profile allowlist, protected-field and cross-user rejection, ACTIVE/verified authority, `sessionVersion` revocation, and fixture cleanup.
- `domain:auth:account-profile:ui:check` — PASS: protected `/account`, P1-backed server action, safe same-origin login return, accessible profile form, and preserved global auth/404 boundaries.
- Real runtime — PASS: authenticated Account Overview renders canonical data; the profile update persists in Atlas and is rendered after reload. Missing authority, stale `sessionVersion`, and a user disabled after login redirect to safe login without rendering private account data. The fixture was removed.
- Regressions — PASS: real Auth.js Credentials login/session/logout, Password Recovery runtime, and storefront HTTP status matrix (valid storefront/PDP routes 200; invalid PDP and hidden collection 404).
- TypeScript — PASS. P2-scoped ESLint — PASS. Direct local npm audit — PASS. `STAGE45_P1_SCOPED_DIFF_CHECK` and `STAGE45_P2_SCOPED_DIFF_CHECK` — PASS.

P1/P2 are COMPLETE. P3 Final Audit & Documentation is IN PROGRESS under owner approval; Stage 4.6 was not started.

## Stage 4.6 P1 — Server Address Boundaries & Authorization

- `ADDRESS_MANAGEMENT_BOUNDARY_CHECK` — PASS: server-only list/create/update/delete boundary, canonical Auth.js/session authority, strict client input boundary, ownership-scoped repository access, and no UI/P2 surface.
- `ADDRESS_MANAGEMENT_CHECK` — PASS against Atlas: real persistence, own-address list/create/update/delete, browser-controlled `userId`/`ownerId` rejection, cross-user protection, ACTIVE/verified authority, PENDING/DISABLED rejection, stale `sessionVersion` rejection, and existing default shipping/billing semantics.
- Runtime smoke — PASS on an isolated development server: `/`, `/reviews`, `/fragrances/women`, `/fragrances/men`, `/new-arrivals`, and `/cart` returned HTTP 200.
- TypeScript — PASS. Scoped ESLint — PASS. Scoped `git diff --check` — PASS.

P1 is COMPLETE ✅. P2 — Address Management UI & Account Integration is COMPLETE ✅. P3 — Final Audit & Documentation is READY — NOT STARTED and remains owner-gated.

## Stage 4.6 P2 — Address Management UI & Account Integration

- `ACCOUNT_ADDRESSES_UI_CHECK` — PASS: `/account` address list/create/edit/delete UI, P1 action boundary, default semantics, accessibility labels, and no ownership fields or out-of-scope surfaces.
- Runtime — PASS: protected `/account` redirects unauthenticated users safely to login; public shell, `/reviews`, and `/cart` remain healthy.
- TypeScript — PASS. Scoped ESLint — PASS. Production build — PASS. `npm audit --audit-level=low` — 0 vulnerabilities.

P2 implementation is COMPLETE in code, but final runtime evidence is still pending; P3 has not started.

## Stage 4.6 P3 — Final Audit & Documentation

- Address CRUD/ownership/sessionVersion/DISABLED/default shipping and billing semantics — PASS against Atlas; all fixtures cleaned up.
- Auth/Account/Profile regressions — PASS. HTTP matrix — PASS, including `/wishlist → 404` and valid storefront/PDP statuses.
- Commerce/Foundation/Cinematic regressions — PASS. Navigation, search, product-detail, responsive/accessibility contracts — PASS.
- TypeScript — PASS. Full ESLint — 0 errors / 0 warnings. Production build — PASS. `npm audit --audit-level=low` — 0 vulnerabilities.
- `STAGE46_P3_SCOPED_DIFF_CHECK` — PASS. Documentation reconciliation — PASS.

Stage 4.6 P3 is COMPLETE ✅. Stage 4.7 — Order History is IN PROGRESS.

## Stage 4.7 P1 — Server Order History Boundaries & Authorization

- `ORDER_HISTORY_BOUNDARY_STATIC_CHECK` — PASS: server-only read boundary, ownership-scoped repository queries, safe historical view model, and no customer mutation surface.
- `ORDER_HISTORY_BOUNDARY_CHECK` — PASS against Atlas: own list/detail, cross-user rejection, browser authority-field rejection, immutable snapshot/totals presentation, ACTIVE/verified authority, disabled-after-login rejection, stale `sessionVersion` rejection, and cleanup.
- Order domain regression — PASS: immutable snapshots, totals, inventory quantities, and transition rules remain enforced.
- Runtime smoke — PASS: `/` 200, protected `/account` redirects to login, `/reviews` 200, `/cart` 200, and intentional `/wishlist` 404.
- TypeScript — PASS. P1-scoped ESLint — PASS. P1-scoped diff/whitespace — PASS.

P1 is COMPLETE ✅. P2 — Order History UI & Account Integration is COMPLETE ✅. P3 — Final Audit & Documentation is READY — NOT STARTED.

## Stage 4.7 P2 — Order History UI & Account Integration

- `ORDER_HISTORY_UI_STATIC_CHECK` — PASS: Account integration uses the P1 server boundary, renders safe historical order data, and preserves read-only semantics with empty/loading states.
- `ORDER_HISTORY_UI_RUNTIME_CHECK` — PASS: authenticated Next `/account` rendered an Atlas-backed owned order number, immutable historical item snapshot, historical total, and read-only detail from the P1 view model; fixture cleanup completed.
- P1 order-history boundary regression — PASS: ownership, cross-user protection, authority/sessionVersion, status presentation, snapshots, totals, and cleanup remain green.
- TypeScript — PASS. P2-scoped ESLint — PASS. Production build — PASS. `STAGE47_P2_SCOPED_DIFF_CHECK` — PASS.
- The Account surface uses the existing `orderNumber` only; no Mongo `_id` URL or new public identifier was added. No pagination, sorting, Reorder, checkout, Cart/Wishlist merge, or Stage 4.8 behavior was introduced.

P2 is COMPLETE ✅. P3 — Final Audit & Documentation is COMPLETE ✅.

## Stage 4.7 P3 — Final Audit & Documentation

- Order History boundary/UI/runtime — PASS: Atlas-backed end-to-end Auth.js flow, ownership-scoped list/detail, cross-user rejection, sessionVersion revocation, DISABLED rejection, immutable item/address snapshots, historical totals, status/payment/fulfillment presentation, read-only controls, and fixture cleanup.
- Auth/Account/Profile/Address/Recovery/Verification regressions — PASS.
- HTTP matrix — PASS: public routes and published PDP 200; protected `/account` behavior; archived/unknown PDP and hidden cinematic collection 404; `/wishlist` intentional 404.
- Commerce/Foundation/Cinematic/Search/Navigation/Product Detail/responsive-accessibility regressions — PASS.
- TypeScript — PASS. Full ESLint — 0 errors / 0 warnings. Production build — PASS. `npm audit --audit-level=low` — found 0 vulnerabilities.
- `STAGE47_P1_SCOPED_DIFF_CHECK` — PASS. `STAGE47_P2_SCOPED_DIFF_CHECK` — PASS. `STAGE47_P3_SCOPED_DIFF_CHECK` — PASS. Current repo-wide `git diff --check` — PASS; unrelated worktree changes remain preserved.
- Documentation reconciliation — PASS across `PROJECT-STATUS.md`, `MASTER-PLAN.md`, `PHASE-04-AUTH-ACCOUNT.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SECURITY.md`, `TESTING.md`, and `CHANGELOG.md`.
- Confirmed exclusions: no Reorder, customer Order mutation, checkout redesign, Cart/Wishlist merge, Admin Order Management, or Stage 4.8 implementation.

Stage 4.7 is COMPLETE ✅. Stage 4.8 — Wishlist & Cart Merge Integration is IN PROGRESS.

## Stage 4.8 P0 — Goal Contract

- `docs/decisions/STAGE-4.8-GOAL-CONTRACT.md` records the P0 contract based on ADR-023 through ADR-027 and the current Cart/Wishlist/Auth services.
- Preserved: separate opaque guest identities, canonical Auth.js/sessionVersion User authority, server-side ownership, current inventory rules, deterministic Cart/Wishlist merge direction, idempotency/concurrency requirements, failure retention, and post-success guest retirement.
- Owner Decisions are COMPLETE ✅: one post-login server merge step, atomic Cart failure for invalid availability/unavailable lines, independent Cart/Wishlist cleanup, per-domain cookie clearing only after success, and no new idempotency marker initially.
- No merge implementation, login hook, cookie cleanup, checkout redesign, Order mutation, or Stage 4.9 work was started.

P0 is COMPLETE ✅. Phase Ledger is COMPLETE ✅. P1 — Merge Services, Transactions & Authorization is READY — NOT STARTED.

## Stage 4.8 — Phase Ledger

- `docs/decisions/STAGE-4.8-PHASE-LEDGER.md` created from the approved P0 contract and five owner decisions.
- P1 owns merge services, transactions, authorization, atomic Cart failure, Wishlist deduplication, concurrency, and Atlas proof.
- P2 owns one post-login server integration step and independent per-domain guest lifecycle/cookie cleanup.
- P3 owns final audit, quality gates, scoped diff, cleanup, and documentation reconciliation.
- No implementation, Phase 4.9 work, checkout redesign, Order mutation, or global auth/layout read was started.

Phase Ledger is COMPLETE ✅. P1 is READY — NOT STARTED and requires owner approval.

## Stage 4.8 P1 — Merge Services, Transactions & Authorization

- `stage48:p1:static:check` — PASS: the server-only merge boundary uses canonical Auth.js/sessionVersion/User authority, existing guest token hashing, ownership-scoped Cart/Wishlist records, atomic transactions, and no login callback, cookie-clearing, UI, checkout, or Stage 4.9 integration.
- `stage48:p1:merge:check` — PASS against Atlas: Cart quantity combination and availability rejection, atomic invalid-cart preservation, guest Cart retirement, Wishlist Product deduplication, independent guest consumption, concurrent duplicate merge safety, and stale-session rejection.
- TypeScript and P1-scoped ESLint — PASS.
- `STAGE48_P1_SCOPED_DIFF_CHECK` — PASS.

P1 is COMPLETE ✅. P2 — Login Integration & Guest-State Lifecycle is COMPLETE ✅. P3 — Final Audit & Documentation is IN PROGRESS.

## Stage 4.8 P2 — Login Integration & Guest-State Lifecycle

- `stage48:p2:static:check` — PASS: Credentials login uses one server-side post-login orchestration step, preserves safe callback redirects, keeps merge failures separate from authentication failure, and does not place merge work in Auth.js callbacks, middleware, layouts, or recurring session reads.
- Browser runtime verification — PASS: real local Credentials login established the protected `/account` session after guest Wishlist activity; the guest token remained inaccessible to browser JavaScript (`document.cookie` exposed no guest token).
- `stage48:p2:runtime:check` — PASS: orchestration-level proof covers Cart FAIL/Wishlist SUCCESS, Cart SUCCESS/Wishlist FAIL, no guest state, USER-only state, no repeated invocation after cookie retirement, per-domain `Set-Cookie` decisions, stale authority, and DISABLED/invalid authority retention. This does not replace the required full Auth.js HTTP matrix.
- `stage48:p2:authjs-http:check` — PARTIAL PASS after the approved handoff correction: real HTTP Credentials login returns `303`, the internal `/auth/post-login` request carries the newly established session, and Cart-fail/Wishlist-success plus Cart-success/Wishlist-success cookie/Atlas lifecycle cases pass with redacted headers. The required inverse Wishlist-failure fixture and explicit repeated-login/no-repeat invocation instrumentation remain pending; raw token values were not logged.
- Cart and Wishlist cookie lifecycle is independent: each matching cookie is expired only after that domain reports `MERGED`; failures retain the guest cookie.
- TypeScript, full ESLint, production build, and `npm audit` — PASS. `STAGE48_P2_SCOPED_DIFF_CHECK` — PASS.

P2 corrective handoff and final runtime evidence are COMPLETE: the full Auth.js HTTP matrix, actual per-domain `Set-Cookie` capture for both failure permutations, repeated-login/session-read proof, stale sessionVersion, DISABLED authority, Stage 4.3–4.7 regressions, cleanup, and quality gates passed. P3 Final Audit & Documentation is IN PROGRESS and owns the final reconciliation and gate rerun.

## Stage 4.8 P3 — Final Audit & Documentation

P3 is COMPLETE ✅. The audit reran the approved P1/P2 boundaries and the cross-stage regression, quality, cleanup, scoped-diff, and documentation gates. It added no merge behavior and did not begin Stage 4.9.

Evidence: real Auth.js login/merge lifecycle, independent Cart/Wishlist failure retention and cookie cleanup, no recurring merge on session/account/cart reads, repeated-login idempotency, stale `sessionVersion` and `DISABLED` rejection, cross-user protection, Stage 4.3–4.7 regressions, Atlas fixture cleanup, TypeScript, full ESLint (0 errors / 0 warnings), production build, `npm audit` (0 vulnerabilities), `STAGE48_P3_SCOPED_DIFF_CHECK`, and current-status reconciliation — all PASS.

Final state: Stage 4.8 — Wishlist & Cart Merge Integration COMPLETE ✅. P0, Owner Decisions, Phase Ledger, P1, P2, and P3 are complete. Stage 4.9 — Authentication Security Hardening is READY — NOT STARTED.

## Stage 4.5 P3 — Regression Contract Reconciliation

- Navigation checker — updated to the authoritative `src/config/storefront-navigation.ts`: the current approved storefront navigation exposes Fragrances, Collections, and New Arrivals as live destinations; Gifts is not an approved live navigation item in this configuration.
- Search checker — updated from an obsolete exact JSX composition assertion to the accepted component-isolation contract: `StorefrontSearchAction` is mounted in the Header, while the behavioral overlay contract remains covered by its client-side accessibility, keyboard, API, and navigation assertions.
- Product-detail checker — updated from obsolete `Fragrance notes` copy to the current semantic PDP contract: `topNotes`/`TOPPNOTER` and the `Recensionsöversikt` review summary are rendered by the canonical Product Detail route.
- HTTP checker — made `BASE_URL` configurable with a `localhost:3000` default. The standalone `/wishlist` expectation is now `404` because commit `216ea49` (`updated design`, 2026-09-11) deleted the standalone wishlist route and `WishlistPageClient`, while the approved Wishlist experience is the header drawer. This supersedes the earlier Stage 4.5 P3 smoke expectation of `/wishlist → 200`.
- The reconciliation changes do not weaken product, search, navigation, or HTTP behavior checks; they remove stale implementation/copy assumptions and preserve the current route contract.
## Stage 4.9 P2 — Transport, Session, Cookie, Cache & Redaction Evidence

- `STAGE49_P2_SECURITY_CHECK` — PASS: explicit AURA same-origin mutation boundary rejects foreign origins; missing Origin remains compatible with the approved non-browser transport contract. Auth.js native endpoints retain Auth.js CSRF behavior, and Next.js Server Actions retain their framework transport boundary.
- `STAGE49_P2_REDIRECT_CHECK` — PASS: local relative callbacks are accepted; external, protocol-relative, `javascript:`, backslash, and malformed targets are rejected or normalized safely.
- `STAGE49_P2_HANDOFF_CHECK` — PASS: `/auth/post-login` revalidates fresh Auth.js/sessionVersion/canonical User authority, preserves safe redirect handling, and does not introduce a recurring merge hook.
- `STAGE49_P2_CACHE_HEADERS_CHECK` — PASS: owned auth mutations and handoff responses use `private, no-store` with the approved security headers; dynamic auth behavior was not globalized.
- Real Auth.js HTTP evidence — PASS: Credentials login/session/logout, authenticated continuation, Cart FAIL/Wishlist SUCCESS, Cart SUCCESS/Wishlist FAIL, actual redacted per-domain `Set-Cookie` lifecycle, no guest state, USER-only state, repeated-login idempotency, and no merge on session refresh/account/cart reads.
- Authority and privacy evidence — PASS: stale `sessionVersion`, DISABLED users, cross-user boundaries, token/account-derived limits, trusted-IP null path, and secret/token redaction remained safe.
- Stage 4.3–4.8 regressions — PASS: login/session/logout, password recovery, Account/Profile, Address, Order History, Cart/Wishlist, Commerce, Stage 4.8 merge, and HTTP/404 matrix. `/login`, `/`, `/reviews`, and `/cart` returned 200; `/wishlist` and hidden/unknown routes retained intentional 404 behavior.
- `P1_ATLAS_RATE_LIMIT_CHECK` and all P1 Atlas subchecks — PASS. Atlas fixture cleanup — PASS.
- TypeScript, full ESLint (0 errors / 0 warnings), production build, `corepack npm audit` (`found 0 vulnerabilities`), `git diff --check`, and P2-scoped checks — PASS. The host npm shim remains broken; `corepack npm` was used without changing project dependencies.

P2 is COMPLETE ✅. P3 — Final Audit & Documentation is READY — NOT STARTED. Stage 4.10 has not started.

## Stage 4.9 P3 — Final Audit, Regression, Cleanup & Documentation

- `STAGE49_P2_SECURITY_CHECK`, `STAGE49_P2_REDIRECT_CHECK`, `STAGE49_P2_HANDOFF_CHECK`, and `STAGE49_P2_CACHE_HEADERS_CHECK` — PASS.
- P1 Atlas rate-limit evidence — PASS: atomic concurrency, thresholds, expiry rollover, key isolation, trusted-IP null path, privacy, and fixture cleanup.
- Auth.js and recovery runtime — PASS: real Credentials login/session/logout, password recovery, fresh authority, stale `sessionVersion`, DISABLED behavior, and safe redacted handling.
- Stage 4.8 regression — PASS: both independent Cart/Wishlist failure permutations, actual redacted `Set-Cookie` lifecycle, no recurring merge on session/account/cart reads, and repeated-login idempotency.
- Prior Phase 4 regressions — PASS: Account/Profile, Address, Order History, Commerce, and current HTTP/404 behavior (`/` 200, `/login` 200, `/reviews` 200, `/cart` 200, `/wishlist` 404, unknown/hidden routes 404).
- TypeScript — PASS. Full ESLint — PASS (0 errors / 0 warnings). Production build — PASS. `corepack npm audit` — PASS (`0 vulnerabilities`). `git diff --check` and scoped checks — PASS.
- Documentation reconciliation — PASS. No secrets, raw tokens, credentials, guest cookies, or leftover Stage 4.9 fixtures were recorded or retained. No Stage 4.10 work started.

P3 is COMPLETE ✅. Stage 4.9 — Authentication Security Hardening is COMPLETE ✅. Stage 4.10 — Authentication Tests is READY — NOT STARTED.

## Stage 4.10 — Authentication Tests

- Goal Contract / authoritative Test Plan — PASS.
- Registration and verification — PASS: Atlas persistence, normalization, duplicate safety, resend rotation, hash-only purpose-bound tokens, expiry, replay, disabled protection, concurrent activation, UI transport, and cleanup.
- Login/logout/session — PASS: real Auth.js Credentials HTTP flow, native CSRF boundary, canonical User/sessionVersion authority, stale/DISABLED rejection, logout, cookie behavior, and safe errors.
- Password recovery/reset — PASS: real runtime GET/POST behavior, non-enumeration, atomic reset, replay rejection, sessionVersion increment, and cleanup.
- Account/Profile, Addresses, and Order History — PASS: protected runtime/domain boundaries, cross-user denial, ownership, snapshots, totals, default semantics, and cleanup.
- Stage 4.8 Cart/Wishlist merge regression — PASS: both independent failure permutations, actual redacted Set-Cookie lifecycle, idempotency, concurrency, and no merge on session/account/cart reads.
- Stage 4.9 security regression — PASS: Atlas atomic rate limits, thresholds, rollover, key isolation, trusted-IP null path, same-origin, redirects, handoff, cache headers, and redaction.
- Current HTTP/404 contracts — PASS: `/` 200, `/login` 200, `/reviews` 200, `/cart` 200, `/wishlist` intentional 404, authenticated `/account` 200, unknown/archived PDP 404, and hidden cinematic collection 404.
- TypeScript — PASS. Full ESLint — PASS (0 errors / 0 warnings). Production build — PASS. `corepack npm audit` — PASS (`0 vulnerabilities`). Scoped checks, `git diff --check`, Atlas cleanup, and documentation reconciliation — PASS.
- Required external-system policy — PASS: Atlas and Auth.js runtime evidence executed successfully. The controlled non-production email sender was used; the owner-supplied production email provider/domain was not treated as a completion dependency.

Stage 4.10 is COMPLETE ✅. Stage 4.11 — Phase 4 Sign-Off is READY — NOT STARTED.

## Stage 4.11 — Phase 4 Sign-Off

- Final reconciliation of Stages 4.1–4.10 and Phase 4 acceptance criteria — PASS.
- Auth/session/authorization, Stage 4.8 merge, Stage 4.9 security, redaction, Atlas cleanup, HTTP/404, TypeScript, full ESLint, production build, `npm audit` (0 vulnerabilities), documentation reconciliation, and `git diff --check` — PASS.
- Phase 4 is COMPLETE ✅. Phase 5 — Checkout & Payments is READY — NOT STARTED. No Phase 5 work was started.
