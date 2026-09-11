import type { Metadata } from "next";

import { EmailVerificationExperience } from "@/components/auth/EmailVerificationExperience";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Confirm your AURA email address.",
  referrer: "no-referrer",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyEmailPage() {
  return <EmailVerificationExperience />;
}
