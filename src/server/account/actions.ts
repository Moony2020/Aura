"use server";

import { revalidatePath } from "next/cache";

import { serializePublicError, type PublicError } from "@/lib/errors/serialize";

import { updateCurrentAccountProfile, type AccountProfile } from "./account-profile-service";

export type ProfileUpdateActionState =
  | { ok: true; profile: AccountProfile }
  | { ok: false; error: PublicError };

export async function updateProfileAction(
  _previousState: ProfileUpdateActionState | null,
  formData: FormData,
): Promise<ProfileUpdateActionState> {
  try {
    const profile = await updateCurrentAccountProfile(Object.fromEntries(formData));
    revalidatePath("/account");
    return { ok: true, profile };
  } catch (error) {
    return { ok: false, error: serializePublicError(error) };
  }
}
