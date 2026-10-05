import "server-only";

import { requireServerEnv } from "@/config/env.server";

const PAYPAL_SANDBOX_API_BASE_URL = "https://api-m.sandbox.paypal.com";
const PAYPAL_OAUTH_PATH = "/v1/oauth2/token";
const PAYPAL_ORDERS_PATH = "/v2/checkout/orders";

type PayPalTokenResponse = {
  access_token?: unknown;
  expires_in?: unknown;
  token_type?: unknown;
};

export type PayPalAccessToken = {
  value: string;
  expiresInSeconds: number;
  tokenType: "Bearer";
};

export type PayPalOrder = {
  id: string;
  status: string;
  intent: "CAPTURE";
  purchaseUnits: Array<{ amount: { currencyCode: "SEK"; value: string }; customId: string; captures?: Array<{ id: string; status: string; amount: { currencyCode: "SEK"; value: string } }> }>;
};

export type PayPalShippingDetails = {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  countryCode: string;
};

export class PayPalConfigurationError extends Error {
  constructor() {
    super("PayPal Sandbox configuration is unavailable.");
    this.name = "PayPalConfigurationError";
  }
}

export class PayPalAuthenticationError extends Error {
  constructor() {
    super("PayPal Sandbox authentication failed.");
    this.name = "PayPalAuthenticationError";
  }
}

export class PayPalOrderCreationError extends Error {
  readonly status: number;

  constructor(status: number) {
    super("PayPal Sandbox order creation failed.");
    this.name = "PayPalOrderCreationError";
    this.status = status;
  }
}

export class PayPalOrderRetrievalError extends Error {
  constructor() { super("PayPal Sandbox order retrieval failed."); this.name = "PayPalOrderRetrievalError"; }
}

export class PayPalCaptureError extends Error {
  readonly status: number;
  constructor(status: number) { super("PayPal Sandbox capture failed."); this.name = "PayPalCaptureError"; this.status = status; }
}

function readTokenResponse(payload: PayPalTokenResponse): PayPalAccessToken {
  const value = typeof payload.access_token === "string" ? payload.access_token : "";
  const expiresInSeconds = typeof payload.expires_in === "number" ? payload.expires_in : 0;
  const tokenType = payload.token_type === "Bearer" ? "Bearer" : null;

  if (!value || !Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0 || !tokenType) {
    throw new PayPalAuthenticationError();
  }

  return { value, expiresInSeconds, tokenType };
}

/**
 * Server-only P1 boundary. The sandbox host is fixed intentionally so a
 * missing or malformed deployment setting cannot silently target live PayPal.
 */
export async function acquirePayPalSandboxAccessToken(): Promise<PayPalAccessToken> {
  let clientId: string;
  let clientSecret: string;

  try {
    clientId = requireServerEnv("PAYPAL_CLIENT_ID");
    clientSecret = requireServerEnv("PAYPAL_CLIENT_SECRET");
  } catch {
    throw new PayPalConfigurationError();
  }

  const authorization = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
  let response: Response;

  try {
    response = await fetch(`${PAYPAL_SANDBOX_API_BASE_URL}${PAYPAL_OAUTH_PATH}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
  } catch {
    throw new PayPalAuthenticationError();
  }

  if (!response.ok) {
    throw new PayPalAuthenticationError();
  }

  let payload: PayPalTokenResponse;
  try {
    payload = (await response.json()) as PayPalTokenResponse;
  } catch {
    throw new PayPalAuthenticationError();
  }

  return readTokenResponse(payload);
}

function paypalValue(amountMinor: number): string {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error("Invalid PayPal amount.");
  return (amountMinor / 100).toFixed(2);
}

export async function createPayPalSandboxOrder(input: {
  amountMinor: number;
  paymentAttemptId: string;
  requestId: string;
  shipping: PayPalShippingDetails;
}): Promise<PayPalOrder> {
  const token = await acquirePayPalSandboxAccessToken();
  const response = await fetch(`${PAYPAL_SANDBOX_API_BASE_URL}${PAYPAL_ORDERS_PATH}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token.value}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": input.requestId,
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: "SEK", value: paypalValue(input.amountMinor) },
        custom_id: input.paymentAttemptId,
        shipping: {
          name: { full_name: input.shipping.fullName },
          address: {
            address_line_1: input.shipping.addressLine1,
            ...(input.shipping.addressLine2 ? { address_line_2: input.shipping.addressLine2 } : {}),
            admin_area_2: input.shipping.city,
            postal_code: input.shipping.postalCode,
            country_code: input.shipping.countryCode,
          },
        },
      }],
      application_context: { shipping_preference: "SET_PROVIDED_ADDRESS" },
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new PayPalOrderCreationError(response.status);
  const payload = (await response.json()) as { id?: unknown; status?: unknown; intent?: unknown };
  if (typeof payload.id !== "string" || typeof payload.status !== "string" || (payload.intent !== undefined && payload.intent !== "CAPTURE")) throw new Error("PayPal Sandbox returned an invalid order.");
  return { id: payload.id, status: payload.status, intent: "CAPTURE", purchaseUnits: [{ amount: { currencyCode: "SEK", value: paypalValue(input.amountMinor) }, customId: input.paymentAttemptId }] };
}

