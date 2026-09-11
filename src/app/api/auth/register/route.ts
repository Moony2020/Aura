import { NextResponse } from "next/server";

import { serializePublicError } from "@/lib/errors/serialize";
import { registerCustomer } from "@/server/auth/registration-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const result = await registerCustomer(await request.json(), { verificationOrigin: new URL(request.url).origin });
    return NextResponse.json(result, { status: result.ok ? 202 : result.error.status, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: serializePublicError(error) }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}
