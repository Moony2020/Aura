import type { ClientSession } from "mongodb";
import type { AuthCredentials, AuthCredentialsCreateInput } from "../../domain/auth/auth-credentials.schema.ts";

export interface AuthCredentialsRepository {
  findByUserId(userId: string, session?: ClientSession): Promise<AuthCredentials | null>;
  create(input: AuthCredentialsCreateInput, session?: ClientSession): Promise<AuthCredentials>;
  incrementSessionVersion(userId: string, session?: ClientSession): Promise<AuthCredentials>;
  updatePasswordAndIncrementSessionVersion(userId: string, passwordHash: string, passwordChangedAt: Date, session?: ClientSession): Promise<AuthCredentials>;
}
