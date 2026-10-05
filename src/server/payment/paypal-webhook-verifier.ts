import "server-only";

import { createVerify } from "node:crypto";

export const MAX_PAYPAL_WEBHOOK_BODY_BYTES = 128 * 1024;
export const PAYPAL_WEBHOOK_AUTH_ALGO = "SHA256withRSA";
const PAYPAL_CERT_HOSTS = new Set([
  "api.paypal.com",
  "api.sandbox.paypal.com",
  "api-m.paypal.com",
  "api-m.sandbox.paypal.com",
]);
const PAYPAL_CERT_PATH = /^\/v1\/notifications\/certs\/[A-Za-z0-9_-]+$/;

export class PayPalWebhookVerificationError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable = false) {
    super(message);
    this.retryable = retryable;
    this.name = "PayPalWebhookVerificationError";
  }
}

function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

export function validatePayPalCertificateUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new PayPalWebhookVerificationError("PayPal certificate URL is invalid.");
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    !PAYPAL_CERT_HOSTS.has(url.hostname) ||
    !PAYPAL_CERT_PATH.test(url.pathname) ||
    url.search ||
    url.hash
  ) {
    throw new PayPalWebhookVerificationError("PayPal certificate URL is not trusted.");
  }

  return url;
}

export function buildPayPalWebhookMessage(
  body: string,
  transmissionId: string,
  transmissionTime: string,
  webhookId: string,
): string {
  const checksum = crc32(new TextEncoder().encode(body));
  return `${transmissionId}|${transmissionTime}|${webhookId}|${checksum}`;
}

export function verifyPayPalWebhookSignature({
  body,
  transmissionId,
  transmissionTime,
  webhookId,
  transmissionSignature,
  certificatePem,
  authAlgo,
}: {
  body: string;
  transmissionId: string;
  transmissionTime: string;
  webhookId: string;
  transmissionSignature: string;
  certificatePem: string;
  authAlgo: string;
}): boolean {
  if (authAlgo !== PAYPAL_WEBHOOK_AUTH_ALGO) {
    throw new PayPalWebhookVerificationError("PayPal webhook algorithm is unsupported.");
  }

  let signature: Buffer;
  try {
    signature = Buffer.from(transmissionSignature, "base64");
  } catch {
    throw new PayPalWebhookVerificationError("PayPal webhook signature is malformed.");
  }
  if (!signature.length || !certificatePem.includes("PUBLIC KEY") && !certificatePem.includes("CERTIFICATE")) {
    throw new PayPalWebhookVerificationError("PayPal webhook signature material is invalid.");
  }

  const verifier = createVerify("RSA-SHA256");
  verifier.update(buildPayPalWebhookMessage(body, transmissionId, transmissionTime, webhookId), "utf8");
  verifier.end();
  return verifier.verify(certificatePem, signature);
}

export async function fetchPayPalCertificate(certificateUrl: string): Promise<string> {
  const url = validatePayPalCertificateUrl(certificateUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { redirect: "error", signal: controller.signal });
    if (!response.ok) {
      throw new PayPalWebhookVerificationError("PayPal certificate could not be fetched.", true);
    }
    const declaredLength = response.headers.get("content-length");
    if (declaredLength && Number(declaredLength) > 32 * 1024) {
      throw new PayPalWebhookVerificationError("PayPal certificate is too large.");
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 32 * 1024) {
      throw new PayPalWebhookVerificationError("PayPal certificate is too large.");
    }
    const certificatePem = new TextDecoder().decode(bytes);
    if (!certificatePem.includes("BEGIN CERTIFICATE")) {
      throw new PayPalWebhookVerificationError("PayPal certificate is invalid.");
    }
    return certificatePem;
  } catch (error) {
    if (error instanceof PayPalWebhookVerificationError) throw error;
    throw new PayPalWebhookVerificationError("PayPal certificate verification is unavailable.", true);
  } finally {
    clearTimeout(timeout);
  }
}
