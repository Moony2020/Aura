# AURA Master Plan

This is the authoritative roadmap. Work progresses sequentially through meaningful stages; later phases may not bypass unfinished critical dependencies.

## Phase 0 — Repository Audit & Baseline

Purpose: establish a verified understanding of the existing cinematic prototype.

- [x] 0.1 Repository Audit
- [x] 0.2 Current Experience Mapping
- [x] 0.3 Technical Risk Assessment
- [x] 0.4 Baseline Validation
- [x] 0.5 Phase 0 Sign-Off

Deliverables: verified stack/routes/components/media map, risk register, baseline test results.  
Exit criteria: audit documented, worktree understood, baseline tests reported honestly.  
Status: **COMPLETE**. See `phases/PHASE-00-AUDIT.md`.

## Phase 1 — Core Architecture & Domain Foundation

Purpose: establish one stable application and domain foundation before storefront expansion.

- [x] 1.1 Application Architecture
- [x] 1.2 Environment Configuration
- [x] 1.3 Framework Security Upgrade
- [x] 1.4 MongoDB Foundation
- [x] 1.5 Product Domain
- [x] 1.6 Collection Domain
- [x] 1.7 Fragrance Notes Domain
- [x] 1.8 User & Address Domain
- [x] 1.9 Order & Inventory Domain
- [x] 1.10 Shared Validation
- [x] 1.11 Error Architecture
- [x] 1.12 Seed & Legacy Product Mapping Strategy
- [x] 1.13 Foundation Integration Tests
- [x] 1.14 Phase 1 Sign-Off

Dependencies: Phase 0.  
Testing: lint configuration, typecheck, domain/unit tests, database validation, production build.  
Exit criteria: accepted architecture implemented, collection/schema evolution policy verified safely, six cinematic products map to one domain source, foundation tests pass.  
Status: **COMPLETE**. See `phases/PHASE-01-FOUNDATION.md`.

## Phase 2 — Storefront & Product Discovery

Status: **COMPLETE**. Storefront and product discovery are signed off; Phase 3 commerce stages 3.1–3.12 are complete. Phase 4 Stages 4.1–4.4 are COMPLETE; Stage 4.5 P1/P2 are COMPLETE and P3 Final Audit & Documentation is IN PROGRESS.

- [x] 2.1 Storefront Shell & Shared Layout
- [x] 2.2 Global Navigation
- [x] 2.3 Desktop Mega Menus
- [x] 2.4 Mobile Navigation
- [x] 2.5 Fragrance Catalog
- [x] 2.6 Women / Men / Unisex Campaign Pages
- [x] 2.7 Collection Landing Pages
- [x] 2.8 Product Detail Page
- [x] 2.9 Search Foundation & Full-Screen Search
- [x] 2.10 Filters & Sorting
- [x] 2.11 New Arrivals
- [x] 2.12 Responsive & Accessibility QA
- [x] 2.13 Phase 2 Sign-Off

Dependencies: Phase 1 product, collection, notes, media, and validation foundations.  
Exit criteria: real domain-backed discovery routes work across target breakpoints without replacing the cinematic homepage.

## Phase 3 — Cart, Wishlist & Commerce

Status: **COMPLETE**. Stages 3.1–3.12 are complete; the Phase 3 HTTP 404 regression was fixed and the final regression suite passed.

- [x] 3.1 Commerce Architecture
- [x] 3.2 Cart Data Model
- [x] 3.3 Guest & Account Cart Persistence
- [x] 3.4 Cart Drawer
- [x] 3.5 Full Cart Page
- [x] 3.6 Quantity & Inventory Validation
- [x] 3.7 Wishlist
- [x] 3.8 Discount Foundation
- [x] 3.9 Gift Card Foundation
- [x] 3.10 Fragrance World → Cart Integration
- [x] 3.11 Commerce Integration Tests
- [x] 3.12 Phase 3 Sign-Off

Dependencies: Phase 1; relevant Phase 2 product surfaces.  
Exit criteria: persistent guest cart, server-validated pricing/inventory, real `ACQUIRE` integration, tested empty/error states.

## Phase 4 — Authentication & Customer Account

Status: **IN PROGRESS**. Stages 4.1–4.4 are COMPLETE. Stage 4.5 P1/P2 are COMPLETE; P3 — Final Audit & Documentation is IN PROGRESS.

- [x] 4.1 Authentication Architecture
- [x] 4.2 Registration & Email Validation
- [x] 4.3 Login, Logout & Sessions
- [x] 4.4 Password Recovery
- [ ] 4.5 Account Overview & Profile
- [ ] 4.6 Address Management
- [ ] 4.7 Order History
- [ ] 4.8 Wishlist & Cart Merge Integration
- [ ] 4.9 Authentication Security Hardening
- [ ] 4.10 Authentication Tests
- [ ] 4.11 Phase 4 Sign-Off