export async function retrievePayPalSandboxOrder(orderId: string): Promise<PayPalOrder> {
  const token = await acquirePayPalSandboxAccessToken();
  let response: Response;
  try { response = await fetch(`${PAYPAL_SANDBOX_API_BASE_URL}${PAYPAL_ORDERS_PATH}/${encodeURIComponent(orderId)}`, { headers: { Accept: "application/json", Authorization: `Bearer ${token.value}` }, cache: "no-store" }); } catch { throw new PayPalOrderRetrievalError(); }
  if (!response.ok) throw new PayPalOrderRetrievalError();
  const payload = (await response.json()) as { id?: unknown; status?: unknown; intent?: unknown; purchase_units?: Array<{ custom_id?: unknown; amount?: { currency_code?: unknown; value?: unknown }; payments?: { captures?: Array<{ id?: unknown; status?: unknown; amount?: { currency_code?: unknown; value?: unknown } }> } }> };
  if (typeof payload.id !== "string" || typeof payload.status !== "string" || payload.intent !== "CAPTURE" || !payload.purchase_units?.length) throw new PayPalOrderRetrievalError();
  if (payload.purchase_units.some((unit) => unit.amount?.currency_code !== "SEK" || typeof unit.amount.value !== "string")) throw new PayPalOrderRetrievalError();
  return { id: payload.id, status: payload.status, intent: "CAPTURE", purchaseUnits: payload.purchase_units.map((unit) => ({
    amount: { currencyCode: "SEK", value: unit.amount!.value as string },
    customId: typeof unit.custom_id === "string" ? unit.custom_id : "",
    captures: unit.payments?.captures?.flatMap((capture) => {
      if (typeof capture.id !== "string" || typeof capture.status !== "string" || capture.amount?.currency_code !== "SEK" || typeof capture.amount.value !== "string") return [];
      return [{ id: capture.id, status: capture.status, amount: { currencyCode: "SEK" as const, value: capture.amount.value } }];
    }),
  })) };
}

export async function capturePayPalSandboxOrder(input: { orderId: string; requestId: string }): Promise<{ orderId: string; status: string; captureId: string; amount: { currencyCode: "SEK"; value: string } }> {
  const token = await acquirePayPalSandboxAccessToken();
  let response: Response;
  try {
    response = await fetch(`${PAYPAL_SANDBOX_API_BASE_URL}${PAYPAL_ORDERS_PATH}/${encodeURIComponent(input.orderId)}/capture`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token.value}`, "Content-Type": "application/json", "PayPal-Request-Id": input.requestId, Prefer: "return=representation" },
      body: "{}",
      cache: "no-store",
    });
  } catch { throw new PayPalCaptureError(0); }
  if (!response.ok) throw new PayPalCaptureError(response.status);
  const payload = (await response.json()) as { id?: unknown; status?: unknown; purchase_units?: Array<{ payments?: { captures?: Array<{ id?: unknown; status?: unknown; amount?: { currency_code?: unknown; value?: unknown } }> } }> };
  const capture = payload.purchase_units?.[0]?.payments?.captures?.[0];
  if (typeof payload.id !== "string" || payload.status !== "COMPLETED" || typeof capture?.id !== "string" || typeof capture.status !== "string" || capture.status !== "COMPLETED" || capture.amount?.currency_code !== "SEK" || typeof capture.amount.value !== "string") throw new PayPalCaptureError(200);
  return { orderId: payload.id, status: payload.status, captureId: capture.id, amount: { currencyCode: "SEK", value: capture.amount.value } };
}

export function getPayPalBrowserClientId(): string {
  try { return requireServerEnv("PAYPAL_CLIENT_ID"); } catch { throw new PayPalConfigurationError(); }
}

export function getPayPalSandboxApiBaseUrl(): string {
  return PAYPAL_SANDBOX_API_BASE_URL;
}
