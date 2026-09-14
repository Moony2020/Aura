# Stage 4.8 — Wishlist & Cart Merge Integration

## P0 Goal Contract — P0-A1

**Status:** APPROVED ✅ — Goal Contract complete. Owner Decisions COMPLETE ✅. Phase Ledger COMPLETE ✅.

### Objective

Define a secure, server-authoritative guest-to-authenticated Cart and Wishlist reconciliation flow using the existing Phase 3 domains, repositories, services, guest identities, and accepted ADRs. P0 defined the contract; P1/P2 implementation and P3 audit now execute against this contract.

### Authoritative foundations inspected

- ADR-023: Product/Variant price, sellability, and inventory are resolved by the server; adding to Cart does not reserve inventory.
- ADR-024: Commerce mutations belong in shared server/application services, with Server Actions as the default first-party transport.
- ADR-025: Cart lifecycle is `ACTIVE`/`CONVERTED`/`EXPIRED`; Cart owners are `GUEST` or `USER`; matching variant lines combine quantities; successful merge makes the guest Cart unavailable; versioned atomic/transactional writes are required.
- ADR-026: one active Cart per owner, embedded lines, and duplicate `productId` + `variantId` prevention.
- ADR-027: Wishlist is independent, product-identity based, guest-owned through a separate token, and eventually merges as a deterministic Product union.
- Current `CartService`/`MongoCartRepository` and `WishlistService`/`MongoWishlistRepository`: guest identity is token-hash based, USER identity is trusted server-side `userId`, and no merge primitive currently exists.
- Auth.js/current session authority: protected identity must reload `sessionVersion` and canonical User, requiring `ACTIVE` and verified status.

### Contract invariants

- Keep `aura_guest_cart` and `aura_guest_wishlist` as separate opaque, high-entropy, HttpOnly guest identities; raw tokens are never persisted.
- Authenticated ownership comes only from Auth.js → JWT `userId`/`sessionVersion` → current credentials/sessionVersion comparison → canonical `users` record → `ACTIVE` + verified policy.
- The browser must never select `userId`, `ownerId`, `accountId`, `cartOwner`, or `wishlistOwner`.
- Cart merge uses existing variant identity and quantity semantics; Wishlist merge uses canonical Product identity and deduplicating union semantics.
- Merge must be idempotent and retry-safe, ownership-scoped, concurrency-safe, and server/service based. Client state is not an authority or concurrency solution.
- Guest state/cookies are retired only after durable server persistence succeeds. Failed merge must not silently lose guest state.
- Merge must preserve current Product publication, Variant, price, and inventory eligibility rules; guest existence never makes an item purchasable.
- No checkout redesign, payment/order mutation, Order History mutation, global auth reads, true-404 loading-boundary regression, Stage 4.9 work, or unrelated cleanup is permitted.

### Eventual verification contract

The later implementation phases must prove, against Atlas and real Auth.js, guest-only, user-only, combined, duplicate, no-state, repeated/idempotent, concurrent, failure/rollback, stale-session, DISABLED-user, cleanup-timing, one-active-USER-Cart, cross-user, Phase 3 Commerce, and Stage 4.3–4.7 regression scenarios. The proof must show guest state is retained on failed merge and retired only after successful durable merge.

### Owner decisions resolved for the Phase Ledger

The owner has now resolved the implementation-level semantics that were intentionally left open during P0:

1. Merge runs once server-side after successful Credentials session establishment and before final redirect where supported; it is not placed in `authorize`, JWT/session callbacks, global layouts, or recurring session reads. Login remains successful if merge fails.
2. Cart merge fails atomically when combined quantities violate current stock, max, sellability, or availability rules; no clipping or precedence rule is invented.
3. Invalid/unavailable Cart lines fail the entire Cart merge and remain in the guest Cart; they are never silently dropped or force-imported.
4. Cart and Wishlist merge independently. Each domain commits authenticated state, retires its guest record, and clears only its own cookie after successful durable persistence; a failed domain retains its record and cookie.
5. No additional persistent idempotency marker is added initially. Existing transactions/concurrency, one-active-USER-cart, Wishlist deduplication, and atomic guest consumption are the accepted first implementation boundary; P1 must stop for a new owner decision if those prove insufficient.

### Explicit exclusions

No UI, checkout change, Admin surface, or Stage 4.9 work is included in Stage 4.8. The approved P2 implementation uses a single internal `/auth/post-login` handoff after Auth.js issues the session cookie; the original same-request session re-read assumption was superseded by runtime evidence.
