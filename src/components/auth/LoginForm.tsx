"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginActionState } from "@/server/auth/actions";

const initialState: LoginActionState = null;

export function LoginForm({ callbackUrl = "/login" }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form className="auth-form" action={formAction}>
      <input name="callbackUrl" type="hidden" value={callbackUrl} />
      <div className="auth-form__field">
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          aria-describedby={state ? "login-message" : undefined}
        />
      </div>

      <div className="auth-form__field">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          aria-describedby={state ? "login-message" : undefined}
        />
      </div>

      <p id="login-message" className="auth-form__message" aria-live="polite">
        {state?.message ?? ""}
      </p>

      <button className="auth-form__submit" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <Link className="auth-form__link" href="/forgot-password">Forgot your password?</Link>
    </form>
  );
}
