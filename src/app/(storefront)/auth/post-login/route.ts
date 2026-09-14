import { NextResponse } from "next/server";

import { getCurrentSessionAuthority } from "@/server/auth/current-session";
import { runPostLoginGuestMerge } from "@/server/auth/post-login-merge";
import { safeRelativeCallback, transportSecurityHeaders } from "@/server/auth/transport-security";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const callbackUrl = safeRelativeCallback(requestUrl.searchParams.get("callbackUrl"));
  const authority = await getCurrentSessionAuthority();

  if (!authority) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  await runPostLoginGuestMerge();
  const response = NextResponse.redirect(new URL(callbackUrl, request.url), { status: 303 });
  for (const [key, value] of Object.entries(transportSecurityHeaders)) response.headers.set(key, value);
  if (process.env.STAGE48_P2_TEST_INSTRUMENTATION === "1") {
    const state = globalThis as typeof globalThis & { __auraStage48P2HandoffCount?: number };
    state.__auraStage48P2HandoffCount = (state.__auraStage48P2HandoffCount ?? 0) + 1;
    response.headers.set("x-stage48-p2-merge-count", String(state.__auraStage48P2HandoffCount));
  }
  return response;
}
