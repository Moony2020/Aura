"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

type TokenState = "READY" | "EXPIRED" | "USED" | "INVALID";
type ViewState = TokenState | "INSPECTING" | "RESETTING" | "SUCCESS" | "ERROR";

const copy: Record<TokenState, { title: string; message: string }> = {
  READY: { title: "Choose a new password", message: "Create a new private key for your AURA account." },
  EXPIRED: { title: "This link has expired", message: "Request a fresh password reset link to continue." },
  USED: { title: "This link has already been used", message: "For your security, each reset link works only once." },
  INVALID: { title: "This link is not available", message: "Request a new password reset link to continue." },
};

function isTokenState(value: unknown): value is TokenState {
  return value === "READY" || value === "EXPIRED" || value === "USED" || value === "INVALID";
}

export function PasswordResetForm() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<ViewState>("INSPECTING");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const rawToken = new URL(window.location.href).searchParams.get("token") ?? "";
    setToken(rawToken);
    if (!rawToken) { setState("INVALID"); return; }
    const controller = new AbortController();
    fetch(`/api/auth/password-reset?token=${encodeURIComponent(rawToken)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("inspection-unavailable");
        const result: unknown = await response.json();
        const nextState = result && typeof result === "object" && "state" in result ? result.state : null;
        if (!isTokenState(nextState)) throw new Error("inspection-invalid");
        setState(nextState);
      })
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setState("ERROR"); });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state !== "READY") return;
    setState("RESETTING");
    try {
      const response = await fetch("/api/auth/password-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password, passwordConfirmation: confirmation }), cache: "no-store" });
      const result: unknown = await response.json();
      if (response.ok && result && typeof result === "object" && "ok" in result && result.ok === true) { window.history.replaceState(window.history.state, "", window.location.pathname); setState("SUCCESS"); return; }
      const nextState = result && typeof result === "object" && "status" in result && isTokenState(result.status) ? result.status : "ERROR";
      setState(nextState);
    } catch { setState("ERROR"); }
  }

  if (state === "SUCCESS") return <section className="auth-page" aria-labelledby="password-reset-title"><div className="auth-page__panel"><p className="auth-page__eyebrow">AURA PRIVATE ACCESS</p><h1 id="password-reset-title">Your password is updated</h1><p className="auth-page__intro">Your previous sessions have been revoked. Sign in again with your new password.</p><Link className="auth-form__back-link" href="/login"><ArrowLeft className="w-4 h-4" /><span>Return to sign in</span></Link></div></section>;
  if (state === "ERROR") return <section className="auth-page" aria-labelledby="password-reset-title"><div className="auth-page__panel"><p className="auth-page__eyebrow">AURA PRIVATE ACCESS</p><h1 id="password-reset-title">We need another moment</h1><p className="auth-page__intro">Password reset is temporarily unavailable. Please request a new link.</p><Link className="auth-form__secondary" href="/forgot-password">Request a new link</Link></div></section>;
  if (state !== "READY" && isTokenState(state)) return <section className="auth-page" aria-labelledby="password-reset-title"><div className="auth-page__panel"><p className="auth-page__eyebrow">AURA PRIVATE ACCESS</p><h1 id="password-reset-title">{copy[state].title}</h1><p className="auth-page__intro">{copy[state].message}</p><Link className="auth-form__secondary" href="/forgot-password">Request a new link</Link></div></section>;

  return (
    <section className="auth-page" aria-labelledby="password-reset-title">
      <div className="auth-page__panel">
        <p className="auth-page__eyebrow">AURA PRIVATE ACCESS</p>
        <h1 id="password-reset-title">
          {state === "INSPECTING" ? "Preparing your private link" : "Choose a new password"}
        </h1>
        {state === "INSPECTING" ? (
          <p className="auth-page__intro" aria-live="polite">
            We are checking this private link securely.
          </p>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <div className="auth-form__field">
              <label htmlFor="reset-password">New password</label>
              <div className="auth-form__password-wrapper">
                <input
                  id="reset-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

            <div className="auth-form__field">
              <label htmlFor="reset-password-confirmation">Confirm new password</label>
              <div className="auth-form__password-wrapper">
                <input
                  id="reset-password-confirmation"
                  name="passwordConfirmation"
                  type={showConfirmation ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
                <button
                  type="button"
                  className="auth-form__password-toggle"
                  onClick={() => setShowConfirmation((prev) => !prev)}
                  aria-label={showConfirmation ? "Hide password" : "Show password"}
                  title={showConfirmation ? "Hide password" : "Show password"}
                >
                  {showConfirmation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="auth-form__message" aria-live="polite">
              {state === "RESETTING" ? "Updating your password securely…" : ""}
            </p>
            <button className="auth-form__submit" type="submit" disabled={state === "RESETTING"}>
              {state === "RESETTING" ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
