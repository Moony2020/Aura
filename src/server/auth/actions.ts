"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { signIn, signOut } from "../../../auth.ts";
import { authRateLimitExceeded, checkAuthRateLimit, normalizedEmailKey } from "./rate-limit-service.ts";
import { serverActionRequestIp } from "./request-ip.ts";
import { safeRelativeCallback } from "./transport-security.ts";

export type LoginActionState = {
  ok: false;
  message: string;
} | null;

const INVALID_LOGIN_MESSAGE = "We could not sign you in with those details.";

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")) : "";
  const ip = serverActionRequestIp(await headers());
  try {
    const callbackUrl = safeRelativeCallback(formData.get("callbackUrl"));
    if ((ip && await authRateLimitExceeded("LOGIN_IP", ip)) || (email && await authRateLimitExceeded("LOGIN_ACCOUNT", normalizedEmailKey(email)))) return { ok: false, message: INVALID_LOGIN_MESSAGE };
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
      redirectTo: callbackUrl,
    });
    if (typeof result === "string" && new URL(result).searchParams.has("error")) {
      await Promise.all([ip ? checkAuthRateLimit("LOGIN_IP", ip) : Promise.resolve(), email ? checkAuthRateLimit("LOGIN_ACCOUNT", normalizedEmailKey(email)) : Promise.resolve()]);
      return { ok: false, message: INVALID_LOGIN_MESSAGE };
    }
    redirect(`/auth/post-login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  } catch (error) {
    if (error instanceof AuthError) {
      await Promise.all([ip ? checkAuthRateLimit("LOGIN_IP", ip) : Promise.resolve(), email ? checkAuthRateLimit("LOGIN_ACCOUNT", normalizedEmailKey(email)) : Promise.resolve()]);
      return { ok: false, message: INVALID_LOGIN_MESSAGE };
    }
    throw error;
  }

  return null;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
