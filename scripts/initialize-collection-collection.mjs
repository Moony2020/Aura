import fs from "node:fs";
import { MongoClient, ServerApiVersion } from "mongodb";

const name = "collections";
const localValue = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((line) => /^\s*MONGODB_URI\s*=/.test(line));
const uri = process.env.MONGODB_URI ?? localValue?.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["slug", "name", "description", "status", "visibility", "productMemberships", "campaignMedia", "createdAt", "updatedAt"],
    properties: {
      slug: { bsonType: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
      name: { bsonType: "string", minLength: 1, maxLength: 160 }, description: { bsonType: "string", minLength: 1, maxLength: 4000 },
      status: { enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] }, visibility: { enum: ["PUBLIC", "HIDDEN"] },
      productMemberships: { bsonType: "array" },
      campaignMedia: { bsonType: "array" },
      createdAt: { bsonType: "date" }, updatedAt: { bsonType: "date" },
    },
  },
};
const indexes = [{ key: { slug: 1 }, name: "collections_slug_unique", unique: true }, { key: { status: 1, visibility: 1, updatedAt: -1 }, name: "collections_visibility_updated_at" }, { key: { "productMemberships.productId": 1 }, name: "collections_product_membership" }];
if (!uri) { console.error("COLLECTION_DOMAIN_INITIALIZATION: MONGODB_URI is unavailable."); process.exitCode = 1; } else {
  const client = new MongoClient(uri, { appName: "aura-stage-1-6-collection-initialization", serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }, serverSelectionTimeoutMS: 10_000 });
  try {
    const db = client.db(); const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();
    if (exists) { if (await db.collection(name).estimatedDocumentCount()) throw new Error("Existing collection data."); await db.command({ collMod: name, validator, validationLevel: "strict", validationAction: "error" }); }
    else { await db.createCollection(name, { validator, validationLevel: "strict", validationAction: "error" }); }
    await db.collection(name).createIndexes(indexes); console.log("COLLECTION_DOMAIN_INITIALIZATION: PASS");
  } catch (error) { console.error(`COLLECTION_DOMAIN_INITIALIZATION: FAIL (${error instanceof Error ? error.name : "UnknownError"})`); process.exitCode = 1; } finally { await client.close(); }
}
