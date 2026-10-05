# Stage 5.5 — Stripe Integration / Phase Ledger

**Status:** Phase Ledger COMPLETE ✅ — P1 COMPLETE ✅ — P2 COMPLETE ✅ — P3 COMPLETE ✅ — P4 COMPLETE ✅ — P5 COMPLETE ✅ — Stripe correlation amendment COMPLETE ✅

**Governing contract:** [Stage 5.5 P0 Goal Contract](STAGE-5.5-GOAL-CONTRACT.md)

This ledger is bound to the approved Stripe Owner Decisions and the audited
baseline. The current repository has no provider SDK/runtime; environment
variable boundaries and architecture documentation are preserved.

## Global invariants

- Cards use Stripe; PayPal remains Stage 5.6 and wallets remain Stage 5.7.
- Payment Element + PaymentIntents is the approved Stripe target.
- AURA owns checkout UI and all commercial calculations.
- Only final server-authoritative SEK integer minor units may reach Stripe.
- Payment proof is trusted provider API state and/or Stage 5.8 verified webhook evidence; redirect/client success is not proof.
- PaymentIntent creation requires final review, legitimate TRACKED reservation, and external amount greater than zero.
- The real catalog remains authoritative; no stock may be invented. For non-production P4 verification only, existing active catalog variants may receive explicitly controlled development-only TRACKED test inventory. `UNTRACKED` is not unlimited and is not implicitly purchasable.
- No persistent Stripe Customer, saved cards, setup_future_usage, or email-based linking initially.
- No raw PAN, CVC, expiry, secrets, tokens, PII, or sensitive payment payloads enter AURA storage/logs/metadata.
- Stage 5.8 owns webhook verification and canonical event idempotency; Stage 5.9/5.10 own Order and canonical Payment transitions.
- Every subphase stops for explicit owner approval before the next subphase.

## P1 — Stripe Boundary and Runtime Foundation

**Goal:** Introduce only the approved server/client provider boundary and dependency/config foundation.

**Scope:** Stripe SDK selection/version, server-only adapter shape, browser-safe publishable-key boundary, configuration validation, and provider-neutral interfaces.

**Preconditions:** P0, Owner Decisions, and this Ledger complete; no live credentials required to define the boundary.

**Allowed files/contracts:** Stage 5.5 contract/ledger, payment architecture docs, server env/config, provider adapter boundary, and dependency manifest only as explicitly required by the approved implementation.

**Runtime changes allowed:** No payment calls, PaymentIntent creation, checkout UI, webhook route, or inventory mutation. Dependency installation is not authorized until P2.

**Security/commercial invariants:** Server-only secrets; only Stripe-designated public values may be client-visible; no browser amount or ownership authority.

**Credential requirements:** None. Do not request credentials.

**Evidence:** boundary review, package/config review, secret scan, TypeScript, scoped lint/diff, and proof no payment call exists.

**Exclusions:** PaymentIntent, Elements UI, Customer, webhooks, Order, reservation, PayPal, wallets, and Stage 5.6+.

**Completion:** Approved boundary and configuration contract with no payment behavior.

**ATLAS_STOP:** Await owner approval before P2.

## P2 — Server Adapter and Payment-Attempt Contract

**Goal:** Implement the server-only Stripe adapter and the narrow internal payment-attempt boundary needed for PaymentIntent calls.

**Scope:** Stripe client construction, safe error normalization, server-authoritative amount/currency input, safe metadata allowlist, provider request idempotency handoff, and PaymentIntent create/retrieve/update contract.

**Preconditions:** P1 complete; owner-supplied Stripe test credentials available in ignored `.env.local` or equivalent test environment.

**Allowed files/contracts:** Stripe adapter, payment-attempt boundary, server env/config, approved validators/types, and P2 tests.

**Runtime changes allowed:** Test-mode provider calls only through the adapter; no Order creation, canonical Payment transition, webhook processing, or public success settlement.

**Security/commercial invariants:** PaymentIntent amount comes only from server final review; no Customer creation; no raw card data; metadata limited to approved AURA attempt identifiers.

**Credential requirements:** First credential-required subphase. Require `STRIPE_SECRET_KEY`; add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only if the client boundary is implemented and the owner supplies it. Never log or document values.

**Evidence:** adapter unit/integration tests, amount/currency tampering rejection, metadata/redaction checks, request-idempotency behavior, and Atlas-safe payment-attempt boundary evidence where applicable.

**Exclusions:** Payment Element UI, webhook verification/idempotency, Order/state transitions, inventory reservation implementation, PayPal, wallets, refunds, and success/cancel routes.

**Completion:** Server adapter and attempt contract pass all P2 gates.

**ATLAS_STOP:** Await owner approval before P3.

## P3 — Inventory-Gated PaymentIntent Preparation

**Goal:** Connect the approved server commercial review and reservation precondition to Stripe payment preparation.

**Scope:** Final review handoff, legitimate TRACKED reservation precondition, 15-minute reservation boundary, positive external amount guard, and safe PaymentIntent reuse/update within one active attempt.

