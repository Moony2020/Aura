import "server-only";
import { ObjectId, type ClientSession, type Collection as MongoCollection } from "mongodb";
import { addressCreateSchema, addressSchema, addressUpdateSchema, normalizeEmail, userCreateSchema, userProfileUpdateSchema, userSchema, userStatusUpdateSchema, type Address, type AddressCreateInput, type AddressUpdateInput, type User, type UserCreateInput, type UserProfileUpdate, type UserStatusUpdate } from "../../domain/user/user.schema.ts";
import { getMongoDb, mongoClientPromise } from "../db/mongodb.ts";
import type { AddressRepository, UserRepository } from "./user-repository";

type UserDoc = Omit<User, "id"> & { _id: ObjectId }; type AddressDoc = Omit<Address, "id"> & { _id: ObjectId };
const oid = (id: string) => new ObjectId(id);
const toUser = (doc: UserDoc) => {
  const { _id, ...fields } = doc;
  return userSchema.parse({ ...fields, id: _id.toHexString() });
};
const toAddress = (doc: AddressDoc) => addressSchema.parse({ ...doc, id: doc._id.toHexString() });

export class MongoUserRepository implements UserRepository {
  private async c(): Promise<MongoCollection<UserDoc>> { return (await getMongoDb()).collection("users"); }
  async findById(id: string, session?: ClientSession) { const row = await (await this.c()).findOne({ _id: oid(id) }, { session }); return row ? toUser(row) : null; }
  async findByNormalizedEmail(email: string, session?: ClientSession) { const row = await (await this.c()).findOne({ normalizedEmail: normalizeEmail(email) }, { session }); return row ? toUser(row) : null; }
  async create(input: UserCreateInput, session?: ClientSession) { const parsed = userCreateSchema.parse(input); const now = new Date(); const row: UserDoc = { ...parsed, _id: new ObjectId(), createdAt: now, updatedAt: now }; await (await this.c()).insertOne(row, { session }); return toUser(row); }
  async activatePendingById(id: string, emailVerifiedAt: Date, session?: ClientSession) { const row = await (await this.c()).findOneAndUpdate({ _id: oid(id), status: "PENDING", emailVerifiedAt: null }, { $set: { status: "ACTIVE", emailVerifiedAt, updatedAt: emailVerifiedAt } }, { returnDocument: "after", session }); return row ? toUser(row) : null; }
  async updateProfile(id: string, input: UserProfileUpdate) {
    const parsed = userProfileUpdateSchema.parse(input);
    const { phone, ...profile } = parsed;
    const update = phone === null
      ? { $set: { ...profile, updatedAt: new Date() }, $unset: { phone: "" as const } }
      : { $set: { ...profile, ...(phone !== undefined ? { phone } : {}), updatedAt: new Date() } };
    const result = await (await this.c()).findOneAndUpdate({ _id: oid(id) }, update, { returnDocument: "after" });
    if (!result) throw new Error("User not found.");
    return toUser(result);
  }
  async updateStatus(id: string, input: UserStatusUpdate) { const parsed = userStatusUpdateSchema.parse(input); const result = await (await this.c()).findOneAndUpdate({ _id: oid(id) }, { $set: { ...parsed, updatedAt: new Date() } }, { returnDocument: "after" }); if (!result) throw new Error("User not found."); return toUser(result); }
}

export class MongoAddressRepository implements AddressRepository {
  private async c(): Promise<MongoCollection<AddressDoc>> { return (await getMongoDb()).collection("addresses"); }
  async listForUser(userId: string) { return (await (await this.c()).find({ userId }).sort({ createdAt: 1 }).toArray()).map(toAddress); }
  async findForUser(userId: string, addressId: string) { const row = await (await this.c()).findOne({ _id: oid(addressId), userId }); return row ? toAddress(row) : null; }
  async createForUser(userId: string, input: Omit<AddressCreateInput, "userId">) { const parsed = addressCreateSchema.parse({ ...input, userId }); const now = new Date(); const row: AddressDoc = { ...parsed, _id: new ObjectId(), createdAt: now, updatedAt: now }; const session = (await mongoClientPromise).startSession(); try { await session.withTransaction(async () => { if (row.defaultShipping) await (await this.c()).updateMany({ userId, defaultShipping: true }, { $set: { defaultShipping: false, updatedAt: now } }, { session }); if (row.defaultBilling) await (await this.c()).updateMany({ userId, defaultBilling: true }, { $set: { defaultBilling: false, updatedAt: now } }, { session }); await (await this.c()).insertOne(row, { session }); }); } finally { await session.endSession(); } return toAddress(row); }
  async updateForUser(userId: string, addressId: string, input: AddressUpdateInput) { const parsed = addressUpdateSchema.parse(input); const now = new Date(); const session = (await mongoClientPromise).startSession(); let result: AddressDoc | null = null; try { await session.withTransaction(async () => { if (parsed.defaultShipping) await (await this.c()).updateMany({ userId, defaultShipping: true, _id: { $ne: oid(addressId) } }, { $set: { defaultShipping: false, updatedAt: now } }, { session }); if (parsed.defaultBilling) await (await this.c()).updateMany({ userId, defaultBilling: true, _id: { $ne: oid(addressId) } }, { $set: { defaultBilling: false, updatedAt: now } }, { session }); result = await (await this.c()).findOneAndUpdate({ _id: oid(addressId), userId }, { $set: { ...parsed, updatedAt: now } }, { returnDocument: "after", session }); }); } finally { await session.endSession(); } if (!result) throw new Error("Address not found for user."); return toAddress(result); }
  async deleteForUser(userId: string, addressId: string) { const result = await (await this.c()).deleteOne({ _id: oid(addressId), userId }); if (!result.deletedCount) throw new Error("Address not found for user."); }
}
