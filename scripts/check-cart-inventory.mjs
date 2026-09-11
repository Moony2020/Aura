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
  console.error("CART_INVENTORY_CHECK: FAIL (MONGODB_URI unavailable)");
  process.exit(1);
}
process.env.MONGODB_URI = uri;

const { createCartService, isVersionConflict } = await import("../src/server/cart/cart-service.ts");
const { ERROR_CODES } = await import("../src/lib/errors/error-codes.ts");
const { hashGuestCartToken } = await import("../src/server/cart/guest-cart-token.ts");

const client = new MongoClient(uri, {
  appName: "aura-stage-3-6-cart-inventory-check",
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  serverSelectionTimeoutMS: 10_000,
});

const createdProductIds = [];
const createdCartIds = [];
const createdVariantIds = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isInsufficientInventory(error) {
  return error?.code === ERROR_CODES.INSUFFICIENT_INVENTORY;
}

function fixtureProduct({ status = "PUBLISHED", variantActive = true, slugPrefix = "stage-3-6-test" } = {}) {
  const productId = new ObjectId();
  const variantId = randomUUID();
  const sku = `S36-${productId.toHexString().slice(-8).toUpperCase()}`;
  createdProductIds.push(productId);
  createdVariantIds.push(variantId);
  return {
    _id: productId,
    slug: `${slugPrefix}-${productId.toHexString()}`,
    name: `Stage 3.6 Test Fragrance ${productId.toHexString().slice(-4)}`,
    brand: "AURA",
    description: "Temporary Stage 3.6 quantity and inventory fixture.",
    status,
    audience: "UNISEX",
    variants: [
      {
        id: variantId,
        sku,
        name: "100 ml",
        volumeMl: 100,
        concentration: "EAU_DE_PARFUM",
        price: { amount: 12900, currency: "USD" },
        isActive: variantActive,
      },
    ],
    media: [
      {
        id: randomUUID(),
        kind: "IMAGE",
        provider: "EXTERNAL",
        url: "https://example.com/stage-3-6-test.jpg",
        alt: "AURA Stage 3.6 temporary fragrance",
        position: 0,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function createProduct(db, options) {
  const product = fixtureProduct(options);
  product.primaryMediaId = product.media[0].id;
  await db.collection("products").insertOne(product);
  return { productId: product._id.toHexString(), variantId: product.variants[0].id, sku: product.variants[0].sku, slug: product.slug, product };
}

async function createInventory(db, fixture, available) {
  await db.collection("inventory").insertOne({
    _id: new ObjectId(),
    variantId: fixture.variantId,
    sku: fixture.sku,
    available,
    reserved: 0,
    committed: 0,
    version: 0,
    updatedAt: new Date(),
  });
}

async function expectRejects(operation, predicate, message) {
  try {
    await operation();
  } catch (error) {
    if (predicate(error)) return error;
    throw error;
  }
  throw new Error(message);
}

try {
  await client.connect();
  const db = client.db();
  const service = createCartService();

  const available = await createProduct(db);
  await createInventory(db, available, 2);

  const added = await service.addItemBySlug(
    { kind: "GUEST" },
    { productSlug: available.slug, variantId: available.variantId, quantity: 1 },
  );
  assert(added.setCookie, "First successful Add to Bag must create a guest cart cookie.");
  assert(added.cart.itemCount === 1 && added.cart.items[0].availability === "AVAILABLE", "AVAILABLE fixture must add to cart.");
  assert(added.cart.items[0].canIncrement === true && added.cart.items[0].canDecrement === true, "Quantity controls must expose safe increment/decrement flags.");
  assert(added.cart.checkoutEligible === true, "Tracked and quantity-valid cart should be checkout-eligible advisory state.");
  const token = added.setCookie.value;
  const cart = await db.collection("carts").findOne({ "owner.guestTokenHash": hashGuestCartToken(token) });
  createdCartIds.push(cart._id);

  const beforeCounters = await db.collection("inventory").findOne({ variantId: available.variantId });
  const raised = await service.updateItemQuantity(
    { kind: "GUEST", guestToken: token },
    { productId: available.productId, variantId: available.variantId, quantity: 2, expectedVersion: added.cart.version },
  );
  assert(raised.cart.itemCount === 2 && raised.cart.items[0].canIncrement === false, "Quantity can increase exactly to current availability and then disables increment.");
  await expectRejects(
    () => service.updateItemQuantity({ kind: "GUEST", guestToken: token }, { productId: available.productId, variantId: available.variantId, quantity: 3, expectedVersion: raised.cart.version }),
    isInsufficientInventory,
    "Quantity above current availability must reject.",
  );
  const lowered = await service.updateItemQuantity(
    { kind: "GUEST", guestToken: token },
    { productId: available.productId, variantId: available.variantId, quantity: 1, expectedVersion: raised.cart.version },
  );
  assert(lowered.cart.itemCount === 1, "Quantity decrement must work.");
  const removed = await service.updateItemQuantity(
    { kind: "GUEST", guestToken: token },
    { productId: available.productId, variantId: available.variantId, quantity: 0, expectedVersion: lowered.cart.version },
  );
  assert(removed.cart.itemCount === 0, "Quantity 1 to decrement-to-zero removes the line.");
  const afterCounters = await db.collection("inventory").findOne({ variantId: available.variantId });
  assert(beforeCounters.available === afterCounters.available && beforeCounters.reserved === afterCounters.reserved && beforeCounters.committed === afterCounters.committed, "Cart add/update/remove must not reserve, release, or commit inventory.");

  const outOfStock = await createProduct(db);
  await createInventory(db, outOfStock, 0);
  const cartCountBeforeFailedOutOfStock = await db.collection("carts").countDocuments();
  await expectRejects(
    () => service.addItem({ kind: "GUEST" }, { productId: outOfStock.productId, variantId: outOfStock.variantId, quantity: 1 }),
    isInsufficientInventory,
    "OUT_OF_STOCK Add to Bag must reject.",
  );
  assert(await db.collection("carts").countDocuments() === cartCountBeforeFailedOutOfStock, "Failed OUT_OF_STOCK Add must not create an orphan guest cart.");

  const untracked = await createProduct(db);
  const cartCountBeforeFailedUntracked = await db.collection("carts").countDocuments();
  await expectRejects(
    () => service.addItemBySlug({ kind: "GUEST" }, { productSlug: untracked.slug, variantId: untracked.variantId, quantity: 1 }),
    isInsufficientInventory,
    "UNTRACKED Add to Bag must reject under current policy.",
  );
  assert(await db.collection("carts").countDocuments() === cartCountBeforeFailedUntracked, "Failed UNTRACKED Add must not create an orphan guest cart.");

  const inactive = await createProduct(db, { variantActive: false });
  await createInventory(db, inactive, 5);
  await expectRejects(
    () => service.addItem({ kind: "GUEST" }, { productId: inactive.productId, variantId: inactive.variantId, quantity: 1 }),
    (error) => error?.code === ERROR_CODES.NOT_FOUND,
    "Inactive variants must be rejected.",
  );

  const archived = await createProduct(db, { status: "ARCHIVED" });
  await createInventory(db, archived, 5);
  await expectRejects(
    () => service.addItemBySlug({ kind: "GUEST" }, { productSlug: archived.slug, variantId: archived.variantId, quantity: 1 }),
    (error) => error?.code === ERROR_CODES.NOT_FOUND,
    "Archived/unpublished products must be rejected.",
  );

  await expectRejects(
    () => service.addItem({ kind: "GUEST" }, { productId: available.productId, variantId: outOfStock.variantId, quantity: 1 }),
    (error) => error?.code === ERROR_CODES.NOT_FOUND,
    "Variant must belong to the submitted product.",
  );

  await expectRejects(
    () => service.updateItemQuantity({ kind: "GUEST", guestToken: token }, { productId: available.productId, variantId: available.variantId, quantity: -1, expectedVersion: removed.cart.version }),
    (error) => error?.code === ERROR_CODES.VALIDATION_ERROR || error.name === "ZodError",
    "Negative quantities must reject.",
  );
  await expectRejects(
    () => service.addItem({ kind: "GUEST" }, { productId: available.productId, variantId: available.variantId, quantity: 1.5 }),
    (error) => error?.code === ERROR_CODES.VALIDATION_ERROR || error.name === "ZodError",
    "Decimal quantities must reject.",
  );

  const nearLimit = await createProduct(db);
  await createInventory(db, nearLimit, 2);
  const nearStart = await service.addItem({ kind: "GUEST" }, { productId: nearLimit.productId, variantId: nearLimit.variantId, quantity: 1 });
  const nearToken = nearStart.setCookie.value;
  const nearCart = await db.collection("carts").findOne({ "owner.guestTokenHash": hashGuestCartToken(nearToken) });
  createdCartIds.push(nearCart._id);
  const incA = service.addItem({ kind: "GUEST", guestToken: nearToken }, { productId: nearLimit.productId, variantId: nearLimit.variantId, quantity: 1 });
  const incB = service.addItem({ kind: "GUEST", guestToken: nearToken }, { productId: nearLimit.productId, variantId: nearLimit.variantId, quantity: 1 });
  const incResults = await Promise.allSettled([incA, incB]);
  assert(incResults.filter((result) => result.status === "fulfilled").length === 1, "One same-cart near-limit increment should win.");
  assert(
    incResults.filter((result) => result.status === "rejected" && (isVersionConflict(result.reason) || isInsufficientInventory(result.reason))).length === 1,
    "One same-cart near-limit increment should fail safely without overshooting.",
  );
  const nearStored = await db.collection("carts").findOne({ _id: nearCart._id });
  assert(nearStored.items[0].quantity === 2, "Concurrent same-cart increments must not overshoot available inventory.");

  const shared = await createProduct(db);
  await createInventory(db, shared, 1);
  const guestA = await service.addItem({ kind: "GUEST" }, { productId: shared.productId, variantId: shared.variantId, quantity: 1 });
  const guestB = await service.addItem({ kind: "GUEST" }, { productId: shared.productId, variantId: shared.variantId, quantity: 1 });
  createdCartIds.push((await db.collection("carts").findOne({ "owner.guestTokenHash": hashGuestCartToken(guestA.setCookie.value) }))._id);
  createdCartIds.push((await db.collection("carts").findOne({ "owner.guestTokenHash": hashGuestTokenSafe(guestB.setCookie.value) }))._id);
  assert(guestA.cart.itemCount === 1 && guestB.cart.itemCount === 1, "Different carts are purchase intent, not stock reservations.");
  const sharedCounters = await db.collection("inventory").findOne({ variantId: shared.variantId });
  assert(sharedCounters.available === 1 && sharedCounters.reserved === 0 && sharedCounters.committed === 0, "Different-cart adds must leave inventory counters unchanged.");

  const stale = await createProduct(db);
  await createInventory(db, stale, 3);
  const staleAdded = await service.addItem({ kind: "GUEST" }, { productId: stale.productId, variantId: stale.variantId, quantity: 3 });
  const staleToken = staleAdded.setCookie.value;
  createdCartIds.push((await db.collection("carts").findOne({ "owner.guestTokenHash": hashGuestCartToken(staleToken) }))._id);
  await db.collection("inventory").updateOne({ variantId: stale.variantId }, { $set: { available: 1, updatedAt: new Date() } });
  const staleRead = await service.readCurrentCart({ kind: "GUEST", guestToken: staleToken });
  assert(staleRead.items[0].availability === "AVAILABLE" && staleRead.items[0].quantityValid === false, "Stock drop after Cart Add must make the line quantity-invalid without silently mutating it.");
  assert(staleRead.items[0].canDecrement === true && staleRead.items[0].canIncrement === false && staleRead.checkoutEligible === false, "Stale lines must be reducible/removable and checkout-ineligible.");
  assert(JSON.stringify(staleRead).includes('"available":') === false && JSON.stringify(staleRead).includes('"reserved":') === false && JSON.stringify(staleRead).includes('"committed":') === false, "Cart view model must not expose raw inventory counters.");

  const activeProducts = await db.collection("products").find({ status: "PUBLISHED", slug: { $not: /^stage-3-6-test-/ } }).toArray();
  const sellableVariantIds = activeProducts.flatMap((product) => (product.variants ?? []).filter((variant) => variant.isActive).map((variant) => variant.id));
  const tracked = await db.collection("inventory").countDocuments({ variantId: { $in: sellableVariantIds } });
  const out = await db.collection("inventory").countDocuments({ variantId: { $in: sellableVariantIds }, available: { $lte: 0 } });
  console.log(`CART_INVENTORY_COVERAGE: total sellable variants ${sellableVariantIds.length}; TRACKED ${tracked}; UNTRACKED ${sellableVariantIds.length - tracked}; OUT_OF_STOCK ${out}`);
  console.log("CART_INVENTORY_CHECK: PASS");
} catch (error) {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.error(`CART_INVENTORY_CHECK: FAIL (${errorName})`);
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

function hashGuestTokenSafe(token) {
  return hashGuestCartToken(token);
}
