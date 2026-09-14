# Phase 5 — Checkout & Payments

## Objective

Implement secure guest/customer checkout and webhook-verified payments.

## Dependencies

Product, cart, inventory, authentication, and order foundations.

## Stages

5.1 checkout architecture; 5.2 contact/address; 5.3 shipping; 5.4 pricing/tax/inventory review; 5.5 Stripe; 5.6 PayPal; 5.7 wallet eligibility; 5.8 webhooks/idempotency; 5.9 orders; 5.10 failures/cancellation; 5.11 refunds; 5.12 success/cancel routes; 5.13 security review; 5.14 tests; 5.15 sign-off.

Stages 5.1–5.4 are **COMPLETE**. Stage 5.5 P0 Goal Contract is complete;
Stripe Owner Decisions and the pre-existing payment baseline audit are
complete; its Phase Ledger and P1–P3 are COMPLETE ✅. P4 is IMPLEMENTED —
EVIDENCE PENDING using Stripe TEST MODE configuration; full browser handoff
requires an approved checkout host boundary. Stages 5.6–5.15 are
**NOT STARTED**.

## Phase Acceptance Criteria

Sandbox payment flows and signed webhooks pass, totals are recalculated server-side, sensitive card data never reaches storage, and failure states preserve recoverable carts.

## Tests Performed

Stage 5.1 and Stage 5.2 architecture/contracts and final reconciliations are
complete. No runtime checkout, provider
integration, credentials, payment mutation, reservation implementation, or
checkout UI was introduced.

## Known Issues

Merchant credentials and wallet eligibility remain future owner dependencies.
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
PayPal, wallet, webhook, credential, or Stage 5.5+ behavior. P3 — Contract
Audit & Documentation Reconciliation is READY — NOT STARTED.

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

Stage 5.5 — Stripe Integration: READY — NOT STARTED

ATLAS_STOP:
Awaiting owner approval before Stage 5.5 — Stripe Integration.
