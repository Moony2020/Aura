# Stage 4.8 — Wishlist & Cart Merge Integration

## Phase Ledger — P0-A2

**Status:** COMPLETE ✅ — Ledger executed. P1, P2, and P3 — Final Audit & Documentation are COMPLETE ✅.

**Governing contract:** [Stage 4.8 P0 Goal Contract](STAGE-4.8-GOAL-CONTRACT.md)

### P1 — Merge Services, Transactions & Authorization

- Extend existing Cart/Wishlist services and repositories only where required by the approved contract.
- Resolve authenticated ownership through Auth.js, trusted session establishment, `sessionVersion`, and canonical ACTIVE + verified User authority.
- Resolve guest ownership only through `aura_guest_cart` and `aura_guest_wishlist` token-hash boundaries.
- Keep Cart and Wishlist as separate atomic domain operations. Cart combines matching variant lines under existing Commerce rules and fails atomically for invalid availability, sellability, max, or unavailable lines. Wishlist performs canonical Product deduplication.
- Preserve authenticated state on failure; retire guest state only after that domain's durable commit. Use existing transactions, versions, one-active-USER-cart, Wishlist uniqueness, and atomic guest-consumption primitives.
- If P1 proves a new idempotency marker is required, stop with `OWNER DECISION REQUIRED` instead of changing schema automatically.

Verification: ownership, cross-user, authority/sessionVersion, PENDING/DISABLED rejection, Cart rollback, Wishlist deduplication, repeated/concurrent merges, one active USER Cart, no silent loss, and Atlas cleanup.

### P2 — Login Integration & Guest-State Lifecycle

- Add one server-side post-login merge step after successful Credentials session establishment and before final redirect where supported.
- Do not place merge in `authorize`, JWT/session callbacks, global layouts, or recurring session reads. Login remains successful if commerce merge fails.
- Clear only the corresponding guest cookie after that domain's committed merge; failed domains retain their record and cookie. Do not redesign checkout, Account/Profile, Order History, or global auth reads.

Verification: real Auth.js flows for guest-only, user-only, combined, repeated, failed, and no-state cases; per-domain cleanup/retention; no merge on refresh/session reads; Stage 4.3–4.7 and true-404 regressions.

### P3 — Final Audit & Documentation

- Re-run the complete Stage 4.8 contract against real Auth.js and non-production Atlas.
- Verify atomicity, idempotency, concurrency, ownership, availability, cleanup, failure recovery, and all regressions.
- Run TypeScript, full ESLint, production build, npm audit, runtime, scoped diff, Atlas cleanup, and documentation reconciliation.
- Do not add persistence/idempotency primitives without a new owner decision.

### Preserved boundaries

Separate guest identities, current inventory rules, server-derived ownership, no silent quantity clipping/drop, no checkout redesign, no Order mutation, no global auth/layout reads, no Stage 4.9, and no automatic implementation start.

**ATLAS_STOP:** Awaiting owner approval before Stage 4.9.
