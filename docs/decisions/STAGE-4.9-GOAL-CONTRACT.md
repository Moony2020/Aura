# Stage 4.9 — Authentication Security Hardening

**Status:** P0 Goal Contract COMPLETE ✅ — Phase Ledger NOT STARTED; implementation NOT STARTED.

## Goal

Define and later verify the narrow authentication/customer-account security hardening needed to safely close the existing Phase 4 auth surface, without redesigning Auth.js, changing Stage 4.8 merge behavior, or consuming broader Phase 9 security work.

## Current security baseline

- Auth.js Credentials with JWT sessions is the accepted transport. AURA reloads `authCredentials` and the canonical User, compares `sessionVersion`, and requires `ACTIVE` plus verified email before protected authorization.
- Registration, verification, resend, login, recovery, reset, Account/Profile, Address, Order History, and the Stage 4.8 post-login handoff exist as server-controlled boundaries.
- Passwords use the existing Argon2id policy (`memoryCost=19456`, `timeCost=2`, `parallelism=1`) and password inputs are bounded by the current schemas. Verification/reset tokens are random, hash-only at rest, purpose-bound, expiring, and atomically consumed.
- Public auth responses use non-enumerating behavior and safe serialized errors. Reset/verification transports use private/no-store and no-referrer controls where defined. Auth diagnostics use safe codes/operations/timestamps and must not contain secrets.
- Guest Cart/Wishlist cookies are opaque, HttpOnly, SameSite=Lax, path `/`, production-Secure, and independently retired by the completed Stage 4.8 post-login handoff.

## In-scope security surfaces

1. Registration, login, verification/resend, recovery, reset, logout, Auth.js handlers, auth Server Actions, auth cookies, redirects, and the Stage 4.8 handoff.
2. Protected Account/Profile, Address, and Order History authority, private response/cache behavior, cross-user authorization, disabled-user rejection, and session revocation boundaries.
3. Security controls necessary for these surfaces: abuse/rate-limit policy, same-origin/CSRF transport review, cookie/session configuration, error and enumeration safety, redaction, replay/token policy, password operational limits, and auth-specific response headers.

## Threat/control classification

| Area | Current classification | P0 finding / Stage 4.9 responsibility |
|---|---|---|
| Canonical authority, `sessionVersion`, ACTIVE + verified, cross-user ownership | ALREADY IMPLEMENTED + VERIFIED | Preserve and regression-test; hardening may close uncovered event boundaries only. |
| Argon2id and password input bounds | ALREADY IMPLEMENTED + VERIFIED | Preserve the accepted policy; any cost/version/password-policy change needs explicit justification and owner decision if user-facing. |
| Token hashing, purpose, expiry, atomic single-use consumption | ALREADY IMPLEMENTED + VERIFIED | Preserve; verify replay and leakage resistance across all token paths. |
| Auth and guest cookie attributes/lifecycle | IMPLEMENTED BUT NEEDS HARDENING | Verify explicit Auth.js cookie settings and production Secure behavior without weakening Stage 4.8 per-domain cleanup. |
| Rate limiting / throttling for registration, login, resend, recovery, reset | MISSING / NEEDS DECISION | Define boundaries only; thresholds, windows, keying, trusted proxy/IP treatment, storage, and distributed strategy require OWNER DECISION. |
| CSRF / same-origin / Origin or Host validation | IMPLEMENTED BUT NEEDS HARDENING | Map framework protection for Server Actions/Auth.js and add only transport-appropriate checks for custom Route Handlers; no generic middleware by assumption. |
| Callback and post-login redirects | ALREADY IMPLEMENTED + VERIFIED | Preserve local same-origin callback validation and the single `/auth/post-login` merge handoff. |
| Session fixation and transition behavior | IMPLEMENTED BUT NEEDS HARDENING | Verify successful login establishes the intended session transition and does not re-run merge on reads/refresh/navigation. |
| Disabled-user and stale-session rejection | ALREADY IMPLEMENTED + VERIFIED | Preserve immediate canonical rejection and regression-test every protected boundary. |
| Logging and sensitive-data redaction | IMPLEMENTED BUT NEEDS HARDENING | Verify no password/hash/token/JWT/cookie/guest-token/secret/URI leakage; define safe security events. Persistent audit-event storage requires OWNER DECISION. |
| Private/no-store cache behavior and auth response headers | IMPLEMENTED BUT NEEDS HARDENING | Verify Account/Profile/Address/Order and auth inspection/reset responses; distinguish auth-specific headers from Phase 9 site-wide policy. |
| Replay resistance, token lifetime, reset/verification consumption | ALREADY IMPLEMENTED + VERIFIED | Preserve existing purpose/expiry/atomic semantics and verify all routes. |
| Auth-related denial of service | MISSING / NEEDS DECISION | Scope to approved rate limiting and bounded inputs; do not invent infrastructure. |
| Broader CSP/XSS/observability/API security | OUT OF STAGE 4.9 SCOPE | Remains with Phase 9 unless a narrow auth dependency is proven. |

