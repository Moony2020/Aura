import { z } from "zod";

import { registrationEmailSchema } from "./registration.schema.ts";

const passwordSchema = z.string().min(12).max(128);

export const passwordResetRequestSchema = z.object({ email: registrationEmailSchema }).strict();

export const passwordResetInputSchema = z
  .object({
    token: z.string().min(1).max(512),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.password !== value.passwordConfirmation) {
      context.addIssue({ code: "custom", path: ["passwordConfirmation"], message: "Passwords do not match." });
    }
  });

export type PasswordResetRequestInput = z.input<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.input<typeof passwordResetInputSchema>;
