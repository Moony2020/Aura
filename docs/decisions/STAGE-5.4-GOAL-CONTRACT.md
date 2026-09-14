# Stage 5.4 — Server Pricing, Tax & Inventory Review

Status: P0 Goal Contract COMPLETE — Owner Decisions COMPLETE; Phase Ledger not started

## Goal

Define the authoritative server-side checkout pricing, tax, and final
inventory-review contract without implementing checkout runtime, tax
calculation, inventory reservation, payment, Order creation, or UI.

## Authoritative boundaries

- Canonical Product/Variant current price is server-authoritative; browser
  totals and Cart presentation are not final checkout pricing proof.
- Checkout must re-resolve current Product/Variant and commercial facts.
- Money remains integer minor units in the canonical currency.
- The existing sequence remains: canonical merchandise, one accepted
  Discount, shipping/tax calculation, Gift Card application, then the
  remaining external-payment amount.
- Cart does not reserve inventory. Final checkout review owns revalidation;
  reservation remains before provider payment creation with the existing
  15-minute TTL where inventory is legitimately TRACKED.
- Current verified catalog reality is 60 sellable variants: 0 TRACKED,
  60 UNTRACKED, and 0 OUT_OF_STOCK. `UNTRACKED` is not implicitly
  purchasable or unlimited.
- Stage 5.3 shipping remains Sweden-only `STANDARD_DELIVERY`, `5900` minor
  units below the `>= 799 SEK` free-shipping threshold. Standard Delivery is
  VAT-inclusive under the approved current 25% treatment.

## Owner-decision classification

| Question | Classification | Existing authority when applicable |
| --- | --- | --- |
| Canonical current Product/Variant price authority | ALREADY AUTHORITATIVE | `docs/DATABASE.md`; Stage 5.1 contract |
| Integer minor-unit money representation | ALREADY AUTHORITATIVE | `docs/DATABASE.md`; Stage 5.1 contract |
| Pricing pipeline order | ALREADY AUTHORITATIVE | `docs/decisions/STAGE-5.1-PHASE-LEDGER.md` |
| Cart reservation behavior | ALREADY AUTHORITATIVE | Stage 5.1 contract; Cart runtime policy |
| Reservation timing and 15-minute TTL | ALREADY AUTHORITATIVE | Stage 5.1 contract; inventory architecture |
| Shipping method and base/free price | ALREADY AUTHORITATIVE | `docs/decisions/STAGE-5.3-PHASE-LEDGER.md` |
| Tax jurisdiction | ALREADY AUTHORITATIVE | Owner Decision: Sweden-first checkout; production VAT status must be verified |
| VAT/tax rate(s) | ALREADY AUTHORITATIVE | Owner Decision: 25% for the current fragrance catalog; future categories require review |
| Catalog prices tax-inclusive or tax-exclusive | ALREADY AUTHORITATIVE | Owner Decision: Swedish customer-facing catalog prices are VAT-inclusive |
| Shipping tax treatment | ALREADY AUTHORITATIVE | Owner Decision: Standard Delivery is VAT-inclusive under the current 25% treatment |
| Discount tax treatment | ALREADY AUTHORITATIVE | Owner Decision: accepted Discount reduces taxable merchandise consideration |
| Tax rounding and line/order allocation | ALREADY AUTHORITATIVE | Owner Decision: integer öre, nearest öre, deterministic allocation |
| Behavior when tax cannot be determined | ALREADY AUTHORITATIVE | Owner Decision: block checkout; never assume zero tax |
| Gift Card effect on taxable base | ALREADY AUTHORITATIVE | Owner Decision: Gift Card is tender and does not reduce taxable base |
| `799 SEK` threshold basis before/after Discount | ALREADY AUTHORITATIVE | Owner Decision: post-Discount, pre-shipping, VAT-inclusive merchandise value |
| Gift Card effect on shipping threshold | ALREADY AUTHORITATIVE | Owner Decision: Gift Card does not affect the threshold |
| Price increase between Cart and checkout | ALREADY AUTHORITATIVE | Owner Decision: current server price wins; checkout refreshes and requires review |
| Price decrease between Cart and checkout | ALREADY AUTHORITATIVE | Owner Decision: current server price wins; checkout refreshes and requires review |
| Customer acknowledgement or checkout blocking for price changes | ALREADY AUTHORITATIVE | Owner Decision: changed total must be reviewed before payment creation |
| Percentage rounding and remainder allocation | ALREADY AUTHORITATIVE | Owner Decision: integer minor-unit calculation with deterministic remainder allocation |
| Zero/negative payable-total protection | ALREADY AUTHORITATIVE | Owner Decision: external amount is nonnegative; zero is valid, negative blocks |
| Production policy for 60 `UNTRACKED` variants | ALREADY AUTHORITATIVE | Owner Decision: purchasing requires real TRACKED quantities; no invented stock |

Gift Card issuance/voucher legal classification remains a separate future
accounting/tax verification boundary; this contract does not classify it.

The classifications above are documentation findings, not tax or legal
advice and do not select rates, jurisdictions, or business behavior.

## Final checkout review contract

At the later authorized runtime boundary, the server must revalidate Product
publication/activity, Variant activity, current canonical price, inventory
mode/state, permitted quantity, shipping eligibility/quote, Discount
eligibility, and relevant Gift Card facts. Stale Cart or browser totals must
not override server truth. Invalid or unavailable price, Discount, shipping,
inventory, tax, or payable facts must block progression safely rather than
fall back silently.

## Explicit exclusions

This P0 contract authorizes no pricing runtime, tax engine, ShippingQuote
runtime or persistence, stock seed/update, inventory reservation mutation,
checkout UI, Order or Payment creation, Stripe, PayPal, wallets, webhooks,
Gift Card redemption, credentials, or Stage 5.5+ work.

## Completion evidence

- Goal and scope documented.
- Existing pricing, shipping, inventory, and Gift Card boundaries cited.
- Every requested tax, threshold, price-change, rounding, and UNTRACKED
  policy is classified according to the approved Owner Decisions.
- No runtime implementation or schema/policy mutation introduced.
- Documentation and scoped diff checks pass.

ATLAS_STOP:
Awaiting owner approval before Stage 5.4 Phase Ledger.
