import { NextResponse } from "next/server";

import { passwordResetInputSchema } from "@/domain/auth/password-reset.schema";
import { inspectPasswordResetToken, resetPassword } from "@/server/auth/password-reset-service";
import { requestIp } from "@/server/auth/request-ip";
import { checkAuthRateLimit, rateLimitHeaders } from "@/server/auth/rate-limit-service";
import { sameOriginMutation, transportSecurityHeaders } from "@/server/auth/transport-security";

export const runtime = "nodejs";

const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  return json({ state: await inspectPasswordResetToken(token) });
}

export async function POST(request: Request) {
  if (!sameOriginMutation(request)) return json({ ok: false, status: "INVALID" }, 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, status: "INVALID" }, 400);
  }

  const parsed = passwordResetInputSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, status: "INVALID" }, 400);

  try {
    const ip=requestIp(request); const il=ip?await checkAuthRateLimit("PASSWORD_RESET_IP",ip):null; const tl=await checkAuthRateLimit("PASSWORD_RESET_TOKEN",parsed.data.token); if((il&&!il.allowed)||!tl.allowed)return NextResponse.json({ok:false,status:"INVALID"},{status:400,headers:rateLimitHeaders((il&&!il.allowed?il:tl))});
    const result = await resetPassword(parsed.data);
    return json(result, result.ok ? 200 : 400);
  } catch {
    return json({ ok: false, status: "INVALID" }, 400);
  }
}
