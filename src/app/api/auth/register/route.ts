import { NextResponse } from "next/server";

import { serializePublicError } from "@/lib/errors/serialize";
import { registerCustomer } from "@/server/auth/registration-service";
import { requestIp } from "@/server/auth/request-ip";
import { checkAuthRateLimit, normalizedEmailKey, rateLimitHeaders } from "@/server/auth/rate-limit-service";
import { sameOriginMutation, transportSecurityHeaders } from "@/server/auth/transport-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!sameOriginMutation(request)) return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 403, headers: transportSecurityHeaders });
    const body = await request.json(); const ip=requestIp(request); const il=ip?await checkAuthRateLimit("REGISTRATION_IP",ip):null; if(il&&!il.allowed)return NextResponse.json({ok:true,accepted:true,message:"If the details are valid, verification instructions will be sent."},{status:202,headers:rateLimitHeaders(il)}); const email=typeof body?.email === "string"?body.email:null; const el=email?await checkAuthRateLimit("REGISTRATION_EMAIL",normalizedEmailKey(email)):null; if(el&&!el.allowed)return NextResponse.json({ok:true,accepted:true,message:"If the details are valid, verification instructions will be sent."},{status:202,headers:rateLimitHeaders(el)}); const result = await registerCustomer(body, { verificationOrigin: new URL(request.url).origin });
    return NextResponse.json(result, { status: result.ok ? 202 : result.error.status, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: serializePublicError(error) }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}
