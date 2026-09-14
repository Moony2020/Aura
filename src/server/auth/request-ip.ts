import "server-only";
function first(value: string | null) { return value?.split(",", 1)[0]?.trim() || null; }
export function requestIp(request: Request): string | null {
  if (process.env.NODE_ENV !== "production") return first(request.headers.get("x-aura-test-ip"));
  return null;
}
export function serverActionRequestIp(headers: Headers): string | null {
  if (process.env.NODE_ENV !== "production") return first(headers.get("x-aura-test-ip"));
  return null;
}
