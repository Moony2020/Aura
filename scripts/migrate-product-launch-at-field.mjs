import fs from "node:fs";
import { MongoClient, ServerApiVersion } from "mongodb";

const collectionName = "products";

function readLocalEnvironmentValue(name) {
  if (process.env[name]) return process.env[name];
  if (!fs.existsSync(".env.local")) return undefined;
  const entry = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((line) => new RegExp(`^\\s*${name}\\s*=`).test(line));
  return entry?.replace(new RegExp(`^\\s*${name}\\s*=\\s*`), "").trim().replace(/^"|"$/g, "");
}

const uri = readLocalEnvironmentValue("MONGODB_URI");
if (!uri) throw new Error("MONGODB_URI is unavailable.");

const client = new MongoClient(uri, {
  appName: "aura-product-launch-at-field-migration",
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  serverSelectionTimeoutMS: 10_000,
});

await client.connect();
try {
  const db = client.db();
  const products = db.collection(collectionName);
  await db.command({
    collMod: collectionName,
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["slug", "name", "brand", "description", "status", "variants", "media", "createdAt", "updatedAt"],
        properties: {
          slug: { bsonType: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
          name: { bsonType: "string", minLength: 1, maxLength: 160 },
          brand: { bsonType: "string", minLength: 1, maxLength: 120 },
          description: { bsonType: "string", minLength: 1, maxLength: 4000 },
          status: { enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
          audience: { enum: ["WOMEN", "MEN", "UNISEX"] },
          launchAt: { bsonType: "date" },
          variants: {
            bsonType: "array",
            minItems: 1,
            items: {
              bsonType: "object",
              required: ["id", "sku", "name", "volumeMl", "concentration", "price", "isActive"],
              properties: {
                id: { bsonType: "string" },
                sku: { bsonType: "string" },
                name: { bsonType: "string" },
                volumeMl: { bsonType: ["int", "long", "double", "decimal"], minimum: 1 },
                concentration: { enum: ["EAU_DE_TOILETTE", "EAU_DE_PARFUM", "EAU_DE_PARFUM_INTENSE", "EXTRAIT_DE_PARFUM", "PARFUM"] },
                price: {
                  bsonType: "object",
                  required: ["amount", "currency"],
                  properties: {
                    amount: { bsonType: ["int", "long", "double", "decimal"], minimum: 0 },
                    currency: { bsonType: "string", pattern: "^[A-Z]{3}$" },
                  },
                },
                compareAtPrice: {
                  bsonType: "object",
                  required: ["amount", "currency"],
                  properties: {
                    amount: { bsonType: ["int", "long", "double", "decimal"], minimum: 0 },
                    currency: { bsonType: "string", pattern: "^[A-Z]{3}$" },
                  },
                },
                isActive: { bsonType: "bool" },
              },
            },
          },
          media: {
            bsonType: "array",
            items: {
              bsonType: "object",
              required: ["id", "kind", "provider", "url", "alt", "position"],
              properties: {
                id: { bsonType: "string" },
                kind: { enum: ["IMAGE", "VIDEO"] },
                provider: { enum: ["CLOUDINARY", "EXTERNAL"] },
                url: { bsonType: "string" },
                alt: { bsonType: "string", minLength: 1, maxLength: 240 },
                position: { bsonType: ["int", "long", "double", "decimal"], minimum: 0 },
                publicId: { bsonType: "string" },
              },
            },
          },
          primaryMediaId: { bsonType: "string" },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" },
        },
      },
    },
    validationLevel: "strict",
    validationAction: "error",
  });
  await products.createIndex({ status: 1, launchAt: -1 }, { name: "products_status_launch_at" });
  const marked = await products.countDocuments({ status: "PUBLISHED", launchAt: { $type: "date" } });
  console.log(`PASS: product launchAt merchandising field is allowed and indexed; ${marked} published product(s) currently marked as New Arrival.`);
} finally {
  await client.close();
}

