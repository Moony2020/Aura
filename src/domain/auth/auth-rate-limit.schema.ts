import { z } from "zod";
export const authRateLimitKindSchema = z.enum(["LOGIN_ACCOUNT","LOGIN_IP","REGISTRATION_EMAIL","REGISTRATION_IP","VERIFICATION_EMAIL","VERIFICATION_IP","FORGOT_PASSWORD_EMAIL","FORGOT_PASSWORD_IP","PASSWORD_RESET_TOKEN","PASSWORD_RESET_IP"]);
export type AuthRateLimitKind = z.infer<typeof authRateLimitKindSchema>;
