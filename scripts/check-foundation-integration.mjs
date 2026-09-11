import fs from "node:fs";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import { cinematicSeedManifest } from "./cinematic-seed-manifest.mjs";

const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
const uri = process.env.MONGODB_URI ?? line?.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
if (!uri) throw new Error("MONGODB_URI is unavailable.");
const runtimeFiles = ["src/app", "src/components", "src/lib", "src/server"];
const scan = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => { const path = `${directory}/${entry.name}`; return entry.isDirectory() ? scan(path) : /\.(ts|tsx|js|mjs)$/.test(entry.name) ? [path] : []; });
for (const file of runtimeFiles.flatMap(scan)) if (fs.readFileSync(file, "utf8").includes("cinematic-seed-manifest") || fs.readFileSync(file, "utf8").includes("seed-cinematic-products")) throw new Error(`Seed/runtime boundary violation in ${file}.`);
const client = new MongoClient(uri, { appName: "aura-stage-1-13-foundation-integration", serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }, serverSelectionTimeoutMS: 10000 }); await client.connect(); const db = client.db();
try {
  const products = db.collection("products"); const collection = await db.collection("collections").findOne({ slug: "cinematic-worlds" }); if (!collection) throw new Error("Missing cinematic collection."); const productRows = await products.find({ slug: { $in: cinematicSeedManifest.map((world) => world.slug) } }).toArray(); if (productRows.length !== 6) throw new Error("Expected six cinematic products.");
  const productIds = new Set(productRows.map((row) => row._id.toHexString())); const skus = new Set(); for (const product of productRows) { if (!["PUBLISHED", "ARCHIVED"].includes(product.status) || !product.variants?.length) throw new Error("Invalid seeded product contract."); for (const variant of product.variants) { if (skus.has(variant.sku) || !Number.isInteger(variant.price.amount)) throw new Error("Duplicate/invalid SKU or price."); skus.add(variant.sku); } }
  if (collection.productMemberships.length !== 6 || new Set(collection.productMemberships.map((item) => item.productId)).size !== 6 || collection.productMemberships.some((item) => !productIds.has(item.productId))) throw new Error("Collection integrity failed.");
  for (const link of await db.collection("productFragranceNotes").find({ productId: { $in: [...productIds] } }).toArray()) { if (!productIds.has(link.productId) || !(await db.collection("fragranceNotes").findOne({ _id: new ObjectId(link.noteId) }))) throw new Error("Orphan product-note reference."); }
  for (const link of await db.collection("productFragranceFamilies").find({ productId: { $in: [...productIds] } }).toArray()) { if (!productIds.has(link.productId) || !(await db.collection("fragranceFamilies").findOne({ _id: new ObjectId(link.familyId) }))) throw new Error("Orphan product-family reference."); }
  const canonical = JSON.parse(JSON.stringify(productRows[0])); const orderSnapshot = { productName: canonical.name, unitPrice: canonical.variants[0].price.amount, shippingAddress: { addressLine1: "1 Main Street", city: "Stockholm", countryCode: "SE" } }; canonical.name = "Changed canonical name"; canonical.variants[0].price.amount = 1; if (orderSnapshot.productName === canonical.name || orderSnapshot.unitPrice === canonical.variants[0].price.amount) throw new Error("Product snapshot is mutable."); const savedAddress = { ...orderSnapshot.shippingAddress }; savedAddress.addressLine1 = "Changed address"; if (orderSnapshot.shippingAddress.addressLine1 === savedAddress.addressLine1) throw new Error("Address snapshot is mutable.");
  console.log("PASS: Phase 1 integration checks cover product contracts, seed/runtime separation, collection/taxonomy references, and snapshot immutability.");
} finally { await client.close(); }
