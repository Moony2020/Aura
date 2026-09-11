import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentSessionAuthority } from "@/server/auth/current-session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your AURA account.",
};

function safeCallbackUrl(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/login";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const authority = await getCurrentSessionAuthority();
  const { callbackUrl } = await searchParams;

  return (
    <section className="auth-page" aria-labelledby="login-title">
      <div className="auth-page__panel">
        <p className="auth-page__eyebrow">AURA PRIVATE ACCESS</p>
        <h1 id="login-title">Welcome back</h1>

        {authority ? (
          <div className="auth-page__signed-in">
            <p>You are signed in to your AURA account.</p>
            <LogoutButton />
          </div>
        ) : (
          <>
            <p className="auth-page__intro">Enter your details to continue your Maison journey.</p>
            <LoginForm callbackUrl={safeCallbackUrl(callbackUrl)} />
          </>
        )}
      </div>
    </section>
  );
}
