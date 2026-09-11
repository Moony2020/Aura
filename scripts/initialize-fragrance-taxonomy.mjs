import fs from "node:fs";
import { MongoClient, ServerApiVersion } from "mongodb";
const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
const uri = process.env.MONGODB_URI ?? line?.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
if (!uri) throw new Error("MONGODB_URI is unavailable.");
const client = new MongoClient(uri, { appName: "aura-stage-1-7-fragrance-init", serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }, serverSelectionTimeoutMS: 10000 });
await client.connect(); const db = client.db();
const definitions = [
  { name: "fragranceNotes", validator: { $jsonSchema: { bsonType: "object", required: ["slug", "name", "kind", "status", "createdAt", "updatedAt"], properties: { slug: { bsonType: "string" }, name: { bsonType: "string" }, kind: { enum: ["NOTE", "INGREDIENT", "ACCORD"] }, status: { enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] }, createdAt: { bsonType: "date" }, updatedAt: { bsonType: "date" } } } }, indexes: [[{ slug: 1 }, { name: "fragrance_notes_slug_unique", unique: true }], [{ status: 1, name: 1 }, { name: "fragrance_notes_status_name" }]] },
  { name: "fragranceFamilies", validator: { $jsonSchema: { bsonType: "object", required: ["slug", "name", "status", "createdAt", "updatedAt"], properties: { slug: { bsonType: "string" }, name: { bsonType: "string" }, status: { enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] }, createdAt: { bsonType: "date" }, updatedAt: { bsonType: "date" } } } }, indexes: [[{ slug: 1 }, { name: "fragrance_families_slug_unique", unique: true }], [{ status: 1, name: 1 }, { name: "fragrance_families_status_name" }]] },
  { name: "productFragranceNotes", validator: { $jsonSchema: { bsonType: "object", required: ["productId", "noteId", "tier", "position"], properties: { productId: { bsonType: "string" }, noteId: { bsonType: "string" }, tier: { enum: ["TOP", "HEART", "BASE"] }, position: { bsonType: "int", minimum: 0 } } } }, indexes: [[{ productId: 1, noteId: 1, tier: 1 }, { name: "product_fragrance_notes_unique", unique: true }], [{ productId: 1, tier: 1, position: 1 }, { name: "product_fragrance_notes_order" }], [{ noteId: 1, productId: 1 }, { name: "product_fragrance_notes_reverse" }]] },
  { name: "productFragranceFamilies", validator: { $jsonSchema: { bsonType: "object", required: ["productId", "familyId", "position"], properties: { productId: { bsonType: "string" }, familyId: { bsonType: "string" }, position: { bsonType: "int", minimum: 0 } } } }, indexes: [[{ productId: 1, familyId: 1 }, { name: "product_fragrance_families_unique", unique: true }], [{ productId: 1, position: 1 }, { name: "product_fragrance_families_order" }], [{ familyId: 1, productId: 1 }, { name: "product_fragrance_families_reverse" }]] },
];
for (const definition of definitions) {
  const existing = await db.listCollections({ name: definition.name }).toArray();
  if (!existing.length) await db.createCollection(definition.name, { validator: definition.validator, validationLevel: "strict", validationAction: "error" });
  else if (await db.collection(definition.name).countDocuments() > 0) throw new Error(`Refusing to refresh non-empty ${definition.name}.`);
  await db.command({ collMod: definition.name, validator: definition.validator, validationLevel: "strict", validationAction: "error" });
  for (const [key, options] of definition.indexes) await db.collection(definition.name).createIndex(key, options);
}
console.log("PASS: fragrance taxonomy collections and indexes are initialized.");
await client.close();
