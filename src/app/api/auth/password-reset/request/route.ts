import { NextResponse } from "next/server";

import { requestPasswordReset } from "@/server/auth/password-reset-service";
import { serializePublicError } from "@/lib/errors/serialize";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const result = await requestPasswordReset(await request.json(), { resetOrigin: new URL(request.url).origin });
    return NextResponse.json(result, { status: result.ok ? 202 : result.error.status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: serializePublicError(error) }, { status: 500, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  }
}
