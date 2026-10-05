# Phase 5 — Checkout & Payments

## Objective

Implement secure guest/customer checkout and webhook-verified payments.

## Dependencies

Product, cart, inventory, authentication, and order foundations.

## Stages

5.1 checkout architecture; 5.2 contact/address; 5.3 shipping; 5.4 pricing/tax/inventory review; 5.5 Stripe; 5.6 PayPal; 5.7 wallet eligibility; 5.8 webhooks/idempotency; 5.9 orders; 5.10 failures/cancellation; 5.11 refunds; 5.12 success/cancel routes; 5.13 security review; 5.14 tests; 5.15 sign-off.

Stages 5.1–5.4 are **COMPLETE**. Stage 5.5 P0, Owner Decisions,
pre-existing payment baseline, Phase Ledger, and P1–P4 are COMPLETE ✅.
P5 — Stage 5.5 Audit and Documentation Reconciliation is COMPLETE ✅ after
the verified real Product → Cart → /checkout → Stripe Payment Element path.
The narrow Stripe correlation amendment is also COMPLETE ✅: new Stripe
attempts persist the server-returned PaymentIntent identity and provider-truth
status before client-secret return; PayPal remains unchanged.
Stage 5.6 PayPal Integration is COMPLETE ✅ after P0–P5 verified the real
Sandbox Product → Cart → /checkout → PayPal approval → server Capture path.
Stage 5.7 is COMPLETE ✅ under the superseding owner decision. Stripe cards
and direct PayPal are active; Apple Pay, Google Pay, and Klarna are Coming soon
and cannot initiate payment. Stage 5.8 Goal Contract, Owner Decisions, and
Phase Ledger are COMPLETE ✅; P1, P2, P3, P4, P5, and P6 are COMPLETE ✅. Stage 5.8 P7 is
READY — NOT STARTED. Stages 5.9–5.15
are **NOT STARTED**.

## Phase Acceptance Criteria

Sandbox payment flows and signed webhooks pass, totals are recalculated server-side, sensitive card data never reaches storage, and failure states preserve recoverable carts.

## Tests Performed

Stage 5.1 and Stage 5.2 architecture/contracts and final reconciliations are
complete. No runtime checkout, provider
integration, credentials, payment mutation, reservation implementation, or
checkout UI was introduced.

## Known Issues

Merchant credentials and real wallet activation remain future owner
dependencies. The current checkout intentionally has no active Express
Checkout wallet path.
Concrete tax and shipping business rules are assigned to Stages 5.4 and 5.3.

## Architecture Decisions

Stripe and PayPal official SDKs; webhook state is authoritative.

## Stage 5.3 P1 — Shipping Eligibility & Method Contract

P1 completed the contract-only shipping eligibility boundary. Address
validation precedes eligibility evaluation, and the server accepts only a
Sweden (`SE`) destination for the current shipping scope. An eligible
destination exposes exactly one carrier-neutral customer-facing method:
`STANDARD_DELIVERY` / Standard Delivery. Unsupported destinations expose no
eligible method and must block checkout; no fallback or silent substitution
is defined.

| Contract input | Current authority | Result |
| --- | --- | --- |
| Validated destination country | Server-side address validation | `SE` only |
| Supported method | Server-side shipping contract | `STANDARD_DELIVERY` only |
| Carrier | No carrier contract selected | Carrier-neutral presentation |
| Pickup/local collection | Not supported | No pickup method |
| Express/same-day/economy | Not supported | No alternative method |
| Weight/size | No general rule | Does not affect eligibility |
| Phone | Stage 5.2 contract | Optional unless a later verified carrier rule applies |
| Order value | Stage 5.3 P2 contract | Affects price only, not method eligibility |
| Tax | Stage 5.4 owner | Not evaluated in Stage 5.3 |

No carrier or provider is inferred from address data, headers, or browser
input. The contract introduces no shipping runtime, quote persistence,
checkout UI, carrier API, tax logic, inventory reservation, payment, or Order
behavior. P2 — Price, Threshold & Estimate Contract is COMPLETE ✅.

## Stage 5.3 P2 — Price, Threshold & Estimate Contract