## Preserved architecture

Auth.js Credentials → JWT `userId`/`sessionVersion` → current `authCredentials` → canonical User → `ACTIVE` + verified → application authorization policy.

No MongoDB Auth.js adapter, database-session migration, OAuth/social/passkey expansion, MFA, or alternate authentication framework is introduced. The Stage 4.8 sequence remains: Credentials login → Auth.js session → `/auth/post-login` → fresh authority → independent Cart/Wishlist merge → safe local redirect. Merge work must not move into `authorize`, JWT/session callbacks, middleware, layouts, or recurring session reads.

## Prohibited changes

- No Stage 4.8 merge semantic or cookie-lifecycle change, new Cart/Wishlist behavior, checkout/payment change, or account/profile/address/order redesign.
- No weakening of non-enumerating errors, ownership checks, token consumption, password policy, tests, or redaction requirements.
- No new persistent security-event schema/collection, rate-limit backend, or distributed limiter without OWNER DECISION.
- No site-wide Phase 9 CSP/XSS/API/observability rewrite disguised as authentication hardening.
- No account deletion, email-change workflow, Reorder, MFA, OAuth, social login, magic links, passkeys, or admin-auth redesign.

## Phase 9 boundary

Stage 4.9 owns controls necessary to safely close the existing authentication/customer-account behavior. Phase 9 owns broader API validation/rate limiting, application-wide CSRF review, XSS/CSP, observability/logging platform work, and the full security audit. Any overlap must be limited to an auth-specific dependency and documented before implementation.

## Stage 4.10 boundary

Stage 4.9 may add focused tests needed to prove its own controls. Stage 4.10 remains NOT STARTED and owns the full authentication-test sign-off.

## Owner decisions

- Authentication rate limiting uses the approved shared MongoDB Atlas boundary and
  layered account/email/token policies. Account/email/token-derived limits are mandatory.
- IP is only a secondary abuse signal. Production IP enforcement remains inactive until
  a deployment-specific trusted proxy/client-IP source is explicitly configured and
  verified; untrusted forwarded headers are never accepted. A trusted-IP boundary may
  return a validated IP or `null`, and automated tests may inject only a controlled
  test-only source.
- No persistent security-event collection, customer-facing sign-out-everywhere feature,
  Argon2id/password-policy change, global API limiter, or Phase 9 security expansion.

## Unresolved owner decisions

1. Rate-limit thresholds, windows, keying (account/IP), trusted proxy/IP policy, storage backend, and distributed behavior for the five auth entry points.
2. Whether safe security events remain redacted operational logs or require persistent audit-event storage; a new schema/collection needs explicit approval.
3. Whether sign-out-everywhere is required as a distinct UX/policy beyond existing logout and already-approved `sessionVersion` revocation events.

No password-policy or Argon2 parameter change is currently required by the inspected baseline; surface one for decision only if later evidence proves it necessary.

## Verification expectations

- Static inspection and focused runtime checks for every in-scope transport, including real Auth.js login/session/logout, custom auth routes, protected account boundaries, and the Stage 4.8 handoff.
- Evidence for safe public messages, redacted diagnostics, cookie attributes, redirect validation, no recurring merge, stale/disabled rejection, replay resistance, private caching, and cross-user denial.
- No raw secrets or token values in logs or evidence; Atlas fixtures, if used later, must be cleaned up.
- `git diff --check` and focused quality checks must be reported honestly; no assertion may be weakened to obtain a pass.

## Explicit Stage 4.9 completion criteria

- Every in-scope control is classified as verified, hardened with evidence, or explicitly accepted by owner decision.
- Approved rate-limit and security-event decisions are implemented only after their decisions exist.
- Auth.js/JWT/canonical User/sessionVersion authority, Stage 4.8 handoff, ownership, cookie lifecycle, error contract, token policy, and protected account behavior remain intact.
- Focused Stage 4.9 security checks pass, existing Phase 4 regressions remain green, cleanup is verified, and documentation is reconciled.

**P0 conclusion:** The Goal Contract is complete. Implementation and Phase Ledger creation are not authorized by this document.
