"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { loginAction, type LoginActionState } from "@/server/auth/actions";

const initialState: LoginActionState = null;

export function LoginForm({ callbackUrl = "/login" }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="auth-form__password-wrapper">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={128}
            aria-describedby={state ? "login-message" : undefined}
          />
          <button
            type="button"
            className="auth-form__password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
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
