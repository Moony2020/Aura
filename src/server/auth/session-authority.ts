import "server-only";

import type { JWT } from "next-auth/jwt";

import type { AuthCredentials } from "../../domain/auth/auth-credentials.schema.ts";
import type { User } from "../../domain/user/user.schema.ts";
import { MongoAuthCredentialsRepository } from "../repositories/mongo-auth-credentials-repository.ts";
import { MongoUserRepository } from "../repositories/mongo-user-repository.ts";

export type SessionAuthority = {
  user: User;
  credentials: AuthCredentials;
};

type SessionTokenInput = Pick<JWT, "sub" | "sessionVersion">;

const repositories = {
  users: new MongoUserRepository(),
  credentials: new MongoAuthCredentialsRepository(),
};

function isValidUserId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

export async function loadUserSessionAuthority(userId: string): Promise<SessionAuthority | null> {
  if (!isValidUserId(userId)) return null;

  const [user, credentials] = await Promise.all([
    repositories.users.findById(userId),
    repositories.credentials.findByUserId(userId),
  ]);

  if (!user || !credentials) return null;
  if (user.status !== "ACTIVE" || user.emailVerifiedAt === null) return null;

  return { user, credentials };
}

export async function validateSessionToken(token: SessionTokenInput): Promise<SessionAuthority | null> {
  const sessionVersion = token.sessionVersion;
  if (!isValidUserId(token.sub) || typeof sessionVersion !== "number" || !Number.isInteger(sessionVersion) || sessionVersion < 0) return null;

  const authority = await loadUserSessionAuthority(token.sub);
  if (!authority || authority.credentials.sessionVersion !== sessionVersion) return null;

  return authority;
}
