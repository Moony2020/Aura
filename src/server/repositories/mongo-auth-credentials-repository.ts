import "server-only";

import { ObjectId, type Collection, type ClientSession } from "mongodb";
import {
  authCredentialsCreateSchema,
  authCredentialsSchema,
  type AuthCredentials,
  type AuthCredentialsCreateInput,
} from "../../domain/auth/auth-credentials.schema.ts";
import { getMongoDb } from "../db/mongodb.ts";
import type { AuthCredentialsRepository } from "./auth-credentials-repository.ts";

type AuthCredentialsDoc = Omit<AuthCredentials, "id"> & { _id: ObjectId };

const toAuthCredentials = (doc: AuthCredentialsDoc): AuthCredentials => {
  const { _id, ...fields } = doc;
  return authCredentialsSchema.parse({ ...fields, id: _id.toHexString() });
};

export class MongoAuthCredentialsRepository implements AuthCredentialsRepository {
  private async collection(): Promise<Collection<AuthCredentialsDoc>> {
    return (await getMongoDb()).collection<AuthCredentialsDoc>("authCredentials");
  }

  async findByUserId(userId: string, session?: ClientSession): Promise<AuthCredentials | null> {
    const row = await (await this.collection()).findOne({ userId }, { session });
    return row ? toAuthCredentials(row) : null;
  }

  async create(input: AuthCredentialsCreateInput, session?: ClientSession): Promise<AuthCredentials> {
    const parsed = authCredentialsCreateSchema.parse(input);
    const row: AuthCredentialsDoc = { ...parsed, _id: new ObjectId() };
    await (await this.collection()).insertOne(row, { session });
    return toAuthCredentials(row);
  }

  async incrementSessionVersion(userId: string, session?: ClientSession): Promise<AuthCredentials> {
    const row = await (await this.collection()).findOneAndUpdate(
      { userId },
      { $inc: { sessionVersion: 1 }, $set: { updatedAt: new Date() } },
      { returnDocument: "after", session },
    );
    if (!row) throw new Error("Auth credentials not found.");
    return toAuthCredentials(row);
  }

  async updatePasswordAndIncrementSessionVersion(userId: string, passwordHash: string, passwordChangedAt: Date, session?: ClientSession): Promise<AuthCredentials> {
    const row = await (await this.collection()).findOneAndUpdate(
      { userId },
      { $set: { passwordHash, passwordHashVersion: 1, passwordChangedAt, updatedAt: passwordChangedAt }, $inc: { sessionVersion: 1 } },
      { returnDocument: "after", session },
    );
    if (!row) throw new Error("Auth credentials not found.");
    return toAuthCredentials(row);
  }
}
