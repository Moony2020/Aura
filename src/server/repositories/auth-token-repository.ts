import type { ClientSession } from "mongodb";
import type { AuthToken, AuthTokenCreateInput, AuthTokenPurpose } from "../../domain/auth/auth-token.schema.ts";

export interface AuthTokenRepository {
  createEmailVerification(input: Omit<AuthTokenCreateInput, "purpose">, session?: ClientSession): Promise<AuthToken>;
  createPasswordReset(input: Omit<AuthTokenCreateInput, "purpose">, session?: ClientSession): Promise<AuthToken>;
  findByHashAndPurpose(tokenHash: string, purpose: AuthTokenPurpose, session?: ClientSession): Promise<AuthToken | null>;
  consumeByHashAndPurpose(tokenHash: string, purpose: AuthTokenPurpose, now: Date, session?: ClientSession): Promise<AuthToken | null>;
  invalidateOutstandingByUserAndPurpose(userId: string, purpose: AuthTokenPurpose, now: Date, session?: ClientSession): Promise<number>;
}