P2 completed the contract-only Standard Delivery price and estimate boundary.
The server-authoritative price is `5900` minor units in SEK (`59 SEK`) below
the free-shipping threshold, and `0 SEK` at an eligible order value of
`>= 799 SEK`. Order value changes the price only; it does not remove or add
the Standard Delivery method. The customer-facing estimate is 2–4 business
days and is explicitly non-guaranteed.

| Contract input | Current authority | Result |
| --- | --- | --- |
| Currency | Existing minor-unit money contract | SEK |
| Standard Delivery below threshold | Stage 5.3 Owner Decision | `5900` minor units / `59 SEK` |
| Free-shipping threshold | Stage 5.3 Owner Decision | Eligible order value `>= 799 SEK` |
| Standard Delivery at/above threshold | Stage 5.3 Owner Decision | `0 SEK` |
| Order value | Server-side price qualification | Changes price only; method remains available |
| Delivery estimate | Stage 5.3 Owner Decision | 2–4 business days, non-guaranteed |
| Tax | Stage 5.4 Owner Decision | Sweden/current fragrance catalog, 25% VAT, VAT-inclusive treatment |

Quote validity remains a later server revalidation boundary: stale, invalid,
or unavailable shipping data must block checkout rather than fall back to a
different price or silently substitute a method. P2 adds no ShippingQuote
runtime or persistence, checkout UI, tax, carrier, inventory, payment, or
Order behavior.

## Stage 5.4 P1 — Pricing, Tax & Threshold Contract

P1 reconciled the approved server-authoritative commercial contract without
implementing a calculator or checkout runtime. Current Product/Variant price
wins over Cart presentation for both increases and decreases; checkout facts
become stale and require server recalculation plus customer review before
payment creation. Catalog and Standard Delivery prices are VAT-inclusive for
the initial Sweden-only fragrance scope, with 25% VAT for the current catalog.

| Contract area | Approved rule |
| --- | --- |
| Tax jurisdiction/rate | Sweden; 25% for the current fragrance catalog |
| Catalog price | VAT-inclusive gross price; VAT is extracted, not added on top |
| Shipping price | Standard Delivery is VAT-inclusive: `59 SEK` gross below threshold, `0 SEK` when eligible |
| Discount tax order | Gross merchandise → accepted Discount → discounted taxable merchandise → shipping → VAT → Gift Card tender |
| Free-shipping basis | Post-Discount, pre-shipping, pre-Gift-Card, VAT-inclusive eligible merchandise value |
| Free-shipping threshold | `>= 799 SEK` → `0 SEK`; otherwise `5900` minor units / `59 SEK` |
| Gift Card | Stored-value tender, not Discount; does not change taxable base or threshold; may reduce external payment to `0` |
| Rounding/allocation | Integer öre, deterministic rounding and remainder allocation; components reconcile exactly |
| Tax failure | Block checkout; never assume tax is zero |
| Price change | Current server price wins; refresh totals and require customer review before payment creation |
| Negative totals | Invalid and blocked; zero external payment is valid |

Production purchasing remains blocked because the current catalog has 0
TRACKED and 60 UNTRACKED variants. UNTRACKED is not unlimited or implicitly
purchasable; no stock quantities were invented. Gift Card voucher legal/
accounting classification remains a later verified boundary.

P1 introduced no pricing/tax runtime, ShippingQuote runtime, inventory
reservation, stock data, Gift Card redemption, checkout UI, Order, Payment,
Stripe, PayPal, wallet, webhook, credential, or Stage 5.5+ behavior. P2 —
Final Inventory Review & Reservation Boundary — COMPLETE ✅ — is documented
below without runtime implementation.

## Stage 5.4 P2 — Final Inventory Review & Reservation Boundary

P2 documented the later server-authoritative checkout review without changing
Cart or Inventory runtime. The review must revalidate Product publication and
Variant activity, current canonical price, inventory mode/state, permitted
quantity, shipping eligibility and price/threshold, Discount eligibility,
VAT, Gift Card facts, and final payable amount. Browser or stale Cart facts
cannot override current server truth; unresolved or invalid facts block
progression safely.

