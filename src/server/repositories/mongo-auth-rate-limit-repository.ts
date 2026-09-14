import "server-only";
import { getMongoDb } from "../db/mongodb.ts";
import type { AuthRateLimitRepository, RateLimitAttempt, RateLimitResult } from "./auth-rate-limit-repository.ts";
type Doc = { keyHash: string; kind: RateLimitAttempt["kind"]; count: number; windowStartedAt: Date; expiresAt: Date; lastAttemptAt?: Date };
const name = "authRateLimits";
export class MongoAuthRateLimitRepository implements AuthRateLimitRepository {
  private async collection() {
    const db = await getMongoDb();
    try { await db.createCollection<Doc>(name, { validator: { $jsonSchema: { bsonType: "object", required: ["keyHash", "kind", "count", "windowStartedAt", "expiresAt"], additionalProperties: false, properties: { _id: { bsonType: "objectId" }, keyHash: { bsonType: "string", pattern: "^[a-f0-9]{64}$" }, kind: { bsonType: "string" }, count: { bsonType: "int", minimum: 0 }, windowStartedAt: { bsonType: "date" }, expiresAt: { bsonType: "date" }, lastAttemptAt: { bsonType: "date" } } } } }); }
    catch (error) { if ((error as { code?: number }).code !== 48) throw error; }
    const collection = db.collection<Doc>(name);
    await collection.createIndex({ keyHash: 1, kind: 1 }, { unique: true });
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    return collection;
  }
  async current(input: { keyHash: string; kind: RateLimitAttempt["kind"]; now: Date }) {
    const doc = await (await this.collection()).findOne({ keyHash: input.keyHash, kind: input.kind });
    return !doc || doc.expiresAt <= input.now ? null : { count: doc.count, lastAttemptAt: doc.lastAttemptAt, expiresAt: doc.expiresAt };
  }
  async attempt(input: RateLimitAttempt): Promise<RateLimitResult> {
    const collection = await this.collection();
    const expires = new Date(input.now.getTime() + input.windowMs);
    for (let retry = 0; retry < 4; retry += 1) {
      const before = await collection.findOne({ keyHash: input.keyHash, kind: input.kind });
      if (!before) { try { await collection.insertOne({ keyHash: input.keyHash, kind: input.kind, count: 0, windowStartedAt: input.now, expiresAt: expires }); } catch (error) { if ((error as { code?: number }).code !== 11000) throw error; } continue; }
      const spacingViolation = Boolean(input.minimumSpacingMs && before.lastAttemptAt && input.now.getTime() - before.lastAttemptAt.getTime() < input.minimumSpacingMs);
      const updated = before.expiresAt <= input.now
        ? await collection.findOneAndUpdate({ keyHash: input.keyHash, kind: input.kind, expiresAt: { $lte: input.now } }, { $set: { count: 1, windowStartedAt: input.now, expiresAt: expires, lastAttemptAt: input.now } }, { returnDocument: "after" })
        : await collection.findOneAndUpdate({ keyHash: input.keyHash, kind: input.kind, expiresAt: { $gt: input.now } }, { $inc: { count: 1 }, $set: { lastAttemptAt: input.now } }, { returnDocument: "after" });
      if (!updated) continue;
      return { allowed: !spacingViolation && updated.count <= input.limit, count: updated.count, spacingViolation, retryAfterSeconds: Math.max(1, Math.ceil((updated.expiresAt.getTime() - input.now.getTime()) / 1000)) };
    }
    throw new Error("Unable to update auth rate-limit bucket atomically");
  }
}
