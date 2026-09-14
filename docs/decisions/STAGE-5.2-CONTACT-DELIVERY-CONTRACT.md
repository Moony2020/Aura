# Stage 5.2 / P1 — Contact & Address Contract Boundaries

Status: P1 — contract documented; runtime implementation not started.

This document is limited to the approved Stage 5.2 P1 boundary. It defines
data authority and validation contracts only; it does not implement Checkout.

## 1. Contact contract

Checkout contact data is customer-provided data validated by the server.
Phone is optional by default. A missing phone must not reject an otherwise
valid checkout address. A later approved shipping method or verified provider
requirement may make phone conditionally required, but never globally by
assumption.

The browser must not submit or control `userId`, `ownerId`, `customerId`, or
`accountId`. Contact data is not an identity-linking mechanism: a guest email
does not automatically create or attach an account.

## 2. Delivery-address contract

Delivery address is validated using the existing canonical Address
representation and validation primitives. The contract preserves the existing
fields and does not add globally mandatory fields.

For authenticated checkout, saved Addresses may be selected as input sources
only through server-authorized ownership-scoped reads. For guest checkout,
delivery data remains server-controlled checkout data and does not create an
account Address.

Saved Address ownership is derived from the existing Phase 4 authority and
repository boundary. Client input is data, never ownership authority.

## 3. Billing-address contract

Billing address is not globally required as a separate address. The default
is:

```text
billing address = delivery address
```

The customer may select a different billing address. When selected, it is a
separately validated address context. Any payment-provider-specific billing
requirement belongs to the owning provider stage and must be server-authorized.

No customer is forced to enter the same address twice without an actual
approved requirement.

## 4. Ownership and lifecycle

```text
guest checkout
  -> opaque server-controlled guest identity
  -> checkout-lifetime contact/address data

authenticated checkout
  -> Auth.js + sessionVersion + canonical User authority
  -> ownership-scoped saved Address reads
```

There is no separate long-lived checkout-address-draft domain. When a later
authorized subphase introduces checkout persistence, the state is limited to
the ACTIVE checkout attempt/session and follows checkout expiry/lifecycle.

Checkout edits do not automatically create, update, or overwrite saved
Addresses. Address-book changes remain explicit Phase 4 Address-domain
operations.

## 5. Historical boundary

Saved Addresses are mutable account data. At the later Order-creation boundary,
the selected delivery and billing contexts are copied into immutable Order
snapshots. Order history must not retain a live Address reference that allows
later Address edits to rewrite historical purchase data.

The snapshot boundary is not implemented in P1 and no Order is created here.

## 6. Additional fields and conditional rules

No new globally mandatory fields are introduced. State/province, company,
apartment/unit, delivery instructions, phone, or other fields may become
conditionally required only through an approved country, carrier, shipping, or
provider contract in its owning stage.

P1 does not decide tax, shipping price, shipping eligibility, inventory,
payment, or provider policy.

## 7. Explicit exclusions

- Checkout UI or form implementation.
- Checkout persistence or draft collection.
- Address CRUD or Address-book mutations.
- Shipping methods, shipping eligibility, or shipping prices.
- Tax calculation.
- Order creation or immutable snapshot writes.
- Inventory reservation runtime.
- Stripe, PayPal, wallets, webhooks, payment creation, or payment mutation.
- Gift Card redemption.
- Stage 5.3 or any later stage.

## 8. P1 evidence

- Contact, delivery, and billing authority boundaries are documented.
- Guest and authenticated ownership boundaries are explicit.
- Saved Address versus immutable Order snapshot separation is explicit.
- No global field requirement or long-lived draft domain was invented.
- No runtime, persistence, or later-stage implementation was introduced.

ATLAS_STOP:
Awaiting owner approval before the next Stage 5.2 subphase.