| Review fact | Later authoritative boundary |
| --- | --- |
| Product/Variant and price | Server re-resolves current published/activity and canonical price |
| Quantity/inventory | Server validates permitted quantity and current inventory state |
| Shipping/Discount/VAT/Gift Card | One coherent commercial review before payment preparation |
| Reservation eligibility | TRACKED inventory only |
| Reservation timing | After final review and before provider payment creation |
| Reservation TTL | Existing 15 minutes |
| Cart behavior | Purchase intent only; Cart mutations do not reserve inventory |
| UNTRACKED policy | Not unlimited or implicitly purchasable; production remains blocked |

Current catalog evidence remains 60 sellable variants, 0 TRACKED, 60
UNTRACKED, and 0 OUT_OF_STOCK. No stock quantities were invented or seeded.
Reservation creation, release/commit lifecycle, checkout, payment, Order,
Gift Card liability, and provider behavior remain later runtime boundaries.

P2 introduced no inventory reservation, stock mutation, checkout, pricing/tax
runtime, ShippingQuote, Gift Card redemption, UI, Order, Payment, Stripe,
PayPal, wallet, webhook, credential, or Stage 5.5+ behavior. Later Stage 5.5
runtime and audit status is recorded in the current Stage 5.5 section below.

Stage 5.3 P3 Final Audit & Documentation completed. The shipping contract is
consistent across Phase 5 status, roadmap, and Stage 5.3 decision records;
the required scope and exclusion checks pass, with no shipping runtime,
ShippingQuote persistence, carrier integration, checkout UI, tax,
inventory reservation, payment, or Order implementation introduced.

## Final Sign-Off

Stage 5.3 — Shipping Methods: COMPLETE ✅

P0 — COMPLETE ✅
Owner Decisions — COMPLETE ✅
Phase Ledger — COMPLETE ✅
P1 — COMPLETE ✅
P2 — COMPLETE ✅
P3 — COMPLETE ✅

Stage 5.4 — Server Pricing, Tax & Inventory Review: COMPLETE ✅
P0 — COMPLETE ✅
Owner Decisions — COMPLETE ✅
Phase Ledger — COMPLETE ✅
P1 — COMPLETE ✅
P2 — COMPLETE ✅
P3 — COMPLETE ✅

Pricing, tax, and inventory runtime implementation has not started.

Stage 5.5 — Stripe Integration: COMPLETE ✅
P0 — COMPLETE ✅
Owner Decisions — COMPLETE ✅
Pre-existing Payment Baseline — AUDITED ✅
Phase Ledger — COMPLETE ✅
P1 — COMPLETE ✅
P2 — COMPLETE ✅
P3 — COMPLETE ✅
P4 — COMPLETE ✅
P5 — Audit and Documentation Reconciliation: COMPLETE ✅

Stage 5.6 — PayPal Integration: COMPLETE ✅
P0 Goal Contract — COMPLETE ✅
Owner Decisions — COMPLETE ✅
Phase Ledger — COMPLETE ✅
P1 — PayPal Server Boundary and OAuth Adapter: COMPLETE ✅
P2 — PayPal Order Creation and Browser Approval Boundary: COMPLETE ✅
P3 — Server Capture, Retry, and Reservation Rollback: COMPLETE ✅
P4 — Real PayPal Sandbox Commerce Verification: COMPLETE ✅
P5 — PayPal Audit and Documentation Reconciliation: COMPLETE ✅
PayPal Runtime — VERIFIED ✅
Stage 5.7 — COMPLETE ✅
Stage 5.8 Goal Contract — COMPLETE ✅
Stage 5.8 Owner Decisions — COMPLETE ✅
Stage 5.8 Phase Ledger — COMPLETE ✅
Stage 5.8 P1 — COMPLETE ✅
Stage 5.8 P2 — COMPLETE ✅
Stage 5.8 Runtime — P3 COMPLETE ✅
Stage 5.8 P4 — COMPLETE ✅
Stage 5.8 P5 — COMPLETE ✅
Stage 5.8 P6 — COMPLETE ✅
Stage 5.8 P7 — READY — NOT STARTED
Stages 5.9–5.15 — NOT STARTED

ATLAS_STOP:
Stage 5.7 is COMPLETE ✅ under the superseding owner decision.
Awaiting owner approval before Stage 5.8 implementation P7 — External webhook evidence and security regression.
