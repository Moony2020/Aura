import "server-only";

import type { AuthToken } from "../../domain/auth/auth-token.schema.ts";
import { emailVerificationPurpose } from "../../domain/auth/auth-token.schema.ts";
import { mongoClientPromise } from "../db/mongodb.ts";
import { MongoAuthTokenRepository } from "../repositories/mongo-auth-token-repository.ts";
import type { AuthTokenRepository } from "../repositories/auth-token-repository.ts";
import { MongoUserRepository } from "../repositories/mongo-user-repository.ts";
import type { UserRepository } from "../repositories/user-repository.ts";
import { hashAuthToken } from "./verification-token.ts";

export type VerificationTokenState = "READY" | "EXPIRED" | "USED" | "INVALID";

export type EmailVerificationResult =
  | { ok: true; status: "VERIFIED"; userId: string; emailVerifiedAt: Date }
  | { ok: true; status: "ALREADY_ACTIVE" | "DISABLED" }
  | { ok: false; status: "INVALID" | "EXPIRED" | "USED" };

type VerificationRepositories = {
  users: UserRepository;
  tokens: AuthTokenRepository;
};

const mongoRepositories = (): VerificationRepositories => ({
  users: new MongoUserRepository(),
  tokens: new MongoAuthTokenRepository(),
});

export type VerificationOptions = {
  repositories?: VerificationRepositories;
  now?: Date;
};

export function classifyEmailVerificationToken(token: Pick<AuthToken, "purpose" | "expiresAt" | "consumedAt">, now: Date): VerificationTokenState {
  if (token.purpose !== emailVerificationPurpose) return "INVALID";
  if (token.consumedAt !== null) return "USED";
  if (token.expiresAt <= now) return "EXPIRED";
  return "READY";
}

export async function inspectEmailVerificationToken(rawToken: string, options: VerificationOptions = {}): Promise<VerificationTokenState> {
  if (typeof rawToken !== "string" || rawToken.length === 0 || rawToken.length > 512) return "INVALID";
  const repositories = options.repositories ?? mongoRepositories();
  const now = options.now ?? new Date();
  const token = await repositories.tokens.findByHashAndPurpose(hashAuthToken(rawToken), emailVerificationPurpose);
  return token ? classifyEmailVerificationToken(token, now) : "INVALID";
}

function invalidResult(state: VerificationTokenState): EmailVerificationResult {
  if (state === "EXPIRED" || state === "USED") return { ok: false, status: state };
  return { ok: false, status: "INVALID" };
}

export async function verifyEmailToken(rawToken: string, options: VerificationOptions = {}): Promise<EmailVerificationResult> {
  const repositories = options.repositories ?? mongoRepositories();
  const now = options.now ?? new Date();
  const tokenHash = hashAuthToken(rawToken);
  const session = (await mongoClientPromise).startSession();
  let outcome: EmailVerificationResult | null = null;

  try {
    await session.withTransaction(async () => {
      const token = await repositories.tokens.consumeByHashAndPurpose(tokenHash, emailVerificationPurpose, now, session);
      if (!token) {
        const existing = await repositories.tokens.findByHashAndPurpose(tokenHash, emailVerificationPurpose, session);
        outcome = invalidResult(existing ? classifyEmailVerificationToken(existing, now) : "INVALID");
        return;
      }

      const user = await repositories.users.findById(token.userId, session);
      if (!user) throw new Error("Email verification token references a missing user.");

      if (user.status === "DISABLED") {
        await repositories.tokens.invalidateOutstandingByUserAndPurpose(user.id, emailVerificationPurpose, now, session);
        outcome = { ok: true, status: "DISABLED" };
        return;
      }

      if (user.status === "ACTIVE") {
        await repositories.tokens.invalidateOutstandingByUserAndPurpose(user.id, emailVerificationPurpose, now, session);
        outcome = { ok: true, status: "ALREADY_ACTIVE" };
        return;
      }

      const activated = await repositories.users.activatePendingById(user.id, now, session);
      if (!activated) {
        const current = await repositories.users.findById(user.id, session);
        if (current?.status === "DISABLED") {
          await repositories.tokens.invalidateOutstandingByUserAndPurpose(user.id, emailVerificationPurpose, now, session);
          outcome = { ok: true, status: "DISABLED" };
          return;
        }
        if (current?.status === "ACTIVE") {
          await repositories.tokens.invalidateOutstandingByUserAndPurpose(user.id, emailVerificationPurpose, now, session);
          outcome = { ok: true, status: "ALREADY_ACTIVE" };
          return;
        }
        throw new Error("Pending User could not be activated atomically.");
      }

      await repositories.tokens.invalidateOutstandingByUserAndPurpose(user.id, emailVerificationPurpose, now, session);
      outcome = { ok: true, status: "VERIFIED", userId: activated.id, emailVerifiedAt: activated.emailVerifiedAt as Date };
    });
  } finally {
    await session.endSession();
  }

  if (!outcome) throw new Error("Email verification transaction returned no outcome.");
  return outcome;
}
