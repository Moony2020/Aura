"use client";

import { useActionState, useEffect, useState } from "react";

import { updateProfileAction, type ProfileUpdateActionState } from "@/server/account/actions";
import type { AccountProfile } from "@/server/account/account-profile-service";

const initialState: ProfileUpdateActionState | null = null;

export function AccountProfileForm({ profile: initialProfile }: { profile: AccountProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  useEffect(() => setProfile(initialProfile), [initialProfile]);
  useEffect(() => {
    if (state?.ok) setProfile(state.profile);
  }, [state]);

  const statusMessage = state?.ok ? "Your profile has been saved." : state?.error.message ?? "";

  return (
    <section className="account-profile" aria-labelledby="profile-title">
      <p className="account-page__eyebrow">PROFILE</p>
      <h2 id="profile-title">Edit your details</h2>
      <p className="account-profile__intro">Your email is your Maison identity and cannot be changed here.</p>

      <form action={formAction} className="account-profile__form">
        <div className="account-profile__field account-profile__field--readonly">
          <label htmlFor="account-email">Email address</label>
          <input id="account-email" type="email" value={profile.email} readOnly aria-readonly="true" autoComplete="email" />
        </div>
        <div className="account-profile__field">
          <label htmlFor="account-first-name">First name</label>
          <input id="account-first-name" name="firstName" type="text" value={profile.firstName} onChange={(event) => setProfile({ ...profile, firstName: event.target.value })} autoComplete="given-name" required maxLength={120} aria-describedby="account-profile-message" />
        </div>
        <div className="account-profile__field">
          <label htmlFor="account-last-name">Last name</label>
          <input id="account-last-name" name="lastName" type="text" value={profile.lastName} onChange={(event) => setProfile({ ...profile, lastName: event.target.value })} autoComplete="family-name" required maxLength={120} aria-describedby="account-profile-message" />
        </div>
        <div className="account-profile__field">
          <label htmlFor="account-phone">Phone</label>
          <input id="account-phone" name="phone" type="tel" value={profile.phone ?? ""} onChange={(event) => setProfile({ ...profile, phone: event.target.value || null })} autoComplete="tel" maxLength={40} aria-describedby="account-profile-message" />
        </div>

        <p id="account-profile-message" className={state?.ok ? "account-profile__message account-profile__message--success" : "account-profile__message"} aria-live="polite" role={state?.ok ? "status" : undefined}>
          {statusMessage}
        </p>
        <button type="submit" disabled={pending} aria-disabled={pending}>
          {pending ? "Saving your profile…" : "Save profile"}
        </button>
      </form>
    </section>
  );
}
