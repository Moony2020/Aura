import "server-only";

import { userProfileUpdateSchema } from "@/domain/user/user.schema";
import { ownershipError } from "@/lib/errors/aura-error";
import { requireCurrentSessionAuthority } from "@/server/auth/current-session";
import type { SessionAuthority } from "@/server/auth/session-authority";
import { MongoUserRepository } from "@/server/repositories/mongo-user-repository";
import type { UserRepository } from "@/server/repositories/user-repository";

export type AccountProfile = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
};

type AccountRepositories = {
  users: UserRepository;
};

const mongoRepositories = (): AccountRepositories => ({ users: new MongoUserRepository() });

function toAccountProfile(user: SessionAuthority["user"]): AccountProfile {
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? null,
  };
}

async function loadCanonicalAccount(
  authority: SessionAuthority | null,
  repositories: AccountRepositories,
) {
  if (!authority) throw ownershipError();

  const user = await repositories.users.findById(authority.user.id);
  if (!user || user.status !== "ACTIVE" || user.emailVerifiedAt === null) throw ownershipError();

  return user;
}

export async function getAccountProfileForAuthority(
  authority: SessionAuthority | null,
  options: { repositories?: AccountRepositories } = {},
): Promise<AccountProfile> {
  return toAccountProfile(await loadCanonicalAccount(authority, options.repositories ?? mongoRepositories()));
}

export async function updateAccountProfileForAuthority(
  authority: SessionAuthority | null,
  input: unknown,
  options: { repositories?: AccountRepositories } = {},
): Promise<AccountProfile> {
  const profile = userProfileUpdateSchema.parse(input);
  const repositories = options.repositories ?? mongoRepositories();
  const user = await loadCanonicalAccount(authority, repositories);

  await repositories.users.updateProfile(user.id, profile);
  return toAccountProfile(await loadCanonicalAccount(authority, repositories));
}

export async function getCurrentAccountProfile(): Promise<AccountProfile> {
  return getAccountProfileForAuthority(await requireCurrentSessionAuthority());
}

export async function updateCurrentAccountProfile(input: unknown): Promise<AccountProfile> {
  return updateAccountProfileForAuthority(await requireCurrentSessionAuthority(), input);
}
