import type { Metadata } from "next";

import { PasswordResetForm } from "@/components/auth/PasswordResetForm";

export const metadata: Metadata = { title: "Reset password", description: "Set a new private AURA password." };

export default function ResetPasswordPage() {
  return <PasswordResetForm />;
}
