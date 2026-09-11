import "server-only";

import { passwordResetRequestSchema, passwordResetInputSchema } from "../../domain/auth/password-reset.schema.ts";
import { passwordResetPurpose, type AuthToken } from "../../domain/auth/auth-token.schema.ts";
import { normalizeEmail } from "../../domain/user/user.schema.ts";
import { serializePublicError, type PublicError } from "../../lib/errors/serialize.ts";
import { mongoClientPromise } from "../db/mongodb.ts";
import type { PasswordResetEmailSender } from "../email/email-sender.ts";
import { InMemoryEmailSender } from "../email/email-sender.ts";
import type { AuthCredentialsRepository } from "../repositories/auth-credentials-repository.ts";
import { MongoAuthCredentialsRepository } from "../repositories/mongo-auth-credentials-repository.ts";
import type { AuthTokenRepository } from "../repositories/auth-token-repository.ts";
import { MongoAuthTokenRepository } from "../repositories/mongo-auth-token-repository.ts";
import type { UserRepository } from "../repositories/user-repository.ts";
import { MongoUserRepository } from "../repositories/mongo-user-repository.ts";
import { hashPassword } from "./password-hasher.ts";
import { createPasswordResetToken, hashAuthToken } from "./verification-token.ts";

export const PASSWORD_RESET_REQUEST_MESSAGE = "If an eligible account exists, password reset instructions will be sent.";

export type PasswordResetTokenState = "READY" | "EXPIRED" | "USED" | "INVALID";

export type PasswordResetRequestResult =
  | { ok: true; accepted: true; emailDelivery: "SENT" | "PENDING"; message: string }
  | { ok: false; error: PublicError };

export type PasswordResetResult =
  | { ok: true; status: "RESET"; userId: string }
  | { ok: false; status: "INVALID" | "EXPIRED" | "USED" | "DISABLED" };

type PasswordResetRepositories = {
  users: UserRepository;
  credentials: AuthCredentialsRepository;
  tokens: AuthTokenRepository;
};

const mongoRepositories = (): PasswordResetRepositories => ({
  users: new MongoUserRepository(),
  credentials: new MongoAuthCredentialsRepository(),
  tokens: new MongoAuthTokenRepository(),
});

export type PasswordResetOptions = {
  emailSender?: PasswordResetEmailSender;
  resetOrigin?: string;
  repositories?: PasswordResetRepositories;
  now?: Date;
};

function resetUrl(origin: string | undefined, rawToken: string) {
  const base = (origin ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

function classifyPasswordResetToken(token: Pick<AuthToken, "purpose" | "expiresAt" | "consumedAt">, now: Date): PasswordResetTokenState {
  if (token.purpose !== passwordResetPurpose) return "INVALID";
  if (token.consumedAt !== null) return "USED";
  if (token.expiresAt <= now) return "EXPIRED";
  return "READY";
}

function resultForTokenState(state: PasswordResetTokenState): PasswordResetResult {
  return state === "READY" ? { ok: false, status: "INVALID" } : { ok: false, status: state };
}

export async function inspectPasswordResetToken(rawToken: string, options: PasswordResetOptions = {}): Promise<PasswordResetTokenState> {
  if (typeof rawToken !== "string" || rawToken.length === 0 || rawToken.length > 512) return "INVALID";
  const repositories = options.repositories ?? mongoRepositories();
  const now = options.now ?? new Date();
  const token = await repositories.tokens.findByHashAndPurpose(hashAuthToken(rawToken), passwordResetPurpose);
  return token ? classifyPasswordResetToken(token, now) : "INVALID";
}

export async function requestPasswordReset(input: unknown, options: PasswordResetOptions = {}): Promise<PasswordResetRequestResult> {
  const parsed = passwordResetRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: serializePublicError(parsed.error) };

  const repositories = options.repositories ?? mongoRepositories();
  const sender = options.emailSender ?? new InMemoryEmailSender();
  const normalizedEmail = normalizeEmail(parsed.data.email);
  const user = await repositories.users.findByNormalizedEmail(normalizedEmail);

  if (!user || user.status !== "ACTIVE" || user.emailVerifiedAt === null || !await repositories.credentials.findByUserId(user.id)) {
    return { ok: true, accepted: true, emailDelivery: "PENDING", message: PASSWORD_RESET_REQUEST_MESSAGE };
  }

  const now = options.now ?? new Date();
  const generated = createPasswordResetToken(now);
  const session = (await mongoClientPromise).startSession();

  try {
    await session.withTransaction(async () => {
      await repositories.tokens.invalidateOutstandingByUserAndPurpose(user.id, passwordResetPurpose, now, session);
      await repositories.tokens.createPasswordReset({ userId: user.id, tokenHash: generated.tokenHash, expiresAt: generated.expiresAt, createdAt: now, consumedAt: null }, session);
    });
  } finally {
    await session.endSession();
  }

  try {
    await sender.sendPasswordReset({ to: normalizedEmail, resetUrl: resetUrl(options.resetOrigin, generated.rawToken) });
    return { ok: true, accepted: true, emailDelivery: "SENT", message: PASSWORD_RESET_REQUEST_MESSAGE };
  } catch {
    return { ok: true, accepted: true, emailDelivery: "PENDING", message: PASSWORD_RESET_REQUEST_MESSAGE };
  }
}

export async function resetPassword(input: unknown, options: PasswordResetOptions = {}): Promise<PasswordResetResult> {
  const parsed = passwordResetInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, status: "INVALID" };

  const repositories = options.repositories ?? mongoRepositories();
  const now = options.now ?? new Date();
  const passwordHash = await hashPassword(parsed.data.password);
  const tokenHash = hashAuthToken(parsed.data.token);
  const session = (await mongoClientPromise).startSession();
  let outcome: PasswordResetResult | null = null;

  try {
    await session.withTransaction(async () => {
      const token = await repositories.tokens.consumeByHashAndPurpose(tokenHash, passwordResetPurpose, now, session);
      if (!token) {
        const existing = await repositories.tokens.findByHashAndPurpose(tokenHash, passwordResetPurpose, session);
        outcome = resultForTokenState(existing ? classifyPasswordResetToken(existing, now) : "INVALID");
        return;
      }

      const user = await repositories.users.findById(token.userId, session);
      const credentials = user ? await repositories.credentials.findByUserId(user.id, session) : null;
      if (!user || !credentials) throw new Error("Password reset token references incomplete identity state.");

      if (user.status === "DISABLED") {
        await repositories.tokens.invalidateOutstandingByUserAndPurpose(user.id, passwordResetPurpose, now, session);
        outcome = { ok: false, status: "DISABLED" };
        return;
      }

      if (user.status !== "ACTIVE" || user.emailVerifiedAt === null) {
        await repositories.tokens.invalidateOutstandingByUserAndPurpose(user.id, passwordResetPurpose, now, session);
        outcome = { ok: false, status: "INVALID" };
        return;
      }

      await repositories.credentials.updatePasswordAndIncrementSessionVersion(user.id, passwordHash, now, session);
      await repositories.tokens.invalidateOutstandingByUserAndPurpose(user.id, passwordResetPurpose, now, session);
      outcome = { ok: true, status: "RESET", userId: user.id };
    });
  } finally {
    await session.endSession();
  }

  if (!outcome) throw new Error("Password reset transaction returned no outcome.");
  return outcome;
}
