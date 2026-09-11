import { z } from "zod";

import { registrationEmailSchema } from "./registration.schema.ts";

export const loginInputSchema = z
  .object({
    email: registrationEmailSchema,
    password: z.string().min(1).max(128),
  })
  .strict();

export type LoginInput = z.input<typeof loginInputSchema>;
