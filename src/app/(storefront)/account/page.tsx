import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getAccountProfileForAuthority } from "@/server/account/account-profile-service";
import { getCurrentSessionAuthority } from "@/server/auth/current-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
  description: "View and update your AURA account profile.",
};

export default async function AccountPage() {
  const authority = await getCurrentSessionAuthority();
  if (!authority) redirect("/login?callbackUrl=%2Faccount");

  const profile = await getAccountProfileForAuthority(authority);

  return (
    <section className="account-page" aria-labelledby="account-title">
      <div className="account-page__hero">
        <p className="account-page__eyebrow">AURA PRIVATE ACCOUNT</p>
        <h1 id="account-title">Your Maison</h1>
        <p>Keep the personal details that guide your AURA experience beautifully current.</p>
      </div>

      <div className="account-page__content">
        <section className="account-page__identity" aria-labelledby="account-identity-title">
          <p className="account-page__eyebrow">ACCOUNT OVERVIEW</p>
          <h2 id="account-identity-title">Your private details</h2>
          <dl>
            <div><dt>Email</dt><dd>{profile.email}</dd></div>
            <div><dt>First name</dt><dd>{profile.firstName}</dd></div>
            <div><dt>Last name</dt><dd>{profile.lastName}</dd></div>
            <div><dt>Phone</dt><dd>{profile.phone ?? "Not provided"}</dd></div>
          </dl>
          <LogoutButton />
        </section>

        <AccountProfileForm profile={profile} />
      </div>
    </section>
  );
}
