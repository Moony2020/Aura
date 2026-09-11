import { NextResponse } from "next/server.js";
import { z } from "zod";

import { inspectEmailVerificationToken, verifyEmailToken } from "../../../../server/auth/verification-service.ts";

export const runtime = "nodejs";

const verificationRequestSchema = z.object({ token: z.string().min(1).max(512) }).strict();
const transportHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: transportHeaders });
}

export async function GET(request: Request) {
  const rawToken = new URL(request.url).searchParams.get("token");
  const state = await inspectEmailVerificationToken(rawToken ?? "");
  return json({ state });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, status: "INVALID" }, 400);
  }

  const parsed = verificationRequestSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, status: "INVALID" }, 400);

  try {
    const result = await verifyEmailToken(parsed.data.token);
    if (result.ok && (result.status === "VERIFIED" || result.status === "ALREADY_ACTIVE")) {
      return json({ ok: true, status: "VERIFIED" });
    }
    if (!result.ok) return json({ ok: false, status: result.status }, 400);
    return json({ ok: false, status: "INVALID" }, 400);
  } catch {
    return json({ ok: false, status: "INVALID" }, 400);
  }
}
