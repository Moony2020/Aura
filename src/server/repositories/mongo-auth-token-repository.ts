import "server-only";

import { ObjectId, type ClientSession, type Collection } from "mongodb";
import {
  authTokenCreateSchema,
  authTokenSchema,
  emailVerificationPurpose,
  passwordResetPurpose,
  type AuthToken,
  type AuthTokenCreateInput,
  type AuthTokenPurpose,
} from "../../domain/auth/auth-token.schema.ts";
import { getMongoDb } from "../db/mongodb.ts";
import type { AuthTokenRepository } from "./auth-token-repository.ts";

type AuthTokenDoc = Omit<AuthToken, "id"> & { _id: ObjectId };

const toAuthToken = (doc: AuthTokenDoc): AuthToken => {
  const { _id, ...fields } = doc;
  return authTokenSchema.parse({ ...fields, id: _id.toHexString() });
};

export class MongoAuthTokenRepository implements AuthTokenRepository {
  private async collection(): Promise<Collection<AuthTokenDoc>> {
    return (await getMongoDb()).collection<AuthTokenDoc>("authTokens");
  }

  async createEmailVerification(input: Omit<AuthTokenCreateInput, "purpose">, session?: ClientSession): Promise<AuthToken> {
    const parsed = authTokenCreateSchema.parse({ ...input, purpose: emailVerificationPurpose });
    const row: AuthTokenDoc = { ...parsed, _id: new ObjectId() };
    await (await this.collection()).insertOne(row, { session });
    return toAuthToken(row);
  }

  async createPasswordReset(input: Omit<AuthTokenCreateInput, "purpose">, session?: ClientSession): Promise<AuthToken> {
    const parsed = authTokenCreateSchema.parse({ ...input, purpose: passwordResetPurpose });
    const row: AuthTokenDoc = { ...parsed, _id: new ObjectId() };
    await (await this.collection()).insertOne(row, { session });
    return toAuthToken(row);
  }

  async findByHashAndPurpose(tokenHash: string, purpose: AuthTokenPurpose, session?: ClientSession): Promise<AuthToken | null> {
    const row = await (await this.collection()).findOne({ tokenHash, purpose }, { session });
    return row ? toAuthToken(row) : null;
  }

  async consumeByHashAndPurpose(tokenHash: string, purpose: AuthTokenPurpose, now: Date, session?: ClientSession): Promise<AuthToken | null> {
    const row = await (await this.collection()).findOneAndUpdate(
      { tokenHash, purpose, consumedAt: null, expiresAt: { $gt: now } },
      { $set: { consumedAt: now } },
      { returnDocument: "after", session },
    );
    return row ? toAuthToken(row) : null;
  }

  async invalidateOutstandingByUserAndPurpose(userId: string, purpose: AuthTokenPurpose, now: Date, session?: ClientSession): Promise<number> {
    const result = await (await this.collection()).updateMany(
      { userId, purpose, consumedAt: null },
      { $set: { consumedAt: now } },
      { session },
    );
    return result.modifiedCount;
  }
}
