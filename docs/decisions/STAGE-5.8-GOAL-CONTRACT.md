# Stage 5.8 — Payment Webhooks & Idempotency / Goal Contract

**Status:** Goal Contract COMPLETE ✅ — Owner Decisions COMPLETE ✅ — Phase Ledger COMPLETE ✅ — Stripe correlation prerequisite COMPLETE ✅ — Runtime P3 COMPLETE ✅ — P4 COMPLETE ✅ — P5 COMPLETE ✅ — P6 COMPLETE ✅ — P7 READY — NOT STARTED

**Governing scope:** This contract is authorized for discovery and architecture
only. It does not implement webhook routes, provider-event persistence,
PaymentIntents, PayPal Orders, AURA Orders, email, or Stage 5.9.

## Objective

Define the trusted provider-event boundary for the two active payment paths:

- Stripe Payment Element card payments.
- Direct PayPal payments.

The contract must make duplicate, replayed, delayed, out-of-order, malformed,
unknown, and failed deliveries safe before any later commercial mutation.

Apple Pay, Google Pay, and Klarna are Coming soon and are not active payment
paths in this stage.

## In scope

- Server-only receipt and authenticity verification for Stripe and PayPal.
- Durable provider-event inbox/idempotency design.
- Correlation to existing `paymentAttempts` and provider identifiers.
- Safe processing states, retry/dead-letter decisions, and redacted metadata.
- Explicit handoff to Stage 5.9 for canonical AURA Order creation.
- Test/evidence design for signatures, replay, ordering, and provider retries.

## Explicit exclusions

- No webhook endpoint or Route Handler implementation yet.
- No database collection or schema migration yet.
- No PaymentIntent, PayPal Order, capture, reservation, inventory, or Order
  mutation from a webhook in this Goal Contract step.
- No customer/admin order email, confirmation route, admin UI, or Stage 5.9.
- No Apple Pay, Google Pay, Klarna, wallet, browser callback, redirect, or
  success-page webhook authority.

## Provider authority

Browser callbacks, redirects, query parameters, and client success messages
are not payment proof. Only a server-verified provider event may enter the
trusted event-processing boundary.

### Stripe webhook trust boundary

The later Next.js App Router Route Handler must read the unmodified UTF-8
request body and the `Stripe-Signature` header, then call Stripe's official
`constructEvent` verification boundary with the server-only
`STRIPE_WEBHOOK_SECRET`. Parsing or re-serializing the body before verification
is not allowed; `request.text()` is the required raw-body handoff before any
JSON interpretation.

Relevant event families are limited to the existing card PaymentIntent
lifecycle and must be mapped to AURA state only after correlation and trusted
retrieval. The exact allowlist belongs to the Phase Ledger and implementation
review; listening to every event is not permitted by default.

Stripe event IDs are the first idempotency key. Stripe also documents that two
distinct Event objects can represent the same underlying object transition;
the later implementation must use the provider event ID and a safe
provider-object/type guard before any state transition.

Stripe does not guarantee event ordering. Live delivery retries can continue
for up to three days, while sandbox retries are limited to three attempts over
several hours. Dashboard and Stripe CLI resend paths are normal replay
scenarios, not new payments. Test and Live event destinations/secrets remain
separate.

Official references:

