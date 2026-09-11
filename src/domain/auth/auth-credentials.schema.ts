import { z } from "zod";
import { objectIdSchema } from "../shared/identifiers.ts";

const argon2idPhcSchema = z
  .string()
  .regex(/^\$argon2id\$v=\d+\$m=\d+,p=\d+,t=\d+\$[A-Za-z0-9+/]+={0,2}\$[A-Za-z0-9+/]+={0,2}$/);

export const AUTH_PASSWORD_HASH_VERSION = 1;

export const authCredentialsCreateSchema = z
  .object({
    userId: objectIdSchema,
    passwordHash: argon2idPhcSchema,
    passwordHashVersion: z.number().int().min(1).max(10),
    sessionVersion: z.number().int().min(0),
    passwordChangedAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export const authCredentialsSchema = authCredentialsCreateSchema
  .extend({ id: objectIdSchema })
  .strict();

export type AuthCredentials = z.output<typeof authCredentialsSchema>;
export type AuthCredentialsCreateInput = z.input<typeof authCredentialsCreateSchema>;
