"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "../../../auth.ts";

export type LoginActionState = {
  ok: false;
  message: string;
} | null;

const INVALID_LOGIN_MESSAGE = "We could not sign you in with those details.";

function safeCallbackUrl(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/login";
  return value;
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: INVALID_LOGIN_MESSAGE };
    }
    throw error;
  }

  return null;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
