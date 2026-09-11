import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

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
  console.error("CART_PERSISTENCE_CHECK: FAIL (MONGODB_URI unavailable)");
  process.exit(1);
}
process.env.MONGODB_URI = uri;

const {
  createCartService,
  isVersionConflict,
} = await import("../src/server/cart/cart-service.ts");
const {
  GUEST_CART_COOKIE_NAME,
  hashGuestCartToken,
  isPlausibleGuestCartToken,
} = await import("../src/server/cart/guest-cart-token.ts");

const client = new MongoClient(uri, {
  appName: "aura-stage-3-3-cart-persistence-check",
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  serverSelectionTimeoutMS: 10_000,
});

const createdProductIds = [];
const createdCartIds = [];
const createdVariantIds = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testProduct({ status = "PUBLISHED", variantActive = true, price = 12900 } = {}) {
  const productId = new ObjectId();
  const variantId = randomUUID();
  createdProductIds.push(productId);
  createdVariantIds.push(variantId);

  return {
    _id: productId,
    slug: `stage-3-3-test-${productId.toHexString()}`,
    name: `Stage 3.3 Test Fragrance ${productId.toHexString().slice(-4)}`,
    brand: "AURA",
    description: "Temporary Stage 3.3 persistence fixture.",
    status,
    audience: "UNISEX",
    variants: [
      {
        id: variantId,
        sku: `S33-${productId.toHexString().slice(-8).toUpperCase()}`,
        name: "100 ml",
        volumeMl: 100,
        concentration: "EAU_DE_PARFUM",
        price: { amount: price, currency: "USD" },
        isActive: variantActive,
      },
    ],
    media: [
      {
        id: randomUUID(),
        kind: "IMAGE",
        provider: "EXTERNAL",
        url: "https://example.com/stage-3-3-test.jpg",
        alt: "AURA Stage 3.3 temporary fragrance",
        position: 0,
      },
    ],
    primaryMediaId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function createFixtureProduct(db, options) {
  const product = testProduct(options);
  product.primaryMediaId = product.media[0].id;
  await db.collection("products").insertOne(product);
  return {
    productId: product._id.toHexString(),
    variantId: product.variants[0].id,
    product,
  };
}

try {
  await client.connect();
  const db = client.db();
  const service = createCartService();
  const initialCartCount = await db.collection("carts").countDocuments();

  const emptyRead = await service.readCurrentCart({ kind: "GUEST" });
  assert(emptyRead.itemCount === 0 && emptyRead.version === 0, "Reading without a cookie must return canonical empty cart.");
  assert(await db.collection("carts").countDocuments() === initialCartCount, "Reading without a cookie must not create a DB cart.");

  const malformedRead = await service.readCurrentCart({ kind: "GUEST", guestToken: "not-a-real-token" });
  assert(malformedRead.itemCount === 0, "Malformed guest cookie must read as empty.");

  const fixture = await createFixtureProduct(db, { price: 12900 });
  await db.collection("inventory").insertOne({
    _id: new ObjectId(),
    variantId: fixture.variantId,
    sku: fixture.product.variants[0].sku,
    available: 5,
    reserved: 0,
    committed: 0,
    version: 0,
    updatedAt: new Date(),
  });

  const firstMutation = await service.addItem(
    { kind: "GUEST" },
    { productId: fixture.productId, variantId: fixture.variantId, quantity: 2 },
  );
  assert(firstMutation.setCookie?.name === GUEST_CART_COOKIE_NAME, "First guest mutation must return aura_guest_cart cookie descriptor.");
  assert(isPlausibleGuestCartToken(firstMutation.setCookie.value), "Guest cart token must be opaque high-entropy base64url.");
  assert(firstMutation.cart.itemCount === 2, "First mutation must persist requested quantity.");
  assert(firstMutation.cart.version === 1, "First mutation must increment cart version to 1.");
  assert(firstMutation.cart.items[0].unitPrice?.amount === 12900, "Cart view must resolve current minor-unit variant price.");

  const rawToken = firstMutation.setCookie.value;
  const guestHash = hashGuestCartToken(rawToken);
  const storedGuestCart = await db.collection("carts").findOne({ "owner.guestTokenHash": guestHash });
  assert(storedGuestCart, "Guest cart must be stored by token hash.");
  createdCartIds.push(storedGuestCart._id);
  assert(storedGuestCart.owner.guestTokenHash === guestHash, "MongoDB cart must store the SHA-256 token hash.");
  assert(JSON.stringify(storedGuestCart).includes(rawToken) === false, "MongoDB cart must not store the raw guest token.");
  assert(firstMutation.cart.items[0].availability === "AVAILABLE", "Inventory record should resolve as AVAILABLE.");

  const inventoryAfterAdd = await db.collection("inventory").findOne({ variantId: fixture.variantId });
  assert(inventoryAfterAdd.available === 5 && inventoryAfterAdd.reserved === 0 && inventoryAfterAdd.committed === 0, "Adding to cart must not reserve inventory.");

  const persistedRead = await service.readCurrentCart({ kind: "GUEST", guestToken: rawToken });
  assert(persistedRead.itemCount === 2 && persistedRead.items[0].lineTotal.amount === 25800, "Guest cart must persist across request-style reads.");

  await db.collection("products").updateOne(
    { _id: fixture.product._id, "variants.id": fixture.variantId },
    { $set: { "variants.$.price.amount": 11900, updatedAt: new Date() } },
  );
  const priceFreshRead = await service.readCurrentCart({ kind: "GUEST", guestToken: rawToken });
  assert(priceFreshRead.items[0].unitPrice.amount === 11900 && priceFreshRead.items[0].lineTotal.amount === 23800, "Cart view must reflect current ProductVariant price, not a cart snapshot.");

  const duplicateA = service.addItem({ kind: "GUEST", guestToken: rawToken }, { productId: fixture.productId, variantId: fixture.variantId, quantity: 1 });
  const duplicateB = service.addItem({ kind: "GUEST", guestToken: rawToken }, { productId: fixture.productId, variantId: fixture.variantId, quantity: 1 });
  const duplicateResults = await Promise.allSettled([duplicateA, duplicateB]);
  const duplicateWins = duplicateResults.filter((result) => result.status === "fulfilled").length;
  assert(duplicateWins >= 1, "At least one same-cart duplicate add should win.");
  assert(duplicateResults.every((result) => result.status === "fulfilled" || isVersionConflict(result.reason)), "Same-cart duplicate add losers must conflict safely.");
  const afterDuplicateAdds = await db.collection("carts").findOne({ _id: storedGuestCart._id });
  assert(afterDuplicateAdds.items.length === 1 && afterDuplicateAdds.items[0].quantity === 2 + duplicateWins, "Concurrent duplicate adds must not create duplicate embedded lines.");

  const versionBeforeConflict = afterDuplicateAdds.version;
  const staleA = service.updateItemQuantity(
    { kind: "GUEST", guestToken: rawToken },
    { productId: fixture.productId, variantId: fixture.variantId, quantity: 2, expectedVersion: versionBeforeConflict },
  );
  const staleB = service.updateItemQuantity(
    { kind: "GUEST", guestToken: rawToken },
    { productId: fixture.productId, variantId: fixture.variantId, quantity: 3, expectedVersion: versionBeforeConflict },
  );
  const staleResults = await Promise.allSettled([staleA, staleB]);
  assert(staleResults.filter((result) => result.status === "fulfilled").length === 1, "Exactly one same-version update must succeed.");
  assert(staleResults.filter((result) => result.status === "rejected" && isVersionConflict(result.reason)).length === 1, "Exactly one same-version update must return CONFLICT.");

  const refreshed = await db.collection("carts").findOne({ _id: storedGuestCart._id });
  assert(refreshed.expiresAt > storedGuestCart.expiresAt, "Successful guest mutations must refresh expiresAt.");

  const removed = await service.updateItemQuantity(
    { kind: "GUEST", guestToken: rawToken },
    { productId: fixture.productId, variantId: fixture.variantId, quantity: 0, expectedVersion: refreshed.version },
  );
  assert(removed.cart.itemCount === 0, "Updating quantity to zero must remove the line.");

  const readded = await service.addItem({ kind: "GUEST", guestToken: rawToken }, { productId: fixture.productId, variantId: fixture.variantId, quantity: 1 });
  const cleared = await service.clearCart({ kind: "GUEST", guestToken: rawToken }, { expectedVersion: readded.cart.version });
  assert(cleared.cart.itemCount === 0 && cleared.cart.checkoutEligible === false, "Clear cart must preserve active cart but remove lines.");

  const badProduct = await createFixtureProduct(db, { status: "ARCHIVED", price: 7500 });
  let rejectedArchived = false;
  try {
    await service.addItem({ kind: "GUEST" }, { productId: badProduct.productId, variantId: badProduct.variantId, quantity: 1 });
  } catch {
    rejectedArchived = true;
  }
  assert(rejectedArchived, "Archived products must be rejected before guest cart creation.");

  const expiredToken = firstMutation.setCookie.value.slice(0, -1) + (firstMutation.setCookie.value.endsWith("A") ? "B" : "A");
  const expiredCart = await db.collection("carts").insertOne({
    owner: { kind: "GUEST", guestTokenHash: hashGuestCartToken(expiredToken) },
    status: "ACTIVE",
    items: [],
    version: 0,
    expiresAt: new Date(Date.now() - 60_000),
    createdAt: new Date(Date.now() - 120_000),
    updatedAt: new Date(Date.now() - 120_000),
  });
  createdCartIds.push(expiredCart.insertedId);
  const expiredRead = await service.readCurrentCart({ kind: "GUEST", guestToken: expiredToken });
  assert(expiredRead.itemCount === 0, "Expired guest cart must read as empty.");
  const expiredAfterRead = await db.collection("carts").findOne({ _id: expiredCart.insertedId });
  assert(expiredAfterRead.status === "EXPIRED", "Expired active cart must be safely transitioned to EXPIRED.");
  const rotated = await service.addItem(
    { kind: "GUEST", guestToken: expiredToken },
    { productId: fixture.productId, variantId: fixture.variantId, quantity: 1 },
  );
  assert(rotated.setCookie?.value !== expiredToken, "Mutation after expired cart must rotate to a fresh token.");
  const rotatedHash = hashGuestCartToken(rotated.setCookie.value);
  const rotatedStored = await db.collection("carts").findOne({ "owner.guestTokenHash": rotatedHash });
  createdCartIds.push(rotatedStored._id);
  assert(rotatedStored.status === "ACTIVE", "Rotated guest cart must be a fresh ACTIVE cart.");

  const untracked = await createFixtureProduct(db, { price: 9900 });
  const cartCountBeforeUntracked = await db.collection("carts").countDocuments();
  let rejectedUntracked = false;
  try {
    await service.addItem(
      { kind: "GUEST" },
      { productId: untracked.productId, variantId: untracked.variantId, quantity: 1 },
    );
  } catch {
    rejectedUntracked = true;
  }
  assert(rejectedUntracked, "UNTRACKED inventory must not be newly added under the strict Stage 3.6 policy.");
  assert(await db.collection("carts").countDocuments() === cartCountBeforeUntracked, "Failed UNTRACKED add must not create an orphan guest cart.");

  const userId = new ObjectId().toHexString();
  const otherUserId = new ObjectId().toHexString();
  const userMutation = await service.addItem({ kind: "USER", userId }, { productId: fixture.productId, variantId: fixture.variantId, quantity: 1 });
  const userCart = await db.collection("carts").findOne({ "owner.kind": "USER", "owner.userId": userId });
  createdCartIds.push(userCart._id);
  assert(userMutation.setCookie === undefined, "USER cart mutations must not create guest cookies.");
  assert((await service.readCurrentCart({ kind: "USER", userId })).itemCount === 1, "Trusted USER cart must persist.");
  assert((await service.readCurrentCart({ kind: "USER", userId: otherUserId })).itemCount === 0, "Another USER context must not read the first user's cart.");

  console.log("CART_PERSISTENCE_CHECK: PASS");
} catch (error) {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.error(`CART_PERSISTENCE_CHECK: FAIL (${errorName})`);
  if (error instanceof Error) console.error(error.message);
  process.exitCode = 1;
} finally {
  const db = client.db();
  if (createdCartIds.length) await db.collection("carts").deleteMany({ _id: { $in: createdCartIds } });
  if (createdProductIds.length) await db.collection("products").deleteMany({ _id: { $in: createdProductIds } });
  if (createdVariantIds.length) await db.collection("inventory").deleteMany({ variantId: { $in: createdVariantIds } });
  await client.close();
  const { mongoClientPromise } = await import("../src/server/db/mongodb.ts");
  await (await mongoClientPromise).close();
}
