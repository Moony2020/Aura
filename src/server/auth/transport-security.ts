import "server-only";

export function safeRelativeCallback(value: unknown, fallback = "/login") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const parsed = new URL(value, "http://aura.local");
    return parsed.origin === "http://aura.local" ? value : fallback;
  } catch { return fallback; }
}

export function sameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export const transportSecurityHeaders = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
