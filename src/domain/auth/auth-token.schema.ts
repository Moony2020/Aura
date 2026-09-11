import { z } from "zod";
import { objectIdSchema } from "../shared/identifiers.ts";

export const authTokenPurposeSchema = z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"]);
export const emailVerificationPurpose = "EMAIL_VERIFICATION" as const;
export const passwordResetPurpose = "PASSWORD_RESET" as const;

export const authTokenCreateSchema = z
  .object({
    userId: objectIdSchema,
    purpose: authTokenPurposeSchema,
    tokenHash: z.string().regex(/^[a-f0-9]{64}$/),
    expiresAt: z.date(),
    createdAt: z.date(),
    consumedAt: z.date().nullable(),
  })
  .strict();

export const authTokenSchema = authTokenCreateSchema
  .extend({ id: objectIdSchema })
  .strict();

export type AuthTokenPurpose = z.output<typeof authTokenPurposeSchema>;
export type AuthToken = z.output<typeof authTokenSchema>;
export type AuthTokenCreateInput = z.input<typeof authTokenCreateSchema>;
