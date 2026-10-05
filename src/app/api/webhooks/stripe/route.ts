import "server-only";

import Stripe from "stripe";
import { requireServerEnv } from "../../../../config/env.server.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const MAX_STRIPE_WEBHOOK_BODY_BYTES = 128 * 1024;

export function verifyStripeWebhookPayload(payload: string, signature: string, secret: string): Stripe.Event {
  return new Stripe("sk_test_stage58_p2_local_only").webhooks.constructEvent(payload, signature, secret);
}

function jsonResponse(body: { received?: boolean; error: string }, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number.isInteger(Number(declaredLength)) && Number(declaredLength) > MAX_STRIPE_WEBHOOK_BODY_BYTES) {
    return jsonResponse({ error: "Webhook request is too large." }, 413);
  }

  let payload: string;
  try {
    payload = await request.text();
  } catch {
    return jsonResponse({ error: "Webhook request could not be read." }, 400);
  }

  if (new TextEncoder().encode(payload).byteLength > MAX_STRIPE_WEBHOOK_BODY_BYTES) {
    return jsonResponse({ error: "Webhook request is too large." }, 413);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonResponse({ error: "Webhook signature is required." }, 400);

  let secret: string;
  try {
    secret = requireServerEnv("STRIPE_WEBHOOK_SECRET");
  } catch {
    return jsonResponse({ error: "Webhook verification is unavailable." }, 503);
  }

  try {
    const event = verifyStripeWebhookPayload(payload, signature, secret);
    try {
      const { processVerifiedStripeEvent } = await import("../../../../server/payment/stripe-webhook-processor.ts");
      const result = await processVerifiedStripeEvent(event);
      if (result === "DEAD_LETTER") return jsonResponse({ received: true, error: "" }, 200);
    } catch (error) {
      if (error instanceof Error && error.name === "RetryableStripeWebhookError") {
        return jsonResponse({ error: "Webhook processing will be retried." }, 503);
      }
      return jsonResponse({ error: "Webhook processing is unavailable." }, 503);
    }
  } catch {
    return jsonResponse({ error: "Webhook signature verification failed." }, 400);
  }

  return jsonResponse({ received: true, error: "" }, 200);
}
