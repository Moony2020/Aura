"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"IDLE" | "SENDING" | "SENT" | "ERROR">("IDLE");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("SENDING");
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        cache: "no-store",
      });
      const result: unknown = await response.json();
      setState(response.ok && result && typeof result === "object" && "ok" in result && result.ok === true ? "SENT" : "ERROR");
    } catch {
      setState("ERROR");
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-form__field">
          <label htmlFor="password-reset-email">Email address</label>
          <input id="password-reset-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={state === "SENDING"} />
        </div>
        <p className="auth-form__message" aria-live="polite">
          {state === "SENT" ? "If an eligible account exists, reset instructions are on their way." : null}
          {state === "ERROR" ? "We could not process that request. Please try again." : null}
        </p>
        <button className="auth-form__submit" type="submit" disabled={state === "SENDING"}>{state === "SENDING" ? "Sending…" : "Send reset link"}</button>
      </form>
      <Link className="auth-form__back-link" href="/login">
        <ArrowLeft className="w-4 h-4" />
        <span>Return to sign in</span>
      </Link>
    </>
  );
}
