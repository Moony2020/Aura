import type { Metadata } from "next";

import { PasswordResetRequestForm } from "@/components/auth/PasswordResetRequestForm";

export const metadata: Metadata = { title: "Forgot password", description: "Request a private AURA password reset link." };

export default function ForgotPasswordPage() {
  return <section className="auth-page" aria-labelledby="forgot-password-title"><div className="auth-page__panel"><p className="auth-page__eyebrow">AURA PRIVATE ACCESS</p><h1 id="forgot-password-title">Forgot your password?</h1><p className="auth-page__intro">Enter your email and we will guide you back to the Maison if an eligible account exists.</p><PasswordResetRequestForm /></div></section>;
}
