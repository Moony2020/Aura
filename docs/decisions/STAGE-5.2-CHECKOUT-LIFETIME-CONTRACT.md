# Stage 5.2 / P2 — Checkout-Lifetime Address Data & Snapshot Boundary

Status: P2 — contract documented; runtime implementation not started.

## Checkout-lifetime state

Contact, delivery, and optional billing data may exist only inside the
authoritative ACTIVE checkout attempt/session when a later authorized stage
introduces checkout persistence. It is server-controlled, ownership-scoped,
and subject to checkout expiry/lifecycle.

No separate permanent checkout-address-draft collection or account resource is
introduced. A guest checkout does not create an account Address, and an
authenticated checkout edit does not overwrite or create a saved Address.

## Address source and ownership

Authenticated checkout may use a saved Address as a server-authorized source.
Guest checkout uses opaque server-controlled guest identity and validated
checkout data. Browser input never controls `userId`, `ownerId`, `customerId`,
or `accountId`.

Saved Address reads and any later mutations remain within the existing Phase 4
Address-domain ownership boundary. Address-book changes require explicit
Address-domain actions.

## Delivery and billing relationship

```text
billing address same as delivery = true (default)
false -> separately validated billing context
```

Billing is not globally required as a second address. When separate billing is
selected, it remains a distinct checkout context and does not change the
delivery authority.

Phone remains optional by default. No new global mandatory address fields are
introduced; conditional requirements require a later approved shipping or
provider rule.

## Immutable historical boundary

Saved Addresses are mutable account data. The later Order-creation boundary
must copy selected delivery and billing values into immutable Order snapshots.
Order history must not retain a live reference whose later Address edits can
rewrite historical purchase data.

P2 defines this boundary only. It does not create Orders, write snapshots, or
add checkout persistence.

## Explicit exclusions

- Checkout UI or form implementation.
- Persistent checkout-address-draft collection.
- Checkout persistence runtime.
- Automatic save/update/create of account Addresses.
- Shipping methods, eligibility, or pricing.
- Tax calculation.
- Order creation or snapshot writes.
- Inventory reservation runtime.
- Stripe, PayPal, wallets, webhooks, payment creation, or payment mutation.
- Gift Card redemption.
- Stage 5.3 or any later stage.

## P2 evidence

- Checkout-lifetime versus saved Address lifecycle is explicit.
- Billing-same-as-delivery and separate billing behavior are explicit.
- Mutable saved Address versus immutable Order snapshot is explicit.
- No long-lived draft domain or implicit Address mutation is introduced.
- No runtime or later-stage implementation is introduced.

ATLAS_STOP:
Awaiting owner approval before the next Stage 5.2 subphase.
