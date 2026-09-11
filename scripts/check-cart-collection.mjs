import fs from "node:fs";

import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

const collectionName = "carts";
const requiredIndexNames = [
  "carts_active_guest_owner_unique",
  "carts_active_user_owner_unique",
  "carts_status_expires_at",
  "carts_status_updated_at",
];

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

const uri = readLocalEnvironmentValue("MONGODB_URI");
if (!uri) {
  console.error("CART_COLLECTION_CHECK: MONGODB_URI is unavailable.");
  process.exitCode = 1;
} else {
  const client = new MongoClient(uri, {
    appName: "aura-stage-3-2-cart-check",
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    serverSelectionTimeoutMS: 10_000,
  });

  const insertedIds = [];
  const testId = () => new ObjectId();
  const productId = "507f1f77bcf86cd799439011";
  const userId = "507f1f77bcf86cd799439012";
  const variantId = "550e8400-e29b-41d4-a716-446655440000";
  const now = new Date();
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const hash = (char) => char.repeat(64);

  const validGuest = (guestTokenHash = hash("a")) => ({
    _id: testId(),
    owner: { kind: "GUEST", guestTokenHash },
    status: "ACTIVE",
    items: [],
    version: 0,
    expiresAt: future,
    createdAt: now,
    updatedAt: now,
  });
  const validUser = (id = userId) => ({
    _id: testId(),
    owner: { kind: "USER", userId: id },
    status: "ACTIVE",
    items: [{ productId, variantId, quantity: 2 }],
    version: 0,
    createdAt: now,
    updatedAt: now,
  });

  try {
    await client.connect();
    const db = client.db();
    const metadata = await db.listCollections({ name: collectionName }).next();
    if (!metadata?.options?.validator) throw new Error("Cart collection validator is unavailable.");

    const indexes = await db.collection(collectionName).indexes();
    const indexNames = new Set(indexes.map((index) => index.name));
    if (!requiredIndexNames.every((name) => indexNames.has(name))) {
      throw new Error("Required cart indexes are unavailable.");
    }

    const insertValid = async (document) => {
      insertedIds.push(document._id);
      await db.collection(collectionName).insertOne(document);
    };

    await insertValid(validGuest(hash("b")));
    await insertValid(validUser("507f1f77bcf86cd799439022"));

    const invalidDocuments = [
      { label: "unknown top-level field", value: { ...validGuest(hash("c")), subtotal: { amount: 1, currency: "USD" } } },
      { label: "invalid owner discriminant", value: { ...validGuest(hash("d")), owner: { kind: "ADMIN", guestTokenHash: hash("d") } } },
      { label: "guest without hash", value: { ...validGuest(hash("e")), owner: { kind: "GUEST" } } },
      { label: "user without userId", value: { ...validUser(), owner: { kind: "USER" } } },
      { label: "both owner identifiers", value: { ...validGuest(hash("f")), owner: { kind: "GUEST", guestTokenHash: hash("f"), userId } } },
      { label: "unsupported status", value: { ...validGuest(hash("a")), status: "ABANDONED" } },
      { label: "invalid quantity", value: { ...validUser(), owner: { kind: "USER", userId: "507f1f77bcf86cd799439023" }, items: [{ productId, variantId, quantity: 0 }] } },
      { label: "missing product reference", value: { ...validUser(), owner: { kind: "USER", userId: "507f1f77bcf86cd799439024" }, items: [{ variantId, quantity: 1 }] } },
      { label: "invalid version", value: { ...validGuest(hash("a")), version: -1 } },
      { label: "line price snapshot", value: { ...validUser(), owner: { kind: "USER", userId: "507f1f77bcf86cd799439025" }, items: [{ productId, variantId, quantity: 1, unitPrice: { amount: 100, currency: "USD" } }] } },
      { label: "line product snapshot", value: { ...validUser(), owner: { kind: "USER", userId: "507f1f77bcf86cd799439026" }, items: [{ productId, variantId, quantity: 1, productName: "Velvet Rose" }] } },
      { label: "line inventory snapshot", value: { ...validUser(), owner: { kind: "USER", userId: "507f1f77bcf86cd799439027" }, items: [{ productId, variantId, quantity: 1, inStock: true }] } },
    ];

    for (const { label, value } of invalidDocuments) {
      let rejected = false;
      try {
        await db.collection(collectionName).insertOne(value);
      } catch {
        rejected = true;
      }
      if (!rejected) {
        insertedIds.push(value._id);
        throw new Error(`Cart database validator accepted invalid document: ${label}`);
      }
    }

    const duplicateGuest = validGuest(hash("b"));
    let rejectedDuplicateGuest = false;
    try {
      await db.collection(collectionName).insertOne(duplicateGuest);
    } catch {
      rejectedDuplicateGuest = true;
    }
    if (!rejectedDuplicateGuest) {
      insertedIds.push(duplicateGuest._id);
      throw new Error("Cart database accepted a duplicate active guest cart.");
    }

    const duplicateUser = validUser("507f1f77bcf86cd799439022");
    let rejectedDuplicateUser = false;
    try {
      await db.collection(collectionName).insertOne(duplicateUser);
    } catch {
      rejectedDuplicateUser = true;
    }
    if (!rejectedDuplicateUser) {
      insertedIds.push(duplicateUser._id);
      throw new Error("Cart database accepted a duplicate active user cart.");
    }

    console.log("CART_COLLECTION_CHECK: PASS");
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`CART_COLLECTION_CHECK: FAIL (${errorName})`);
    process.exitCode = 1;
  } finally {
    if (insertedIds.length) {
      await client.db().collection(collectionName).deleteMany({ _id: { $in: insertedIds } });
    }
    await client.close();
  }
}
