import "server-only";

import { auth } from "../../../auth.ts";
import { loadUserSessionAuthority, type SessionAuthority } from "./session-authority.ts";

export async function getCurrentSessionAuthority(): Promise<SessionAuthority | null> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    return userId ? loadUserSessionAuthority(userId) : null;
  } catch {
    return null;
  }
}

export async function requireCurrentSessionAuthority(): Promise<SessionAuthority> {
  const authority = await getCurrentSessionAuthority();
  if (!authority) throw new Error("Unauthenticated server request");
  return authority;
}