Dependencies: Phase 1 user domain; Phase 3 cart/wishlist.  
Exit criteria: secure server-authorized accounts and verified guest-to-account state merge.

Stage 4.1 establishes Auth.js as the authentication/session-mechanics boundary while AURA `users` remains canonical for identity, status, roles, ownership, and authorization. The owner-approved strategy is Auth.js Credentials + JWT Sessions with minimal identity/version claims; protected server boundaries reload canonical User authority and compare `authCredentials.sessionVersion`. The rejected Credentials-only/database-session proposal remains documented as `UnsupportedStrategy`. No authentication runtime, Auth.js package, account UI, or Cart/Wishlist merge was introduced. See `phases/PHASE-04-AUTH-ACCOUNT.md`.

Stage 4.2 P1 establishes the auth persistence foundations only: server-only Argon2id password hashing (`argon2@0.45.1`, versioned policy), strict Atlas `authCredentials` and `authTokens` validators/indexes, repositories, random hash-only email-verification tokens, and an email-sender abstraction without a provider. `EMAIL_VERIFICATION` is the only token purpose created in P1; `PASSWORD_RESET` remains a future schema purpose for Stage 4.4. No registration flow, email delivery, Auth.js, JWT/session, login, recovery, account UI, or Cart/Wishlist merge was started. See `phases/PHASE-04-AUTH-ACCOUNT.md`.

Stage 4.2 P2 implements validated, canonicalized registration with server-assigned `CUSTOMER`/`PENDING` identity and an Atlas transaction covering User, credential, and `EMAIL_VERIFICATION` creation. Duplicate races use safe non-enumerating responses; resend rotates only the verification token; post-commit fake-email delivery failure preserves the pending account. P3 owns verification activation experience; no Auth.js, JWT/session, login, recovery, Cart/Wishlist merge, or real email provider was added. P3.4 completed the final integration audit; Stage 4.3 remains owner-gated.

Stage 4.3 P2 implements Auth.js Credentials + JWT transport over AURA's canonical server authority. Login accepts only ACTIVE, email-verified users with valid Argon2id credentials; PENDING, DISABLED, invalid, wrong-password, and missing-credential cases fail safely. JWTs carry only subject/sessionVersion comparison data; each session read reloads `users` and `authCredentials` from Atlas and rejects stale versions or disabled users. P2's Atlas-backed login, revocation, cleanup, TypeScript, ESLint, audit, runtime transport, and architecture checks passed. P3 remains owner-gated; logout UX and account surfaces are deferred.

Stage 4.3 P3 adds the Maison `/login` experience, server-action Auth.js Credentials sign-in with safe generic failures, a server-side current-session/required-session helper, a real Auth.js sign-out action, and the Maison Account link to login. P4 completed the final Atlas-backed Auth.js flow audit: login/session/logout, canonical role/status authority, `sessionVersion` revocation, DISABLED rejection, HTTP regressions, Stage 4.2 regressions, full checks, cleanup, documentation, and scoped diff verification all passed. Account/Profile and Cart/Wishlist merge remain deferred.

Stage 4.4 implements Password Recovery only. `POST /api/auth/password-reset/request` is non-enumerating and creates a hash-only `PASSWORD_RESET` record only for an ACTIVE, verified account with credentials; outstanding reset tokens rotate and delivery uses the fake/in-memory sender. `GET /api/auth/password-reset?token=...` is inspection-only. Explicit `POST /api/auth/password-reset` atomically consumes the token, writes a new Argon2id hash, increments `sessionVersion`, invalidates prior JWTs, rejects replay/expiry/PENDING/DISABLED cases, and preserves transaction rollback. Atlas-backed service, transport, cleanup, concurrency, UI, TypeScript, ESLint, build, audit, and regression checks passed. At the Stage 4.4 closeout, Stage 4.5 was READY — NOT STARTED; its later P1/P2 status is recorded below.

Stage 4.5 P1/P2 adds only the protected Account Overview and Profile surface. `/account` uses server-derived, validated Auth.js/sessionVersion authority and the canonical `users` collection. The client may update only `firstName`, `lastName`, and `phone`; all identity, lifecycle, credential, authorization, address, cart, and wishlist fields remain server-controlled and are rejected if supplied. P3 Final Audit & Documentation is IN PROGRESS under owner approval and is re-running the required regression, quality, cleanup, scoped-diff, and documentation evidence. Stage 4.6 remains NOT STARTED.

## Phase 5 — Checkout & Payments

