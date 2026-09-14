# Phase 4 — Authentication & Customer Account

## Objective

Implement secure identity, sessions, recovery, profiles, addresses, orders, and account-linked shopping state while keeping AURA's canonical User domain authoritative.

## Dependencies

Phase 1 User/Address domain and Phase 3 Cart/Wishlist persistence. Phase 4 stages progress sequentially.

## Stages

- [x] 4.1 Authentication Architecture
- [x] 4.2 Registration & Email Validation
- [x] 4.3 Login, Logout & Sessions
- [x] 4.4 Password Recovery
- [x] 4.5 Account Overview & Profile
- [x] 4.6 Address Management
- [x] 4.7 Order History (P1/P2/P3 complete)
- [x] 4.8 Wishlist & Cart Merge Integration (P0/Owner Decisions/Phase Ledger/P1/P2/P3 complete)
- [x] 4.9 Authentication Security Hardening (P0/Owner Decisions/Phase Ledger/P1/P2/P3 complete)
- [x] 4.10 Authentication Tests (Goal Contract / Test Plan and full execution complete)
- [x] 4.11 Phase 4 Sign-Off

## Phase Acceptance Criteria

Identity flows are server-validated and rate-limited, cookies are secure, authorization is server-enforced, and recovery/account tests pass.

## Tests Performed

`domain:auth:architecture:check`, User/Address, Wishlist/commerce, storefront, Foundation, TypeScript, ESLint, production build, npm audit, and scoped worktree checks passed. Stage 4.2 P1 additionally passed `domain:auth:check`, `db:auth:init`, `db:auth:check`, and `domain:auth:persistence:check` against the accepted non-production Atlas database. Stages 4.2–4.4 now have Atlas-backed registration, verification, login/session, logout, and password-recovery evidence recorded below.

## Known Issues

Production email provider/domain configuration is still owner-supplied. The accepted initial path uses `next-auth@5.0.0-beta.32` with JWT sessions; the MongoDB adapter is not part of the accepted path. Password Recovery uses only the controlled fake/in-memory sender. Stages 4.5–4.10 are COMPLETE; Stage 4.11 is READY — NOT STARTED.

## Stage 4.1 — Authentication Architecture

**Status:** COMPLETE ✅

Stage 4.1 defines the contracts and boundaries required before implementing an account flow. It does not register users, accept passwords, create sessions, send email, add Auth.js packages, add account UI, or create authentication collections.

### Decision summary

- Auth.js owns authentication and session mechanics at the framework boundary; AURA services own authorization, roles, ownership, account status, and business policy. This preserves accepted ADR-007.
- The AURA `users` collection and `src/domain/user/user.schema.ts` remain the canonical identity. There is no second Auth.js-owned user model and no password field in `User`.
- Initial method scope is email/password Credentials only. OAuth, social login, magic links, passkeys, and provider Accounts are not part of Stage 4.1.
- The initial database-session proposal is superseded by the owner-approved supported path: Auth.js Credentials with JWT sessions. Credentials-only with database sessions remains unsupported by the inspected Auth.js core.
- Store password material in a dedicated auth-only `authCredentials` collection, one record per canonical `userId`; store only a versioned modern password hash (Argon2id target), never plaintext or a client hash. The exact vetted implementation and parameters are Stage 4.2/4.3 gates; no dependency is selected or installed here.
- Future one-way token records belong in `authTokens` with purpose separation for email verification and password reset. Raw tokens are delivered once and never persisted.
- JWT sessions do not require an `authSessions` collection. A server-controlled nonnegative integer `sessionVersion` belongs in `authCredentials`; issued JWTs carry only the user identity and comparison version, while protected boundaries reload current server authority.

### Auth.js compatibility boundary

