import fs from "node:fs";

import { MongoClient, ServerApiVersion } from "mongodb";

const collectionName = "products";
const requiredIndexNames = [
  "products_slug_unique",
  "products_variant_sku_unique",
  "products_status_updated_at",
];

function readLocalEnvironmentValue(name) {
  if (process.env[name]) {
    return process.env[name];
  }

  if (!fs.existsSync(".env.local")) {
    return undefined;
  }

  const entry = fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .find((line) => new RegExp(`^\\s*${name}\\s*=`).test(line));

  return entry
    ?.replace(new RegExp(`^\\s*${name}\\s*=\\s*`), "")
    .trim()
    .replace(/^"|"$/g, "");
}

const uri = readLocalEnvironmentValue("MONGODB_URI");

if (!uri) {
  console.error("PRODUCT_COLLECTION_CHECK: MONGODB_URI is unavailable.");
  process.exitCode = 1;
} else {
  const client = new MongoClient(uri, {
    appName: "aura-stage-1-5-product-check",
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    const db = client.db();
    const metadata = await db
      .listCollections({ name: collectionName })
      .next();
    if (!metadata?.options?.validator) {
      throw new Error("Product collection validator is unavailable.");
    }

    const indexes = await db.collection(collectionName).indexes();
    const indexNames = new Set(indexes.map((index) => index.name));
    if (!requiredIndexNames.every((name) => indexNames.has(name))) {
      throw new Error("Required product indexes are unavailable.");
    }

    let rejectedInvalidDocument = false;
    try {
      await db.collection(collectionName).insertOne({ slug: "invalid" });
    } catch {
      rejectedInvalidDocument = true;
    }

    if (!rejectedInvalidDocument) {
      throw new Error("Product validator accepted an incomplete document.");
    }

    console.log("PRODUCT_COLLECTION_CHECK: PASS");
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`PRODUCT_COLLECTION_CHECK: FAIL (${errorName})`);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}
