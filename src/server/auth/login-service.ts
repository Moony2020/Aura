import "server-only";

import { loginInputSchema } from "../../domain/auth/login.schema.ts";
import { normalizeEmail } from "../../domain/user/user.schema.ts";
import type { AuthCredentialsRepository } from "../repositories/auth-credentials-repository.ts";
import { MongoAuthCredentialsRepository } from "../repositories/mongo-auth-credentials-repository.ts";
import type { UserRepository } from "../repositories/user-repository.ts";
import { MongoUserRepository } from "../repositories/mongo-user-repository.ts";
import { verifyPasswordHash } from "./password-hasher.ts";

type LoginRepositories = {
  users: UserRepository;
  credentials: AuthCredentialsRepository;
};

const mongoRepositories = (): LoginRepositories => ({
  users: new MongoUserRepository(),
  credentials: new MongoAuthCredentialsRepository(),
});

export type LoginOptions = {
  repositories?: LoginRepositories;
};

export type AuthenticatedIdentity = {
  id: string;
};

export async function authenticateCredentials(
  input: unknown,
  options: LoginOptions = {},
): Promise<AuthenticatedIdentity | null> {
  const parsed = loginInputSchema.safeParse(input);
  if (!parsed.success) return null;

  const repositories = options.repositories ?? mongoRepositories();
  const user = await repositories.users.findByNormalizedEmail(normalizeEmail(parsed.data.email));

  if (!user || user.status !== "ACTIVE" || user.emailVerifiedAt === null) return null;

  const credentials = await repositories.credentials.findByUserId(user.id);
  if (!credentials) return null;

  try {
    if (!await verifyPasswordHash(credentials.passwordHash, parsed.data.password)) return null;
  } catch {
    return null;
  }

  return { id: user.id };
}
