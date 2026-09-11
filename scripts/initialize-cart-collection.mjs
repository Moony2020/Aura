import fs from "node:fs";

import { MongoClient, ServerApiVersion } from "mongodb";

const collectionName = "carts";

function readLocalEnvironmentValue(name) {
  if (process.env[name]) return process.env[name];
  if (!fs.existsSync(".env.local")) return undefined;
  const entry = fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .find((line) => new RegExp(`^\\s*${name}\\s*=`).test(line));
  return entry
    ?.replace(new RegExp(`^\\s*${name}\\s*=\\s*`), "")
    .trim()
    .replace(/^"|"$/g, "");
}

export const cartValidator = {
  $and: [
    {
      $jsonSchema: {
        bsonType: "object",
        additionalProperties: false,
        required: ["owner", "status", "items", "version", "createdAt", "updatedAt"],
        properties: {
          _id: { bsonType: "objectId" },
          owner: {
            bsonType: "object",
            additionalProperties: false,
            required: ["kind"],
            properties: {
              kind: { enum: ["GUEST", "USER"] },
              guestTokenHash: { bsonType: "string", pattern: "^[a-f0-9]{64}$" },
              userId: { bsonType: "string", pattern: "^[a-fA-F0-9]{24}$" },
            },
          },
          status: { enum: ["ACTIVE", "CONVERTED", "EXPIRED"] },
          items: {
            bsonType: "array",
            maxItems: 100,
            items: {
              bsonType: "object",
              additionalProperties: false,
              required: ["productId", "variantId", "quantity"],
              properties: {
                productId: { bsonType: "string", pattern: "^[a-fA-F0-9]{24}$" },
                variantId: {
                  bsonType: "string",
                  pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                },
                quantity: { bsonType: "int", minimum: 1 },
              },
            },
          },
          version: { bsonType: "int", minimum: 0 },
          expiresAt: { bsonType: "date" },
          createdAt: { bsonType: "date" },
          updatedAt: { bsonType: "date" },
        },
      },
    },
    {
      $or: [
        {
          "owner.kind": "GUEST",
          "owner.guestTokenHash": { $type: "string", $regex: "^[a-f0-9]{64}$" },
          "owner.userId": { $exists: false },
          expiresAt: { $type: "date" },
        },
        {
          "owner.kind": "USER",
          "owner.userId": { $type: "string", $regex: "^[a-fA-F0-9]{24}$" },
          "owner.guestTokenHash": { $exists: false },
        },
      ],
    },
    {
      items: {
        $not: {
          $elemMatch: {
            $or: [
              { price: { $exists: true } },
              { unitPrice: { $exists: true } },
              { lineTotal: { $exists: true } },
              { subtotal: { $exists: true } },
              { total: { $exists: true } },
              { productName: { $exists: true } },
              { name: { $exists: true } },
              { slug: { $exists: true } },
              { sku: { $exists: true } },
              { media: { $exists: true } },
              { available: { $exists: true } },
              { reserved: { $exists: true } },
              { committed: { $exists: true } },
              { inStock: { $exists: true } },
              { inventoryQuantity: { $exists: true } },
            ],
          },
        },
      },
    },
  ],
};

const indexes = [
  [
    { "owner.guestTokenHash": 1 },
    {
      name: "carts_active_guest_owner_unique",
      unique: true,
      partialFilterExpression: { "owner.kind": "GUEST", status: "ACTIVE" },
    },
  ],
  [
    { "owner.userId": 1 },
    {
      name: "carts_active_user_owner_unique",
      unique: true,
      partialFilterExpression: { "owner.kind": "USER", status: "ACTIVE" },
    },
  ],
  [{ status: 1, expiresAt: 1 }, { name: "carts_status_expires_at" }],
  [{ status: 1, updatedAt: -1 }, { name: "carts_status_updated_at" }],
];

const uri = readLocalEnvironmentValue("MONGODB_URI");

if (!uri) {
  console.error("CART_COLLECTION_INITIALIZATION: MONGODB_URI is unavailable.");
  process.exitCode = 1;
} else {
  const client = new MongoClient(uri, {
    appName: "aura-stage-3-2-cart-initialization",
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    await client.connect();
    const db = client.db();
    const exists = await db.listCollections({ name: collectionName }, { nameOnly: true }).hasNext();

    if (exists && (await db.collection(collectionName).estimatedDocumentCount()) > 0) {
      throw new Error("Refusing to refresh non-empty carts collection.");
    }

    if (!exists) {
      await db.createCollection(collectionName, {
        validator: cartValidator,
        validationLevel: "strict",
        validationAction: "error",
      });
    } else {
      await db.command({
        collMod: collectionName,
        validator: cartValidator,
        validationLevel: "strict",
        validationAction: "error",
      });
    }

    for (const [key, options] of indexes) {
      await db.collection(collectionName).createIndex(key, options);
    }

    console.log("CART_COLLECTION_INITIALIZATION: PASS");
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`CART_COLLECTION_INITIALIZATION: FAIL (${errorName})`);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}
