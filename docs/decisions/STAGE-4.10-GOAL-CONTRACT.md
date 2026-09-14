# Stage 4.10 — Authentication Tests

## Goal Contract / Authoritative Test Plan

**Status:** Goal Contract / Test Plan COMPLETE ✅ — full test execution COMPLETE ✅.

**Authority:** This plan validates the completed Phase 4 authentication and account
surfaces. It does not redesign Auth.js, alter approved behavior, or begin Stage 4.11.

## Required test matrix

### Registration and verification

- Validate registration input normalization, server-assigned identity, `CUSTOMER` /
  `PENDING` lifecycle, duplicate non-enumeration, atomic User/credential/token writes,
  resend rotation, delivery-failure retention, and Atlas fixture cleanup.
- Validate verification token purpose, hash-only storage, expiry, single-use replay
  rejection, pending-only activation, disabled protection, concurrent single-winner
  behavior, safe GET inspection, explicit POST mutation, and safe UI terminal states.

### Login, logout, and sessions

- Use real Auth.js Credentials HTTP flow for successful and rejected login, native CSRF,
  session establishment, session reads, logout, safe errors, and cookie behavior.
- Verify canonical User authority, ACTIVE + verified requirement, `sessionVersion`
  freshness, stale-session rejection, DISABLED rejection, session transition behavior,
  and no browser-controlled identity fields.

### Recovery and reset

- Verify non-enumerating forgot-password responses, bounded inputs, token purpose/hash/
  expiry, inspection without mutation, explicit reset mutation, atomic consumption,
  replay/expiry/disabled rejection, password hash replacement, and session revocation.

### Protected account domains

- Account/Profile: safe projection, strict profile allowlist, ownership, cross-user and
  stale/DISABLED rejection, and private/no-store behavior where owned.
- Addresses: own list/create/update/delete, server-derived `userId`, cross-user denial,
  default shipping/billing behavior as currently defined, Atlas persistence, and cleanup.
- Order History: own list/detail, read-only status/totals/payment presentation, immutable
  line-item/address snapshots, historical totals, cross-user denial, and no mutation.

### Stage 4.8 Cart/Wishlist merge

- Test the single post-login merge handoff, Cart FAIL/Wishlist SUCCESS and inverse
  independence, guest-cookie retention/cleanup, no guest and USER-only state, repeated
  login idempotency, concurrency, and no merge on session reads, refresh, `/account`,
  or `/cart`.

### Stage 4.9 security hardening

- Atlas-backed rate-limit atomicity, thresholds, rollover, key isolation, cleanup, and
  trusted-IP null behavior.
- Same-origin/Origin handling per transport; redirect safety; `/auth/post-login` fresh
  authority; Auth.js CSRF and Server Action boundaries; private/no-store headers;
  security headers; safe error serialization; and redacted logs/responses.
- Confirm no password, hash, raw token, JWT/session or guest cookie, `AUTH_SECRET`,
  database URI/credential, or sensitive fixture data appears in output or evidence.

## Evidence classification

- **Atlas-backed integration evidence:** persistence, validators/indexes, transactions,
  atomicity, concurrency, ownership, cleanup, sessionVersion/DISABLED authority, and
  cross-user behavior against the approved non-production Atlas database.
- **Auth.js runtime/HTTP evidence:** native CSRF/session endpoints, Credentials login,
  logout, cookies, redirects, authenticated continuation, and real response headers.
- **Application runtime evidence:** Next dev/production routes, Account integration,
  protected boundaries, UI states, and current HTTP/404 contracts.
- Static checks may establish code/config boundaries but cannot replace required runtime
  or external-system evidence.

## Current HTTP/404 contracts

The test plan preserves the current contracts: `/` → 200, `/login` → 200, `/reviews` →
200, `/cart` → 200, `/wishlist` → intentional 404, authenticated `/account` → 200,
unknown/archived PDP → 404, and hidden cinematic collections → 404.

## Fixture and completion policy

- Every Atlas fixture uses a unique namespace, never logs secrets or raw token values,
  and is removed after the check. Cleanup must verify no namespaced records remain.
- Cross-user, PENDING, DISABLED, stale-session, concurrency, and unavailable-system
  paths must be explicit test cases.
- If Atlas, the Auth.js runtime, or another external system explicitly required by an
  accepted Stage 4.10 test is unavailable: record **IMPLEMENTED — NOT YET VERIFIED**.
  Never mark that gate COMPLETE from static inspection alone. The owner-supplied
  production email provider/domain is not a Stage 4.10 completion dependency;
  authentication email-flow tests use the already accepted controlled non-production
  email-sender boundary unless a test explicitly requires otherwise.
- A verified defect may receive only a narrow fix under the existing contract, followed
  by rerunning the affected matrix. No Stage 4.1–4.9 behavior is changed by assumption.

## Stop boundary

Stage 4.10 full test execution is COMPLETE ✅. Stage 4.11 remains NOT STARTED. The next
action requires owner approval for Phase 4 Sign-Off.

**ATLAS_STOP:** Awaiting owner approval before Stage 4.11 — Phase 4 Sign-Off.
