import "server-only";

import { requireServerEnv } from "../../../../config/env.server.ts";
import {
  fetchPayPalCertificate,
  MAX_PAYPAL_WEBHOOK_BODY_BYTES,
  PayPalWebhookVerificationError,
  verifyPayPalWebhookSignature,
} from "../../../../server/payment/paypal-webhook-verifier.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse(body: { received?: boolean; error: string }, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number.isInteger(Number(declaredLength)) && Number(declaredLength) > MAX_PAYPAL_WEBHOOK_BODY_BYTES) {
    return jsonResponse({ error: "Webhook request is too large." }, 413);
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return jsonResponse({ error: "Webhook request could not be read." }, 400);
  }
  if (new TextEncoder().encode(body).byteLength > MAX_PAYPAL_WEBHOOK_BODY_BYTES) {
    return jsonResponse({ error: "Webhook request is too large." }, 413);
  }

  const headers = {
    transmissionId: request.headers.get("paypal-transmission-id"),
    transmissionTime: request.headers.get("paypal-transmission-time"),
    certificateUrl: request.headers.get("paypal-cert-url"),
    authAlgo: request.headers.get("paypal-auth-algo"),
    transmissionSignature: request.headers.get("paypal-transmission-sig"),
  };
  if (Object.values(headers).some((value) => !value)) {
    return jsonResponse({ error: "PayPal webhook headers are required." }, 400);
  }

  let webhookId: string;
  try {
    webhookId = requireServerEnv("PAYPAL_WEBHOOK_ID");
  } catch {
    return jsonResponse({ error: "PayPal webhook verification is unavailable." }, 503);
  }

  try {
    const certificatePem = await fetchPayPalCertificate(headers.certificateUrl!);
    const verified = verifyPayPalWebhookSignature({
      body,
      transmissionId: headers.transmissionId!,
      transmissionTime: headers.transmissionTime!,
      webhookId,
      transmissionSignature: headers.transmissionSignature!,
      certificatePem,
      authAlgo: headers.authAlgo!,
    });
    if (!verified) return jsonResponse({ error: "PayPal webhook signature verification failed." }, 400);
  } catch (error) {
    if (error instanceof PayPalWebhookVerificationError && error.retryable) {
      return jsonResponse({ error: "PayPal webhook verification is temporarily unavailable." }, 503);
    }
    return jsonResponse({ error: "PayPal webhook signature verification failed." }, 400);
  }

  try {
    JSON.parse(body);
  } catch {
    return jsonResponse({ error: "PayPal webhook body is malformed." }, 400);
  }

  try {
    const { processVerifiedPayPalEvent } = await import("../../../../server/payment/paypal-webhook-processor.ts");
    const result = await processVerifiedPayPalEvent(JSON.parse(body) as { id?: unknown; event_type?: unknown; create_time?: unknown; resource?: unknown });
    if (result === "DEAD_LETTER") return jsonResponse({ received: true, error: "" }, 200);
  } catch (error) {
    if (error instanceof Error && error.name === "RetryablePayPalWebhookError") {
      return jsonResponse({ error: "PayPal webhook processing will be retried." }, 503);
    }
    return jsonResponse({ error: "PayPal webhook processing is unavailable." }, 503);
  }

  return jsonResponse({ received: true, error: "" }, 200);
}