- [Stripe webhook signature verification](https://docs.stripe.com/webhooks/signature)
- [Stripe webhook event delivery behavior](https://docs.stripe.com/webhooks)
- [Stripe webhook best practices](https://docs.stripe.com/webhooks?lang=node&locale=en-GB)

### PayPal webhook trust boundary

The server-only `POST /api/webhooks/paypal` endpoint verifies authenticity using PayPal's webhook
verification boundary, not trust posted JSON. Verification must preserve the
exact received body and use the PayPal transmission headers, including
`PAYPAL-TRANSMISSION-ID`, `PAYPAL-TRANSMISSION-TIME`, `PAYPAL-CERT-URL`,
`PAYPAL-AUTH-ALGO`, and `PAYPAL-TRANSMISSION-SIG`, together with the configured
`PAYPAL_WEBHOOK_ID`.

`PAYPAL_WEBHOOK_ID` is not configured in the current environment. It is a
future owner-supplied configuration requirement; its value must not be
requested, pasted into source, or logged now.

Relevant direct-PayPal events include Orders v2 approval/completion signals and
capture outcomes such as `PAYMENT.CAPTURE.COMPLETED`, with final trusted
provider state retrieved server-side where required. PayPal can retry a
non-2xx delivery up to 25 times over three days and supports dashboard resend,
so event IDs must be durably deduplicated. Sandbox and Live webhook apps,
URLs, credentials, and event configuration are separate.

Official references:

- [PayPal webhooks overview](https://developer.paypal.com/api/webhooks/overview/)
- [PayPal webhook integration and verification](https://developer.paypal.com/api/rest/webhooks/rest/)
- [PayPal Orders v2 webhook events](https://developer.paypal.com/api/rest/integration/orders-api/api-use-cases/other-use-cases)

## Provider-event inbox and idempotency model

The Phase Ledger should evaluate a dedicated provider-event inbox rather than
mutating `paymentAttempts` directly from an HTTP request. The durable record
should contain only the minimum safe fields:

- provider (`STRIPE` or `PAYPAL`)
- provider event ID, unique within provider
- event type
- received and provider event timestamps
- verification result and trusted boundary version
- processing status (`RECEIVED`, `PROCESSING`, `PROCESSED`, `RETRYABLE`,
  `DEAD_LETTER`, or equivalent)
- bounded retry count and redacted last error classification
- correlated payment-attempt ID/provider PaymentIntent or Order/capture IDs
- processed timestamp and an optional safe processing fingerprint

Raw payloads, signatures, webhook secrets, OAuth tokens, card data, PAN, CVC,
buyer passwords, and unnecessary identity data are not persisted by default.
If a bounded diagnostic sample is later approved, it must be redacted,
size-limited, access-controlled, and retention-limited.

The uniqueness boundary is `(provider, providerEventId)`. A duplicate delivery
must become a no-op or already-processed result. The same provider object and
event type must also be guarded so separate event IDs cannot repeat the same
commercial transition.

## Correlation and ordering policy

Stripe events correlate through trusted server-side PaymentIntent identifiers
and existing canonical attempt metadata/records. PayPal events correlate
through the persisted `providerOrderId`, capture references, and opaque
`aura_payment_attempt_id`/`custom_id` relationship. Customer email is never
payment ownership authority, and browser-supplied IDs are ignored.

The later processor must:

- accept a duplicate as idempotently complete;
- queue or retry an event whose correlated local attempt is not available yet;
- re-retrieve trusted provider state when event context is incomplete;
- never downgrade a trusted terminal success because an older failure arrives;
- treat pending→success as a monotonic progression;
- treat success→duplicate success as a no-op;
- reject or dead-letter unknown/unrelated references without commercial mutation;
- classify verification failures and malformed payloads as rejected, not
  processed;
- keep transient database/provider failures retryable without acknowledging a
  failed commercial mutation as complete.

## Inventory and stage ownership

Stage 5.8 owns authenticity, inbox idempotency, correlation, and trusted
payment-state handoff. It does not own canonical Orders.

- Stage 5.8: verified provider event and idempotent trusted payment-state input.
- Stage 5.9: canonical AURA Order, immutable snapshot, and order state.
- Stage 5.10: pending, failure, cancellation, recovery, and release lifecycle.
- Later order-finalization stage: idempotent customer/admin transactional email.

Reservation preservation/release/commit effects must be explicitly assigned in
the Phase Ledger and must not be invented inside this Goal Contract. A raw
webhook must never double-capture, double-release inventory, create an Order,
or send an email.

## Security boundaries

- `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_SECRET`, OAuth
  tokens, and future `PAYPAL_WEBHOOK_ID` configuration remain server-only.
- Verify authenticity before JSON interpretation is trusted or commercial
  mutation is considered.
- Bound request size, processing time, retries, and log volume.
- Redact signatures, secrets, tokens, raw payloads, and provider PII.
- Do not use browser authority, redirect parameters, customer email, or client
  payment status as payment ownership or proof.
- Keep Sandbox and Live endpoints, secrets, event IDs, and configuration
  separate.

## Test and evidence strategy

Later implementation must prove valid and invalid Stripe signatures, raw-body
mutation rejection, duplicate/replay, relevant test PaymentIntent events,
retry, and ordering. It must also prove valid and invalid PayPal Sandbox
verification, duplicate/replay, capture-related events, missing
`PAYPAL_WEBHOOK_ID` handling, and retry behavior.

Cross-provider evidence must prove at-most-once commercial mutation, no browser
authority, no duplicate inventory effect, no Order/email creation in Stage
5.8, and safe unknown-reference handling. Unavailable external configuration is
`IMPLEMENTED — NOT YET VERIFIED`, never fabricated PASS evidence.

## Genuine owner decisions required before implementation

1. Select the durable provider-event inbox persistence strategy and retention
   duration.
2. Approve the bounded retry/dead-letter operational policy.
3. Decide whether verified unknown events are retained as rejected inbox records
   or discarded after safe audit metadata is recorded.
4. Configure the PayPal Sandbox webhook later, including its server-only
   `PAYPAL_WEBHOOK_ID`; the value itself must not be pasted into chat or source.

These are the unresolved policy choices identified here. Provider signature
facts and the no-browser-authority rule are technical requirements, not owner
choices.

## Completion / stop

```text
Stage 5.8 Goal Contract — COMPLETE ✅
Owner Decisions — COMPLETE ✅
Phase Ledger — COMPLETE ✅
Stage 5.8 P1 — COMPLETE ✅
Stage 5.8 P2 — COMPLETE ✅
Stripe correlation prerequisite — COMPLETE ✅
Runtime — P3 COMPLETE ✅
P4 — COMPLETE ✅
P5 — COMPLETE ✅
P6 — COMPLETE ✅
P7 — READY — NOT STARTED

ATLAS_STOP:
Awaiting owner approval before Stage 5.8 implementation P7 — External webhook evidence and security regression.
Do not begin Stage 5.9.
```
