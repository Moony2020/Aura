import { NextResponse } from "next/server";

import { passwordResetInputSchema } from "@/domain/auth/password-reset.schema";
import { inspectPasswordResetToken, resetPassword } from "@/server/auth/password-reset-service";

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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, status: "INVALID" }, 400);
  }

  const parsed = passwordResetInputSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, status: "INVALID" }, 400);

  try {
    const result = await resetPassword(parsed.data);
    return json(result, result.ok ? 200 : 400);
  } catch {
    return json({ ok: false, status: "INVALID" }, 400);
  }
}