The Stage 4.3 P1 dependency gate selected and installed the current Auth.js beta `next-auth@5.0.0-beta.32`, resolving `@auth/core@0.41.3`. Its published peer metadata accepts Next `^14.0.0-0 || ^15.0.0 || ^16.0.0` and React `^18.2.0 || ^19.0.0`, matching AURA's Next 15.5.25 and React 19.2.8. The latest stable `next-auth@4.24.15` was also inspected, but the owner-approved implementation path uses v5 beta. The latest `@auth/mongodb-adapter@3.11.3` declares `mongodb ^6`, while AURA uses driver 7.5.0, and the adapter is not installed. No Auth.js handler, provider, or runtime behavior exists yet.

The official MongoDB adapter is not part of the accepted initial path. JWT sessions do not require it, and its normal User/Account/Session/VerificationToken model must not create a competing `users` collection or violate AURA's strict User validator. AURA repositories remain responsible for canonical User, `authCredentials`, and `authTokens` persistence when those implementation stages begin. No adapter package, Auth.js handler, or Auth.js User document is introduced here.

References: [Auth.js Getting Started](https://authjs.dev/getting-started), [Credentials provider](https://authjs.dev/getting-started/authentication/credentials), [session strategies](https://authjs.dev/concepts/session-strategies), [database models](https://authjs.dev/concepts/database-models), and [MongoDB adapter](https://authjs.dev/reference/mongodb-adapter).

### Compatibility closure evidence

The published `@auth/core@0.41.3` source contains the guard in `lib/utils/assert.js`: it sets `hasCredentials`, detects `session.strategy === "database"`, computes `onlyCredentials`, and returns `UnsupportedStrategy("Signing in with credentials only supported if JWT strategy is enabled")` when both conditions are true. The latest stable `next-auth@4.24.15` source contains the equivalent guard in `core/lib/assert.js` with the same behavior. This is source evidence, not a conceptual inference; the v5 source is also visible in the [published Auth.js core source](https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/lib/utils/assert.ts#L1021-L1038).

A disposable reproduction outside AURA used one Credentials provider, a minimal compliant adapter, and `session.strategy: "database"`; it returned `status=500` with the server configuration error and logged `UnsupportedStrategy`. The same reproduction with `session.strategy: "jwt"` returned `status=200` and `null` for the unauthenticated session response. It did not connect to Atlas, did not install anything in AURA, and was cleaned up afterward.

Conclusion: Credentials-only + database sessions is **not supported** by the exact published Auth.js core that the current Auth.js package would use. No unused Email/OAuth provider and no internal patch/workaround is acceptable.

### Accepted session strategy and owner decision

- **Option A — Auth.js Credentials + JWT sessions:** **ACCEPTED by the owner.** AURA keeps `users` authoritative by loading the current User on protected requests and never trusting JWT role/status claims. `authCredentials.sessionVersion` is the server-controlled revocation value; password changes, successful password resets, sign-out-everywhere, and security-driven forced logout increment it.
- **Option B — retain database sessions:** requires changing the Auth.js usage model or choosing another authentication framework. Do not select a framework automatically; this would supersede ADR-007 only after explicit owner approval.
- **Option C — another genuinely supported Auth.js mechanism:** accept only if it provides the actual email/password UX and database sessions without an unused second provider or an internal bypass. No such mechanism was accepted by this closure.

The accepted minimal path is Option A. The exact `next-auth` package version was a controlled dependency-selection gate during Stage 4.3 P1 and is now pinned to `5.0.0-beta.32`. Stage 4.3 P2 remains owner-gated and must not start automatically.

### Canonical identity and account lifecycle

The existing User contract is authoritative:

- Email identity is `trim().toLowerCase()` normalized into `normalizedEmail` and protected by the existing unique index.
- New registration will always create `role: CUSTOMER` and `status: PENDING`; a browser cannot select role or status.
- `PENDING` means the email is not verified and cannot authenticate as an active customer. Verification will atomically set `emailVerifiedAt` and transition the user to `ACTIVE`.
- `ACTIVE` requires a non-null `emailVerifiedAt` for login and account authorization.
- `DISABLED` cannot authenticate or authorize account/commerce operations. Existing sessions must fail the canonical status check immediately; disabling a user must also revoke/delete their sessions when the runtime exists.
- `ADMIN` is assigned only through an explicitly secured administrative policy, never through registration or a session claim supplied by the client.
- Deletion, email change, and account retention are deferred to the owning account/security stages and must preserve order snapshots and audit requirements.

### Authentication context and authorization

The future server boundary is intentionally layered:

1. Auth.js validates/decrypts the JWT and exposes only the identity reference plus the comparison `sessionVersion`.
2. AURA loads the current `authCredentials` security record and rejects a stale session version.
3. AURA loads the canonical User by stable `userId` and checks current status/verification.
4. Reusable policies expose safe context helpers such as `getAuthenticatedUser`, `requireActiveUser`, `requireRole`, and `requireResourceOwner`.
5. Repositories receive server-derived ownership, never a browser-selected `userId`.

Role, status, ownership, resource state, and admin permission checks remain in AURA services/policies. A session existing is not proof of `ADMIN`, active status, address ownership, Cart ownership, Wishlist ownership, or order visibility. Password hashes, reset tokens, session tokens, and provider records never enter this context or a client component.

### Planned auth persistence (not created in 4.1)

| Collection | Owner | Planned invariant | Required indexes/behavior |
| --- | --- | --- | --- |
| `authCredentials` | Auth boundary | One record per canonical `userId`; versioned Argon2id hash; nonnegative `sessionVersion`; timestamps | unique `userId`; server-only reads; no plaintext; version comparison at protected boundaries |
| `authTokens` | Auth boundary | Single-use purpose (`EMAIL_VERIFICATION` or `PASSWORD_RESET`), digest, user, expiry, consumed time | unique digest; purpose/user/expiry lookup; TTL is cleanup only, not authorization |

No `users` replacement, no Auth.js `VerificationToken` magic-link flow, no provider `accounts` collection, and no `authSessions` primary session collection are planned for the initial Credentials + JWT scope. Collection validators, indexes, idempotent initialization, cleanup, and Atlas verification belong to the owning implementation stages.

### Password and recovery policy

Argon2id is the target password KDF. Parameters and a vetted Node implementation must be selected, benchmarked, versioned, and recorded before registration/login code is written. Hashing is server-only; passwords are accepted only over the protected form/handler boundary, are never logged, cached, persisted in `User`, or returned in errors. Successful authentication may trigger a controlled rehash when the stored version is below policy.

Registration and recovery responses must not reveal whether an email exists. Duplicate registration, invalid credentials, pending accounts, disabled accounts, and unknown/expired recovery tokens use safe external messages and stable non-sensitive codes; detailed causes stay server-side. Recovery tokens are random, short-lived, single-use, purpose-bound, stored by digest, and consumed atomically. Email delivery is an application interface (`sendVerificationEmail` / `sendPasswordResetEmail`) behind a provider boundary; no provider or credentials are invented in Stage 4.1.

### Session, cookie, CSRF, and abuse policy

The accepted session strategy is Auth.js Credentials + JWT. Auth.js JWT cookies must remain opaque/HttpOnly/SameSite=Lax/Secure in production, while every protected request loads `authCredentials.sessionVersion` and canonical AURA User authority. JWT role/status/permission claims are not authoritative. Authenticated mutations require a CSRF design review and same-origin protection; SameSite is only one layer.

Authentication boundaries require separate rate limits for registration, login, verification resend, and recovery. Counters must not disclose account existence. Session lookup, token consumption, and password changes must be audited at a safe event level without credentials, raw tokens, cookies, PII, or connection data. Cache control for account responses is private/no-store where appropriate; auth state must not be placed in public discovery caches.

### Routes, rendering, and merge boundaries

Stage 4.1 creates no auth route or UI. Later routes must keep account/session reads inside protected account actions/pages and narrowly scoped handlers. Do not import global `auth()`, `cookies()`, or equivalent request-state reads into `src/app/layout.tsx` or `src/app/(storefront)/layout.tsx`; preserve the Phase 3 true-404 fix by keeping root/storefront streaming boundaries absent. Cinematic loading and `HeroPortalExperience` remain untouched.

Cart and Wishlist remain independent. Guest-to-user merge is deferred to Stage 4.8: only after successful authentication, the server will resolve both owners, apply deterministic/idempotent Cart line combination and Wishlist Product union rules, and clear/rotate the guest cookie only after durable success. Stage 4.1 adds no merge hook.

### Stage 4.1 boundaries

Stage 4.1 does not add:

- Auth.js or adapter packages, handlers, callbacks, providers, or runtime imports;
- registration, login, logout, session creation, password hashing, verification, recovery, or email delivery;
- account routes, forms, UI, middleware, browser auth state, or client identity claims;
- `authCredentials` or `authTokens` collections, validators, indexes, or fixtures; `authSessions` is not part of the accepted initial JWT architecture;
- Cart/Wishlist merge, checkout, orders, admin authorization, or business-data changes.

### Stage 4.1 verification

- `domain:auth:architecture:check` — PASS: documentation cross-references, accepted JWT/sessionVersion contract, canonical User authority, compatibility evidence, package/runtime absence, layout boundary, and Phase 3 loading-boundary preservation.
- Published metadata/source/reproduction — **PASS for the accepted Credentials + JWT combination**; the rejected Credentials-only + database-session proposal remains recorded as `UnsupportedStrategy` evidence.
- Existing User/Address, Cart/Wishlist/commerce, storefront, foundation, TypeScript, ESLint, build, audit, and worktree checks remain the regression gates for this architecture-only change.
- No successful login, session, registration, recovery, email, or Auth.js runtime behavior is claimed.

## Stage 4.2 — Registration & Email Validation

**Status:** COMPLETE ✅ — P1/P2/P3.1–P3.4 COMPLETE

### P1 — Auth Persistence Foundations

- `argon2@0.45.1` is installed as the exact dependency. Server-only password hashing uses Argon2id with `memoryCost=19456`, `timeCost=2`, `parallelism=1`, and hash version `1`. The PHC hash is verified before persistence and plaintext is never stored or returned.
- Atlas `authCredentials` is strict, requires the credential/security fields, and has the unique `userId` index. New records start with `sessionVersion=0`; the repository supports server-side version incrementing for later session/revocation work.
- Atlas `authTokens` is strict, stores SHA-256 token digests only, and separates `EMAIL_VERIFICATION` from future `PASSWORD_RESET` purposes. It has digest uniqueness, user/purpose/state lookup, and expiry cleanup indexes. The P1 repository boundary can create `EMAIL_VERIFICATION` records only; no password-reset records are created.
- Server-only repositories, random verification-token generation/hash helpers, and an email-sender abstraction are present. The email sender intentionally has no provider or credentials; delivery belongs to the registration stage.
- Atlas verification created temporary credential and email-verification fixtures, proved strict rejection of unexpected fields, hash-only storage, purpose binding, atomic single-use consumption, expiry rejection, and cleanup. No User, registration, login, session, Auth.js, JWT, password-recovery, Cart/Wishlist merge, or account UI behavior was added.

### P1 verification evidence

- `domain:auth:check` — PASS.
- `db:auth:init` — PASS against the accepted non-production Atlas database.
- `db:auth:check` — PASS: strict validators, Argon2id contract, purpose separation, and expected indexes.
- `domain:auth:persistence:check` — PASS: Atlas validators, indexes, hash-only storage, purpose binding, expiry, single-use consume, and fixture cleanup.
- TypeScript, full ESLint, production build, and direct local npm audit — PASS; npm audit reports `found 0 vulnerabilities`.

P3.1–P3.3 Email Verification Experience are complete. P3.4 completed final integration, regression, documentation, and audit verification.

### P2 Verification Checkpoint

Historical P2 checkpoint: Registration Flow was COMPLETE before P3 began. Atlas-backed registration verification passed for strict input validation, canonical email normalization, server-assigned CUSTOMER/PENDING identity, atomic User/credential/EMAIL_VERIFICATION persistence and rollback, duplicate concurrency, resend rotation, post-commit delivery failure retention, secret boundaries, and fixture cleanup. No activation UI or POST/Server Action was added in P2.

## Final Sign-Off

## Stage 4.3 — Login, Logout & Sessions

**Status:** COMPLETE ✅ — P1 COMPLETE ✅ / P2 COMPLETE ✅ / P3 COMPLETE ✅ / P4 COMPLETE ✅

### P1 — Dependency & Runtime Gate

- Current runtime: Node `v24.19.0`, Next `15.5.25`, React/React DOM `19.2.8`, TypeScript `5.9.3`.
- Published metadata: `next-auth@latest` is `4.24.15`; the official Auth.js installation path uses `next-auth@beta`, which resolves to `5.0.0-beta.32`. The selected v5 package declares peer compatibility with Next 14/15/16 and React 18/19.
- Installed dependency tree: `next-auth@5.0.0-beta.32` -> `@auth/core@0.41.3`. `@auth/mongodb-adapter` is absent.
- Auth.js documentation confirms Credentials support and JWT sessions without requiring database sessions. AURA's canonical `users`, `authCredentials.sessionVersion`, Argon2id, and `authTokens` boundaries remain authoritative.
- No Auth.js config, provider, handler, callback, JWT/session runtime, login, logout, UI, or account route was added in P1.

### P1 verification

- TypeScript — PASS.
- Direct npm audit — PASS, `found 0 vulnerabilities`.
- Scoped `git diff --check` for the dependency files — PASS; LF/CRLF notices only.
- Repo-wide `git diff --check` remains NON-ZERO only for documented unrelated baseline whitespace in `src/app/layout.tsx` and `src/components/HeroPortalExperience.tsx`; those files were not modified.

### P2 — Credentials Login & Server Session Authority

- Auth.js `Credentials` is wired through the approved JWT strategy. Login reuses canonical email normalization and the Stage 4.2 Argon2id policy, returning only the canonical User id to Auth.js after requiring `ACTIVE` status, non-null `emailVerifiedAt`, an existing credential, and a valid password.
- PENDING, DISABLED, malformed, wrong-password, and missing-credential cases return safe failure without revealing account existence. No role/status/permission claims are trusted from JWT transport.
- JWTs carry only the subject and comparison `sessionVersion`. Auth.js session reads reload canonical Atlas `users` and `authCredentials`; stale versions and disabled users are rejected server-side. Atlas checks proved old-token rejection after both a version increment and user disablement, with all fixtures cleaned.
- The Next Auth.js `/api/auth/providers` and `/api/auth/session` handlers returned HTTP 200. No custom logout UX, account UI, Password Recovery, Cart/Wishlist merge, or P3 implementation was started.
- TypeScript, full ESLint, direct npm audit (`found 0 vulnerabilities`), architecture boundary, Atlas login/revocation/cleanup, and scoped P2 diff checks passed. An earlier concurrent dev/build attempt produced transient `.next` artifact errors; the isolated final Stage 4.3 P3 production build passed.

### P3 — Logout, Helpers & Login UI

- Added the Maison `/login` page with accessible email/password fields, pending state, and a safe generic invalid-login message. The client form submits to the server action; it does not handle credentials or session state in browser storage.
- Added the real Auth.js Credentials server action and real Auth.js sign-out server action. The success path redirects through Auth.js; invalid credentials return a non-enumerating message. The server session helpers reload canonical Atlas authority and retain `ACTIVE`, verified-email, credential, and `sessionVersion` checks.
- Linked the Maison Account action to `/login`. No Account/Profile surface, Password Recovery, Cart/Wishlist merge, OAuth, database sessions, or custom JWT claims were added.
- `domain:auth:p3:check` — PASS. `domain:auth:runtime:check` — PASS against Atlas and a temporary Next runtime: real Credentials callback login issued a session cookie, `/api/auth/session` returned the fixture identity, and real `/api/auth/signout` cleared the session. The fixture was deleted afterward.
- `/login` and `/api/auth/[...nextauth]` returned HTTP 200 in the final dev-server check. TypeScript, full ESLint, production build, direct npm audit (`found 0 vulnerabilities`), architecture, Atlas service, and scoped checks passed. Repo-wide `git diff --check` remains NON-ZERO only for documented unrelated baseline whitespace.

### P4 — Regression, Documentation & Final Audit

- Atlas-backed final Auth.js runtime — PASS: real Credentials login issued an opaque JWT session, `/api/auth/session` reloaded canonical `users`/`authCredentials` authority, `sessionVersion` increment rejected the old token, `DISABLED` rejected the current token, and real signout cleared the browser session. Fixtures were cleaned.
- Stage 4.2 regressions — PASS: auth validators/indexes, Argon2id/hash-only persistence, registration transaction/concurrency/resend, email-verification atomicity/replay/expiry/disabled/concurrency, GET/POST transport, verification UI runtime, and cleanup.
- HTTP regression matrix — PASS: valid storefront/auth routes returned 200; archived/unknown product and hidden cinematic collection returned 404. The final local smoke matrix covered `/`, audience pages, `/collections`, `/new-arrivals`, `/cart`, `/wishlist`, `/login`, `/verify-email`, and Auth.js providers/session endpoints.
- Full quality gates — PASS: TypeScript, full ESLint (0 errors/0 warnings), isolated production build, direct local npm audit (`found 0 vulnerabilities`), commerce integration suite, and `STAGE43_SCOPED_DIFF_CHECK` (zero source/script whitespace errors).
- Repo-wide `git diff --check` remains NON-ZERO only for preserved unrelated baseline whitespace in `src/app/layout.tsx` and `src/components/HeroPortalExperience.tsx`; no unrelated cleanup was performed. The npm shim issue was bypassed with the established local npm CLI and no secrets were printed.
- Stage 4.3 — COMPLETE ✅. Stage 4.4 — Password Recovery: READY — NOT STARTED. No Account/Profile, recovery, or Cart/Wishlist merge behavior was introduced.

### Stage 4.4 — Password Recovery

- `POST /api/auth/password-reset/request` validates strict email input, normalizes it canonically, never enumerates account existence, and creates a `PASSWORD_RESET` record only for an ACTIVE, email-verified User with credentials. Each request invalidates the prior outstanding reset token and uses only the fake/in-memory `sendPasswordReset` abstraction; post-commit delivery failure does not remove the account or credential.
- `GET /api/auth/password-reset?token=...` hashes and inspects without mutation. Explicit `POST /api/auth/password-reset` validates the complete input, atomically consumes a matching unexpired token, rejects PENDING/DISABLED identities, updates the Argon2id credential, increments `sessionVersion`, and invalidates outstanding reset tokens. Raw tokens/passwords are neither persisted nor logged.
- Atlas checks passed for strict `PASSWORD_RESET` persistence, hash-only storage, purpose/expiry/single-use enforcement, rotation, replay, disabled protection, rollback, one-winner concurrency, old-JWT revocation, transport semantics, and fixture cleanup. UI/runtime checks passed for `/forgot-password`, `/reset-password`, non-mutating GET, explicit POST, generic request copy, and URL cleanup after success.
- `db:auth:init`, `db:auth:check`, `domain:auth:password-recovery:check`, `domain:auth:password-recovery:ui:check`, and `domain:auth:password-recovery:runtime:check` — PASS. TypeScript, full ESLint (0 errors/0 warnings), isolated production build with a process-only AUTH_SECRET, and direct npm audit (`found 0 vulnerabilities`) — PASS. Repo-wide `git diff --check` retains only the documented unrelated baseline whitespace.

## Stage 4.5 — Account Overview & Profile

**Status:** COMPLETE ✅ — P1 COMPLETE ✅ / P2 COMPLETE ✅ / P3 Final Audit & Documentation COMPLETE ✅

### P1/P2 — Server Boundary & Protected Account UI

- `/account` is protected by the server-side current-session helper; a missing, stale, unverified, or DISABLED authority redirects safely to `/login?callbackUrl=%2Faccount`.
- The server renders only the canonical safe projection: `email`, `firstName`, `lastName`, and `phone`. It derives `userId` from the validated authority and does not accept it from the client.
- The profile action has an exact strict allowlist of `firstName`, `lastName`, and `phone`. Email, role, status, sessionVersion, email verification, credential/password fields, addresses, orders, cart, and wishlist fields are not writable through this surface.
- Atlas-backed fixture verification — PASS: persistence and page reload, tampered authority-field rejection, stale `sessionVersion` rejection, DISABLED-after-login rejection, and exact fixture cleanup.
- Regressions — PASS: real Auth.js Credentials login/session/logout, Password Recovery runtime, storefront HTTP 200/404 matrix, TypeScript, scoped ESLint, direct npm audit, and P1/P2 scoped whitespace checks.

P3 Final Audit & Documentation reconciled the authoritative navigation, search, PDP, and HTTP contracts and passed the final evidence gates. The superseded expectations are recorded: Gifts is not required, search checks behavior/semantics, PDP checks current semantic structure, standalone `/wishlist` is intentionally 404, and HTTP base URL/port is configurable. Stages 4.5–4.9 are COMPLETE; Stage 4.10 is READY — NOT STARTED.

Stage 4.1 — **COMPLETE ✅**. Owner-approved architecture: **Auth.js Credentials + JWT Sessions with canonical server-side User authorization and `sessionVersion` revocation**. Stage 4.2 — **COMPLETE ✅** with P1, P2, and P3.1–P3.4 complete. Stage 4.3 — **COMPLETE ✅** with P1–P4 complete. Stage 4.4 — **COMPLETE ✅**. Stage 4.5 — **COMPLETE ✅** with P1/P2 and P3 Final Audit & Documentation complete. Stage 4.6 — **COMPLETE ✅** with P1/P2 and P3 Final Audit & Documentation complete. Stage 4.7 — **COMPLETE ✅** with P1/P2/P3 complete. Stage 4.8 — **COMPLETE ✅** with P0 Goal Contract, Owner Decisions, Phase Ledger, P1, P2, and P3 complete. Stage 4.9 — **COMPLETE ✅** with P0 Goal Contract, Owner Decisions, Phase Ledger, P1, P2, and P3 complete; Stage 4.10 READY — NOT STARTED.

### Stage 4.8 P1 — Merge Services, Transactions & Authorization

**Status:** COMPLETE ✅ — P1 and P2 complete; P3 Final Audit & Documentation COMPLETE ✅.

The server-only merge service composes the existing Cart and Wishlist collections under one fresh Auth.js/sessionVersion/canonical User authority check. Cart merges combine matching lines, validate current published product/variant/inventory sellability, and fail atomically without clipping or dropping unavailable lines; successful guest Carts are retired as `CONVERTED`. Wishlist merges union Product identities transactionally and consume the guest record only after the authenticated write succeeds. Version-scoped writes, ownership predicates, transactions, and Atlas tests cover stale sessions, cross-user boundaries, invalid Cart preservation, deduplication, and concurrent duplicate attempts. Login integration, cookie cleanup, UI, checkout, and Stage 4.9 remain out of scope.

### Stage 4.8 P2 — Login Integration & Guest-State Lifecycle

**Status:** COMPLETE ✅ — final Auth.js runtime evidence passed; P3 Final Audit & Documentation COMPLETE ✅.

Credentials login now establishes the Auth.js session with `redirect: false`, runs one server-side post-login orchestration step, and then follows the existing safe same-origin callback redirect. The orchestration reads only trusted HttpOnly guest Cart/Wishlist cookies, resolves fresh canonical ACTIVE + verified authority, invokes the accepted P1 services independently, and expires only the matching cookie after a successful committed merge. Merge failures do not fail authentication or cross-clear the other domain's cookie. No Auth.js callback, middleware, layout, session-read, checkout, order, UI, or Stage 4.9 integration was added.

### Stage 4.6 P1 — Server Address Boundaries & Authorization

**Status:** COMPLETE ✅ — P1 complete; P2 complete; P3 Final Audit & Documentation COMPLETE ✅.

The server-only Address boundary provides list/create/update/delete operations through the existing `MongoAddressRepository`. The current `userId` is derived only from Auth.js plus `sessionVersion` and the canonical User authority; browser-supplied `userId` and `ownerId` are rejected. Repository access is ownership-scoped for reads and mutations, cross-user access is rejected, and the existing default shipping/billing behavior is preserved without adding new semantics. Atlas-backed integration, strict boundary, TypeScript, ESLint, and runtime smoke checks passed. No UI, checkout, profile expansion, Cart/Wishlist merge, or Stage 4.7 work was started.

### Stage 4.7 P1 — Server Order History Boundaries & Authorization

**Status:** COMPLETE ✅ — P1 complete; P2 READY — NOT STARTED.

The server-only Order History boundary provides ownership-scoped list/detail reads through the existing Order domain and MongoDB persistence. Authority is reloaded through Auth.js, `sessionVersion`, and the canonical ACTIVE + verified User. The safe view model returns stored line-item/address snapshots, historical totals, and current domain status/payment/fulfillment presentation without customer mutation or browser-controlled ownership. Atlas authorization, cross-user, disabled-after-login, stale-session, snapshot integrity, domain, runtime, TypeScript, ESLint, and scoped checks passed. No UI, Reorder, Checkout, Cart/Wishlist merge, Admin Order Management, or Stage 4.8 work was started.

### Stage 4.7 P2 — Order History UI & Account Integration

**Status:** COMPLETE ✅ — P1/P2 complete; P3 READY — NOT STARTED.

The protected `/account` surface now renders the P1 read-only Order History view model with stored `orderNumber`, immutable line-item and address snapshots, historical totals, and safe status/payment/fulfillment presentation. It includes accessible expandable details plus genuine loading and empty states, uses no browser-controlled authority fields, and does not expose Mongo `_id` or add a new public order identifier. No pagination, sorting, Reorder, checkout, Cart/Wishlist merge, Admin Order Management, or Stage 4.8 behavior was introduced. Static UI, authenticated Atlas-backed runtime, TypeScript, scoped ESLint, production build, and scoped diff checks passed. P3 Final Audit & Documentation then passed the final regressions and closed Stage 4.7.

### Stage 4.6 P3 — Final Audit & Documentation

**Status:** COMPLETE ✅ — Stage 4.6 closed; Stage 4.7 P1/P2/P3 complete; Stage 4.8 P0/P1/P2/P3 complete; Stage 4.9 P0/Owner Decisions/Phase Ledger/P1/P2/P3 complete; Stage 4.10 READY — NOT STARTED.

Address CRUD, ownership, cross-user protection, Auth.js/sessionVersion, DISABLED behavior, and existing default shipping/billing semantics passed against Atlas with cleanup. Auth/Account/Profile, HTTP, Commerce/Foundation/Cinematic, TypeScript, full ESLint, production build, npm audit, scoped diff, and documentation reconciliation also passed. No Stage 4.7 implementation was started.
