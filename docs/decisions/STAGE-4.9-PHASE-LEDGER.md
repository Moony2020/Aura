# Stage 4.9 — Authentication Security Hardening

## Phase Ledger — P0-A2

**Status:** P3 COMPLETE ✅ — P1/P2 implementation and evidence passed; Stage 4.9 final audit is complete.

**Governing contract:** [Stage 4.9 P0 Goal Contract](STAGE-4.9-GOAL-CONTRACT.md)

**Owner decisions:** COMPLETE ✅ — rate-limit scope/policy, conditional trusted proxy/IP boundary,
redacted operational events without persistent audit storage, existing logout and
`sessionVersion` semantics, current Argon2id/password policy, and transport-specific
same-origin protection are approved as recorded by the owner.

## P1 — Authentication Abuse Controls & Shared Rate-Limit Boundary

### Scope

- Implement authentication-only rate limiting for registration, login, verification
  resend, forgot-password request, and password-reset submission.
- Use MongoDB Atlas as the shared persistence boundary only if the existing runtime
  and transaction/index capabilities support the approved policy safely.
- Apply the approved layered account/email, token-context, and secondary IP limits,
  non-enumerating responses, atomic updates, bounded expiry/TTL cleanup, and no raw
  secret storage.
- Centralize server-only trusted-IP extraction; return `null` when no verified
  deployment signal exists. Never infer trust from forwarded-header presence. Local/test
  may use only a controlled injected source.

### Allowed surfaces

- `src/server/auth/**`
- `src/app/api/auth/**`
- `src/app/(storefront)/auth/**`, login, verification, and reset route surfaces
- `src/domain/auth/**`
- auth-specific repository/schema/index/migration or initialization files under
  `src/server/repositories/**`, `src/domain/**`, and `scripts/**`
- focused auth test/check scripts and the corresponding Stage 4.9 documentation

### Required evidence and invariants

- Atlas-backed atomic success, threshold, expiry, concurrency, and cleanup checks.
- Account/email-derived limits remain effective independently of IP limits.
- No account enumeration, permanent account lock, raw credential/token persistence,
  or arbitrary client-forwarded IP trust.
- Existing Auth.js authority, PENDING/DISABLED behavior, sessionVersion checks, and
  Stage 4.8 post-login behavior remain unchanged.

### Exclusions and stop point

- No global API throttling, persistent security-event collection, new idempotency
  marker, password-policy/Argon2 change, or Phase 9 security platform work.
- If Mongo-backed atomic limiting cannot be implemented safely, stop with `OWNER DECISION
  REQUIRED`. Production IP-specific enforcement remains inactive until its deployment
  signal is configured and verified; account/email/token limits must still operate.

**Owner stop:** P1 is independently verifiable; stop after evidence and await approval
before P2.

## P2 — Transport, Session, Cookie, Cache & Redaction Hardening

### Scope

- Audit and narrowly harden CSRF/same-origin/Origin or Host validation per transport,
  documenting what Auth.js, Next.js Server Actions, and AURA each provide.
- Verify and harden Auth.js/session-cookie configuration, production Secure behavior,
  safe redirect and post-login handoff boundaries, session transition/fixation behavior,
  private/no-store cache behavior, auth-specific response headers, error serialization,
  and sensitive-data redaction.
- Preserve existing token purpose, expiry, atomic consumption, logout, and
  sessionVersion revocation semantics.

### Allowed surfaces

- `src/server/auth/**`
- `src/app/api/auth/**`
- `src/app/(storefront)/auth/**`, login, account, and reset/verification surfaces
- Auth.js configuration/route integration, shared auth error/logging utilities,
  focused tests/checks, and Stage 4.9 documentation

### Required evidence and invariants

- Real runtime checks for Auth.js login/session/logout, custom auth mutations,
  redirects, cookies, protected Account/Profile/Address/Order boundaries, and the
  Stage 4.8 handoff.
- Redacted evidence proves no password, hash, raw token, JWT, session/guest cookie,
  AUTH_SECRET, database credential/URI, or sensitive payload leakage.
- Same-origin protection is transport-appropriate, not blanket middleware; private
  authenticated responses are not publicly cached.
- No merge invocation from session reads, refresh, layouts, or normal navigation.

### Exclusions and stop point

- No Stage 4.8 merge redesign, checkout/cart/wishlist change, customer-facing
  sign-out-everywhere feature, MFA/OAuth/passkeys, global headers/CSP/XSS work, or
  Stage 4.10 full authentication test sign-off.

**Owner stop:** P2 is independently verifiable; stop after evidence and await approval
before P3.

## P3 — Final Audit, Regression, Cleanup & Documentation

### Scope

- Reconcile the completed P1/P2 implementation with the Goal Contract and all owner
  decisions; document accepted boundaries and any explicit deviations.
- Re-run focused Stage 4.9 security evidence and prior Phase 4 regressions, including
  Auth.js/session/recovery, Account/Profile, Address, Order History, Stage 4.8 merge,
  cookie lifecycle, redirects, disabled/stale authority, and current HTTP/404 behavior.
- Run TypeScript, full ESLint, production build, `npm audit`, scoped diff checks,
  runtime checks, Atlas cleanup, and documentation reconciliation.

### Allowed surfaces

- Stage 4.9 audit/check scripts, evidence and documentation only; narrowly scoped
  corrective fixes may touch P1/P2 surfaces when a real regression is proven.

### Required evidence and invariants

- Every in-scope control is verified, hardened with evidence, or explicitly covered
  by an approved owner decision.
- No weakened assertions, secrets in evidence, leftover fixtures, unrelated worktree
  changes, Stage 4.8 regressions, or Stage 4.10 implementation.

### Exclusions and stop point

- No Stage 4.10, Phase 9 security expansion, new feature work, or automatic next-stage
  implementation.

**Owner stop:** P3 completion requires final audit/sign-off; then stop before Stage 4.10.

## Preserved boundaries

Auth.js Credentials + JWT remains the transport; `sessionVersion` and canonical ACTIVE
+ verified User authority remain server-controlled. Stage 4.8's single post-login merge
handoff and independent Cart/Wishlist lifecycle remain unchanged. No global API limiter,
persistent security-event history, account deletion/email change, checkout/payment,
profile/address/order redesign, or Stage 4.10 work is included.

**ATLAS_STOP:** Awaiting owner approval before the next phase (Stage 4.10).
