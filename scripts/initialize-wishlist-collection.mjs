import fs from "node:fs";
if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}
const { getMongoDb } = await import("../src/server/db/mongodb.ts");
const db = await getMongoDb();
const wishlistValidator = {
  $and: [
    { $jsonSchema: { bsonType: "object", additionalProperties: false, required: ["owner", "items", "version", "createdAt", "updatedAt"], properties: {
      _id: { bsonType: "objectId" },
      owner: { bsonType: "object", additionalProperties: false, required: ["kind"], properties: { kind: { enum: ["GUEST", "USER"] }, guestTokenHash: { bsonType: "string", pattern: "^[a-f0-9]{64}$" }, userId: { bsonType: "string", pattern: "^[a-fA-F0-9]{24}$" } } },
      items: { bsonType: "array", maxItems: 500, items: { bsonType: "object", additionalProperties: false, required: ["productId", "addedAt"], properties: { productId: { bsonType: "string", pattern: "^[a-fA-F0-9]{24}$" }, addedAt: { bsonType: "date" } } } },
      version: { bsonType: "int", minimum: 0 }, expiresAt: { bsonType: "date" }, createdAt: { bsonType: "date" }, updatedAt: { bsonType: "date" },
    } } },
    { $or: [
      { "owner.kind": "GUEST", "owner.guestTokenHash": { $type: "string", $regex: "^[a-f0-9]{64}$" }, "owner.userId": { $exists: false }, expiresAt: { $type: "date" } },
      { "owner.kind": "USER", "owner.userId": { $type: "string", $regex: "^[a-fA-F0-9]{24}$" }, "owner.guestTokenHash": { $exists: false }, expiresAt: { $exists: false } },
    ] },
    { items: { $not: { $elemMatch: { $or: ["price", "unitPrice", "quantity", "subtotal", "inventory", "available", "reserved", "committed", "name", "slug", "media"].map((field) => ({ [field]: { $exists: true } })) } } } },
  ],
};
const collection = await db.createCollection("wishlists", { validator: wishlistValidator, validationLevel: "strict", validationAction: "error" }).catch(async (error) => { if (error?.codeName !== "NamespaceExists") throw error; await db.command({ collMod: "wishlists", validator: wishlistValidator, validationLevel: "strict", validationAction: "error" }); return db.collection("wishlists"); });
await collection.createIndex({ "owner.kind": 1, "owner.guestTokenHash": 1 }, { unique: true, partialFilterExpression: { "owner.kind": "GUEST", "owner.guestTokenHash": { $exists: true } }, name: "unique_active_guest_wishlist_owner" });
await collection.createIndex({ "owner.kind": 1, "owner.userId": 1 }, { unique: true, partialFilterExpression: { "owner.kind": "USER", "owner.userId": { $exists: true } }, name: "unique_user_wishlist_owner" });
console.log("Wishlist collection and indexes are ready.");
process.exit(0);
