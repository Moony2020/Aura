"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

type InspectionState = "READY" | "EXPIRED" | "USED" | "INVALID";
type ViewState = InspectionState | "INSPECTING" | "VERIFYING" | "SUCCESS" | "ERROR";

const stateCopy: Record<InspectionState, { eyebrow: string; title: string; message: string }> = {
  READY: {
    eyebrow: "A quiet welcome awaits",
    title: "Confirm your email",
    message: "Your AURA account is prepared. Confirm your email address to complete this first step.",
  },
  EXPIRED: {
    eyebrow: "The invitation has faded",
    title: "This link has expired",
    message: "For your security, verification links are time-limited. Request a fresh invitation below.",
  },
  USED: {
    eyebrow: "Already received",
    title: "This link has already been used",
    message: "The verification link cannot be used again. You may return to the Maison whenever you are ready.",
  },
  INVALID: {
    eyebrow: "A private passage",
    title: "This link is not available",
    message: "We could not verify this invitation. Please request a new verification email if you need one.",
  },
};

function isInspectionState(value: unknown): value is InspectionState {
  return value === "READY" || value === "EXPIRED" || value === "USED" || value === "INVALID";
}

function isSafeResponse(value: unknown): value is { ok: boolean; status?: string } {
  return typeof value === "object" && value !== null && "ok" in value && typeof value.ok === "boolean";
}

function ResendForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"IDLE" | "SENDING" | "SENT" | "ERROR">("IDLE");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("SENDING");

    try {
      const response = await fetch("/api/auth/verification/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        cache: "no-store",
      });
      const result: unknown = await response.json();
      setStatus(response.ok && isSafeResponse(result) && result.ok ? "SENT" : "ERROR");
    } catch {
      setStatus("ERROR");
    }
  }

  return (
    <form className="email-verification__resend" onSubmit={handleSubmit}>
      <label htmlFor="verification-resend-email">Email address</label>
      <div className="email-verification__resend-row">
        <input
          id="verification-resend-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          disabled={status === "SENDING"}
        />
        <button type="submit" disabled={status === "SENDING"}>
          {status === "SENDING" ? "Sending…" : "Resend email"}
        </button>
      </div>
      <p className="email-verification__resend-status" aria-live="polite">
        {status === "SENT" ? "If an eligible account exists, verification instructions are on their way." : null}
        {status === "ERROR" ? "We could not send that request. Please try again." : null}
      </p>
    </form>
  );
}

export function EmailVerificationExperience() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<ViewState>("INSPECTING");

  useEffect(() => {
    const urlToken = new URL(window.location.href).searchParams.get("token") ?? "";
    setToken(urlToken);
    if (!urlToken) {
      setState("INVALID");
      return;
    }
    const controller = new AbortController();

    fetch(`/api/auth/verification?token=${encodeURIComponent(urlToken)}`, {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("inspection-unavailable");
        const result: unknown = await response.json();
        const inspectedState = result && typeof result === "object" && "state" in result ? result.state : null;
        if (!isInspectionState(inspectedState)) {
          throw new Error("inspection-invalid");
        }
        setState(inspectedState);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState("ERROR");
      });

    return () => controller.abort();
  }, []);

  async function handleVerify() {
    if (state !== "READY") return;
    setState("VERIFYING");

    try {
      const response = await fetch("/api/auth/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      });
      const result: unknown = await response.json();
      if (!response.ok || !isSafeResponse(result) || !result.ok) {
        const resultStatus = result && typeof result === "object" && "status" in result && typeof result.status === "string"
          ? result.status
          : null;
        const nextState = isInspectionState(resultStatus)
          ? resultStatus
          : "ERROR";
        setState(nextState);
        return;
      }

      window.history.replaceState(window.history.state, "", window.location.pathname);
      setState("SUCCESS");
    } catch {
      setState("ERROR");
    }
  }

  const isReady = state === "READY";
  const copy = isInspectionState(state) ? stateCopy[state] : null;

  return (
    <div className="email-verification">
      <section className="email-verification__panel" aria-labelledby="email-verification-title">
        <p className="email-verification__eyebrow">{copy?.eyebrow ?? (state === "SUCCESS" ? "AURA Maison" : "Email verification")}</p>
        <h1 id="email-verification-title">
          {state === "INSPECTING" && "Preparing your invitation"}
          {state === "VERIFYING" && "Confirming your email"}
          {state === "SUCCESS" && "Your email is verified"}
          {state === "ERROR" && "We need another moment"}
          {copy?.title}
        </h1>

        <p className="email-verification__message" aria-live="polite">
          {state === "INSPECTING" && "We are checking this private invitation securely."}
          {state === "VERIFYING" && "Please wait while the Maison confirms your email."}
          {state === "SUCCESS" && "Your AURA account is now ready for the next chapter."}
          {state === "ERROR" && "Verification is temporarily unavailable. Please try again shortly."}
          {copy?.message}
        </p>

        <div className="email-verification__actions">
          {isReady && (
            <button type="button" className="email-verification__primary" onClick={handleVerify}>
              Verify email <span aria-hidden="true">→</span>
            </button>
          )}
          {state === "VERIFYING" && <span className="email-verification__pending" role="status">Verifying…</span>}
          {state === "EXPIRED" && <ResendForm />}
          {state === "ERROR" && (
            <button type="button" className="email-verification__primary" onClick={() => window.location.reload()}>
              Try again <span aria-hidden="true">→</span>
            </button>
          )}
          {(state === "SUCCESS" || state === "USED" || state === "INVALID") && (
            <Link className="email-verification__secondary" href="/">Return to Maison <span aria-hidden="true">→</span></Link>
          )}
        </div>
      </section>
    </div>
  );
}
