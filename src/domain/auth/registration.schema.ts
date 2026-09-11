import { z } from "zod";

export const registrationEmailSchema = z.string().trim().email().max(320);
const registrationPasswordSchema = z.string().min(12).max(128);

export const registrationInputSchema = z
  .object({
    email: registrationEmailSchema,
    firstName: z.string().trim().min(1).max(120),
    lastName: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(3).max(40).regex(/^[+()\d\s.-]+$/).optional(),
    password: registrationPasswordSchema,
    passwordConfirmation: z.string(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.password !== value.passwordConfirmation) {
      context.addIssue({ code: "custom", path: ["passwordConfirmation"], message: "Passwords do not match." });
    }
  });

export type RegistrationInput = z.input<typeof registrationInputSchema>;