**Preconditions:** P2 complete; approved non-production test-inventory decision; valid Stripe test credentials; an existing active catalog variant selected by controlled setup and given explicitly controlled TRACKED test inventory only in non-production.

**Allowed files/contracts:** checkout/payment-attempt orchestration, existing inventory reservation primitives, test fixture setup/cleanup, and focused tests.

**Runtime changes allowed:** Non-production/test-mode preparation only. No production catalog mutation and no final Order/payment settlement.

**Invariants:** Cart does not reserve; UNTRACKED is not purchasable; reservation precedes provider creation; stale amount requires review; zero external amount creates no Stripe payment.

**Credential requirements:** `STRIPE_SECRET_KEY` and, if client handoff is active, the approved public key.

**Evidence:** Atlas-backed controlled test inventory, reservation ordering, concurrency/expiry, amount tampering, stale-review, zero-payment, cleanup, and no-production-catalog-change checks.

**Exclusions:** Webhooks, canonical idempotency state machine, Order creation, refunds, PayPal, wallets, and production inventory changes.

**Completion:** Test-mode preparation passes with fixture cleanup.

**ATLAS_STOP:** Await owner approval before P4.

## P4 — Payment Element and Checkout Client Handoff

**Goal:** Add the approved Stripe Payment Element boundary to AURA checkout without receiving raw card data.

**Scope:** Canonical real Cart input, Stripe-controlled payment collection, client-secret handoff, safe public configuration, loading/error states, and server preparation handoff.

**Preconditions:** P3 complete; approved checkout owner boundary exists; test credentials and public key available.

**Allowed files/contracts:** Canonical Cart-to-checkout boundary, checkout payment UI, client boundary, server action/route handoff, controlled non-production test-inventory setup/cleanup, accessibility, and focused runtime tests.

**Runtime changes allowed:** Stripe test-mode client interaction; no raw card form and no browser-authoritative payment success.

**Invariants:** Checkout derives lines and amount from the canonical server-side Cart and approved Stage 5.1–5.4 review; no synthetic product or hard-coded payment amount is the primary path. Client secret is handled only as Stripe-designated client-use data; never logged/persisted unnecessarily; redirect is navigation only.

**Credential requirements:** Stripe test secret and owner-supplied publishable key.

**Evidence:** real test-mode Payment Element flow, redaction scan, browser tampering, safe handoff, and no raw-card-data proof.

**Exclusions:** Webhooks, canonical state transitions, refunds, PayPal, wallets, and Stage 5.6+.

**Completion:** Payment Element handoff passes approved P4 evidence.

**ATLAS_STOP:** Await owner approval before P5.

## P5 — Stage 5.5 Audit and Documentation Reconciliation

**Goal:** Verify the complete Stage 5.5 Stripe scope and document handoffs without claiming later-stage completion.

**Scope:** Test-mode regression, adapter/PaymentIntent boundary audit, fixture cleanup, secret/redaction scan, docs/status reconciliation, scoped diff, TypeScript, lint, build, and audit checks assigned by the approved contract.

**Preconditions:** P1–P4 complete and all required external systems available.

**Runtime changes allowed:** None beyond fixes narrowly covered by accepted Stage 5.5 contracts.

**Invariants:** Webhook authority remains Stage 5.8; Orders/transitions remain Stage 5.9/5.10; PayPal, wallets, refunds, routes, and Phase 5 remain incomplete.

**Credential requirements:** Existing owner-supplied test credentials only; never copy values into evidence.

**Evidence:** full Stage 5.5 test-mode evidence, cleanup, regressions, documentation/status checks, `git diff --check`, and quality gates.

**Exclusions:** Stage 5.6 and every later stage.

**Completion:** Stage 5.5 COMPLETE only after all P5 evidence passes; unavailable required systems mean `IMPLEMENTED — NOT YET VERIFIED`.

**ATLAS_STOP:** After successful P5, Stage 5.5 is COMPLETE and Stage 5.6 PayPal Integration is READY — NOT STARTED; await owner approval.

## Current ledger state

```text
Stage 5.5 — IN PROGRESS
P0 — COMPLETE ✅
Owner Decisions — COMPLETE ✅
Pre-existing Payment Baseline — AUDITED ✅
Phase Ledger — COMPLETE ✅
P1 — COMPLETE ✅
P2 — COMPLETE ✅
P3 — COMPLETE ✅
P4 — COMPLETE ✅
P5 — COMPLETE ✅
Stage 5.5-authorized runtime — IMPLEMENTED THROUGH P4; P5 audit complete

Repo-wide `git diff --check` — WAIVED: unrelated owner-authored whitespace
change at `src/app/globals.css:6010`. P3-scoped diff check passed.

ATLAS_STOP:
Stage 5.5 is COMPLETE ✅. Stage 5.6 PayPal Integration is READY — NOT STARTED.
Awaiting owner approval before Stage 5.6.
```
