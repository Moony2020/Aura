import { NextResponse } from "next/server";

import { requestPasswordReset } from "@/server/auth/password-reset-service";
import { serializePublicError } from "@/lib/errors/serialize";
import { requestIp } from "@/server/auth/request-ip";
import { checkAuthRateLimit, normalizedEmailKey, rateLimitHeaders } from "@/server/auth/rate-limit-service";
import { sameOriginMutation, transportSecurityHeaders } from "@/server/auth/transport-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!sameOriginMutation(request)) return NextResponse.json({ ok: true, accepted: true, message: "If the details are valid, reset instructions will be sent." }, { status: 202, headers: transportSecurityHeaders });
    const body=await request.json(); const ip=requestIp(request); const il=ip?await checkAuthRateLimit("FORGOT_PASSWORD_IP",ip):null; const email=typeof body?.email === "string"?body.email:null; const el=email?await checkAuthRateLimit("FORGOT_PASSWORD_EMAIL",normalizedEmailKey(email)):null; if((il&&!il.allowed)||(el&&!el.allowed))return NextResponse.json({ok:true,accepted:true,message:"If the details are valid, reset instructions will be sent."},{status:202,headers:rateLimitHeaders((il&&!il.allowed?il:el)!)}); const result = await requestPasswordReset(body, { resetOrigin: new URL(request.url).origin });
    return NextResponse.json(result, { status: result.ok ? 202 : result.error.status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: serializePublicError(error) }, { status: 500, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  }
}
