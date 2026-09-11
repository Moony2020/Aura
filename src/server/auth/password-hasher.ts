import "server-only";

import { argon2id, hash, needsRehash, verify } from "argon2";
import { AUTH_PASSWORD_HASH_VERSION } from "../../domain/auth/auth-credentials.schema.ts";

export const ARGON2ID_POLICY = Object.freeze({
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  type: argon2id,
});

export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password must be a non-empty string.");
  }

  return hash(password, ARGON2ID_POLICY);
}

export async function verifyPasswordHash(passwordHash: string, password: string): Promise<boolean> {
  if (typeof passwordHash !== "string" || typeof password !== "string") return false;
  return verify(passwordHash, password);
}

export function passwordHashNeedsRehash(passwordHash: string): boolean {
  return needsRehash(passwordHash, ARGON2ID_POLICY);
}

export const passwordHashVersion = AUTH_PASSWORD_HASH_VERSION;
