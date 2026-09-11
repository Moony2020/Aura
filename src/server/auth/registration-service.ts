import "server-only";

import { registrationEmailSchema, registrationInputSchema } from "../../domain/auth/registration.schema.ts";
import { emailVerificationPurpose } from "../../domain/auth/auth-token.schema.ts";
import { normalizeEmail } from "../../domain/user/user.schema.ts";
import { serializePublicError, type PublicError } from "../../lib/errors/serialize.ts";
import { hashPassword } from "./password-hasher.ts";
import { createEmailVerificationToken } from "./verification-token.ts";
import { mongoClientPromise } from "../db/mongodb.ts";
import type { EmailSender } from "../email/email-sender.ts";
import { InMemoryEmailSender } from "../email/email-sender.ts";
import type { AuthCredentialsRepository } from "../repositories/auth-credentials-repository.ts";
import { MongoAuthCredentialsRepository } from "../repositories/mongo-auth-credentials-repository.ts";
import type { AuthTokenRepository } from "../repositories/auth-token-repository.ts";
import { MongoAuthTokenRepository } from "../repositories/mongo-auth-token-repository.ts";
import type { UserRepository } from "../repositories/user-repository.ts";
import { MongoUserRepository } from "../repositories/mongo-user-repository.ts";

const PUBLIC_REGISTRATION_MESSAGE = "If the details are valid, verification instructions will be sent.";
const PUBLIC_RESEND_MESSAGE = "If an eligible account exists, verification instructions will be sent.";

type RegistrationRepositories = {
  users: UserRepository;
  credentials: AuthCredentialsRepository;
  tokens: AuthTokenRepository;
};

const mongoRepositories = (): RegistrationRepositories => ({
  users: new MongoUserRepository(),
  credentials: new MongoAuthCredentialsRepository(),
  tokens: new MongoAuthTokenRepository(),
});

export type RegistrationOptions = {
  emailSender?: EmailSender;
  verificationOrigin?: string;
  repositories?: RegistrationRepositories;
};

export type RegistrationResult =
  | { ok: true; accepted: true; emailDelivery: "SENT" | "PENDING"; message: string }
  | { ok: false; error: PublicError };

function isDuplicateKeyError(error: unknown): error is { code: 11000 } {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function verificationUrl(origin: string | undefined, rawToken: string) {
  const base = (origin ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/verify-email?token=${encodeURIComponent(rawToken)}`;
}

async function sendVerificationEmail(
  sender: EmailSender,
  email: string,
  origin: string | undefined,
  rawToken: string,
): Promise<"SENT" | "PENDING"> {
  try {
    await sender.sendEmailVerification({ to: email, verificationUrl: verificationUrl(origin, rawToken) });
    return "SENT";
  } catch {
    return "PENDING";
  }
}

export async function registerCustomer(input: unknown, options: RegistrationOptions = {}): Promise<RegistrationResult> {
  const parsed = registrationInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: serializePublicError(parsed.error) };

  const repositories = options.repositories ?? mongoRepositories();
  const sender = options.emailSender ?? new InMemoryEmailSender();
  const normalizedEmail = normalizeEmail(parsed.data.email);
  const passwordHash = await hashPassword(parsed.data.password);
  const generated = createEmailVerificationToken();
  const now = new Date();
  const session = (await mongoClientPromise).startSession();

  try {
    await session.withTransaction(async () => {
      const user = await repositories.users.create(
        {
          email: normalizedEmail,
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
          role: "CUSTOMER",
          status: "PENDING",
          emailVerifiedAt: null,
        },
        session,
      );
      await repositories.credentials.create(
        {
          userId: user.id,
          passwordHash,
          passwordHashVersion: 1,
          sessionVersion: 0,
          passwordChangedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        session,
      );
      await repositories.tokens.createEmailVerification(
        {
          userId: user.id,
          tokenHash: generated.tokenHash,
          expiresAt: generated.expiresAt,
          createdAt: now,
          consumedAt: null,
        },
        session,
      );
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    return { ok: true, accepted: true, emailDelivery: "PENDING", message: PUBLIC_REGISTRATION_MESSAGE };
  } finally {
    await session.endSession();
  }

  const emailDelivery = await sendVerificationEmail(sender, normalizedEmail, options.verificationOrigin, generated.rawToken);
  return { ok: true, accepted: true, emailDelivery, message: PUBLIC_REGISTRATION_MESSAGE };
}

export async function resendEmailVerification(input: unknown, options: RegistrationOptions = {}): Promise<RegistrationResult> {
  const parsed = registrationEmailSchema.safeParse(typeof input === "object" && input !== null && "email" in input ? input.email : input);
  if (!parsed.success) return { ok: false, error: serializePublicError(parsed.error) };

  const repositories = options.repositories ?? mongoRepositories();
  const sender = options.emailSender ?? new InMemoryEmailSender();
  const normalizedEmail = normalizeEmail(parsed.data);
  const user = await repositories.users.findByNormalizedEmail(normalizedEmail);
  if (!user || user.status !== "PENDING" || user.emailVerifiedAt !== null) return { ok: true, accepted: true, emailDelivery: "PENDING", message: PUBLIC_RESEND_MESSAGE };
  if (!await repositories.credentials.findByUserId(user.id)) return { ok: true, accepted: true, emailDelivery: "PENDING", message: PUBLIC_RESEND_MESSAGE };

  const generated = createEmailVerificationToken();
  const now = new Date();
  const session = (await mongoClientPromise).startSession();
  try {
    await session.withTransaction(async () => {
      await repositories.tokens.invalidateOutstandingByUserAndPurpose(user.id, emailVerificationPurpose, now, session);
      await repositories.tokens.createEmailVerification({ userId: user.id, tokenHash: generated.tokenHash, expiresAt: generated.expiresAt, createdAt: now, consumedAt: null }, session);
    });
  } finally {
    await session.endSession();
  }

  const emailDelivery = await sendVerificationEmail(sender, normalizedEmail, options.verificationOrigin, generated.rawToken);
  return { ok: true, accepted: true, emailDelivery, message: PUBLIC_RESEND_MESSAGE };
}

export { PUBLIC_REGISTRATION_MESSAGE, PUBLIC_RESEND_MESSAGE };
