import fs from "node:fs";
import { MongoClient, ServerApiVersion } from "mongodb";
const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
const uri = process.env.MONGODB_URI ?? line?.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
if (!uri) throw new Error("MONGODB_URI is unavailable.");
const client = new MongoClient(uri, { appName: "aura-stage-1-7-fragrance-check", serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }, serverSelectionTimeoutMS: 10000 });
await client.connect(); const db = client.db();
const expected = { fragranceNotes: ["fragrance_notes_slug_unique", "fragrance_notes_status_name"], fragranceFamilies: ["fragrance_families_slug_unique", "fragrance_families_status_name"], productFragranceNotes: ["product_fragrance_notes_unique", "product_fragrance_notes_order", "product_fragrance_notes_reverse"], productFragranceFamilies: ["product_fragrance_families_unique", "product_fragrance_families_order", "product_fragrance_families_reverse"] };
for (const [name, indexes] of Object.entries(expected)) { const info = await db.listCollections({ name }).toArray(); if (!info.length) throw new Error(`Missing ${name}.`); const actual = await db.collection(name).listIndexes().toArray(); const names = new Set(actual.map((index) => index.name)); for (const index of indexes) if (!names.has(index)) throw new Error(`Missing index ${index}.`); }
console.log("PASS: fragrance taxonomy validators and indexes are present.");
await client.close();