- [ ] 5.1 Checkout Architecture
- [ ] 5.2 Contact & Delivery Address
- [ ] 5.3 Shipping Methods
- [ ] 5.4 Server Pricing, Tax & Inventory Review
- [ ] 5.5 Stripe Integration
- [ ] 5.6 PayPal Integration
- [ ] 5.7 Wallet Eligibility (Apple Pay / Google Pay)
- [ ] 5.8 Payment Webhooks & Idempotency
- [ ] 5.9 Order Creation & State Transitions
- [ ] 5.10 Failure, Cancellation & Pending States
- [ ] 5.11 Refund Architecture
- [ ] 5.12 Success / Cancel Routes
- [ ] 5.13 Payment Security Review
- [ ] 5.14 Checkout Integration Tests
- [ ] 5.15 Phase 5 Sign-Off

Dependencies: Phases 1, 3, and 4.  
Exit criteria: provider-sandbox flows and webhook verification pass; no raw card data is stored; redirects are not treated as payment proof.

## Phase 6 — Maison, Content & Customer Experience

- [ ] 6.1 Maison / Our Story
- [ ] 6.2 Gifts & Discovery Sets
- [ ] 6.3 Gift Cards UI
- [ ] 6.4 Sustainability
- [ ] 6.5 Contact & Acknowledgement Flow
- [ ] 6.6 FAQ & Boutiques
- [ ] 6.7 Newsletter & Unsubscribe
- [ ] 6.8 Configurable Social Links
- [ ] 6.9 Legal Pages & Cookie Architecture
- [ ] 6.10 Content QA
- [ ] 6.11 Phase 6 Sign-Off

Dependencies: Phase 1 content/config foundations; commerce integration where applicable.  
Exit criteria: functional persistence for displayed forms; legal/business unknowns remain explicit placeholders.

## Phase 7 — Admin Platform

- [ ] 7.1 Admin Architecture & Authorization
- [ ] 7.2 Dashboard
- [ ] 7.3 Product & Product Media Management
- [ ] 7.4 Collection Management
- [ ] 7.5 Inventory Management
- [ ] 7.6 Order Management & Audit Trail
- [ ] 7.7 Customer Management
- [ ] 7.8 Discounts & Gift Cards
- [ ] 7.9 Newsletter Subscribers
- [ ] 7.10 Content Configuration
- [ ] 7.11 Admin Audit Log
- [ ] 7.12 Admin Security Review
- [ ] 7.13 Admin Integration Tests
- [ ] 7.14 Phase 7 Sign-Off

Dependencies: Phases 1, 3, 4, 5, and 6.  
Exit criteria: every admin mutation is server-authorized, validated, audited where material, and reflected dynamically in the storefront.

## Phase 8 — Cinematic Experience Integration

- [ ] 8.1 Hero / Portal Integration Review
- [ ] 8.2 Fragrance World Product Mapping
- [ ] 8.3 `ACQUIRE` → Persistent Cart
- [ ] 8.4 `EXPLORE NOTES` → Shared Product Data
- [ ] 8.5 Product Preview Navigation
- [ ] 8.6 `RETURN TO PORTAL` & URL State
- [ ] 8.7 Single Product Source Verification
- [ ] 8.8 Animation Lifecycle & Cleanup
- [ ] 8.9 Mobile Cinematic Experience
- [ ] 8.10 Phase 8 Sign-Off

Dependencies: Phases 1–7.  
Exit criteria: the signature experience remains visually intact while using the same product/cart systems as the store.

## Phase 9 — Security, Performance & Hardening

- [ ] 9.1 Authentication & Admin Authorization Audit
- [ ] 9.2 API Validation, Rate Limiting & CSRF Review
- [ ] 9.3 XSS / Content Security Review
- [ ] 9.4 Payment & Database Integrity Review
- [ ] 9.5 Inventory Race Conditions
- [ ] 9.6 Error Handling, Logging & Observability
- [ ] 9.7 Image / Video / Font Optimization
- [ ] 9.8 Lazy Loading & Bundle Analysis
- [ ] 9.9 Accessibility & SEO
- [ ] 9.10 Mobile / Cross-Browser QA
- [ ] 9.11 Phase 9 Sign-Off

Dependencies: all functional phases.  
Exit criteria: documented security review, performance budgets, accessibility checks, and regression suite pass.

## Phase 10 — Production Readiness

- [ ] 10.1 Environment & Secrets Audit
- [ ] 10.2 Production Database & Migration Verification
- [ ] 10.3 Production Payment / Email Configuration
- [ ] 10.4 Domain, Analytics & Consent
- [ ] 10.5 Backup / Recovery Review
- [ ] 10.6 Production Build & Smoke Tests
- [ ] 10.7 Customer, Checkout & Admin E2E Tests
- [ ] 10.8 Final Regression & Documentation Review
- [ ] 10.9 Production Sign-Off

Dependencies: Phases 1–9.  
Exit criteria: production configuration and complete critical flows are verified with real owner-supplied business details and credentials.
