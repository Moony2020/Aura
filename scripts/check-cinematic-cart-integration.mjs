import fs from "node:fs";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

function env(name) {
  if (process.env[name]) return process.env[name];
  if (!fs.existsSync(".env.local")) return undefined;
  return fs.readFileSync(".env.local", "utf8").split(/\r?\n/)
    .find((line) => new RegExp(`^\\s*${name}\\s*=`).test(line))
    ?.replace(new RegExp(`^\\s*${name}\\s*=\\s*`), "").trim().replace(/^"|"$/g, "");
}

const uri = env("MONGODB_URI");
if (!uri) {
  console.error("CINEMATIC_CART_INTEGRATION: FAIL (MONGODB_URI unavailable)");
  process.exit(1);
}
process.env.MONGODB_URI = uri;

const { resolveCinematicWorld } = await import("../src/server/cinematic/cinematic-world-service.ts");
const { createCartService } = await import("../src/server/cart/cart-service.ts");
const { hashGuestCartToken } = await import("../src/server/cart/guest-cart-token.ts");
const client = new MongoClient(uri, { appName: "aura-stage-3-10-cinematic-cart-check", serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }, serverSelectionTimeoutMS: 10_000 });
const createdIds = { inventory: [], carts: [] };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let connected = false;

try {
  await client.connect();
  connected = true;
  const db = client.db();
  const collection = await db.collection("collections").findOne({ slug: "cinematic-worlds" });
  assert(collection?.visibility === "HIDDEN", "cinematic-worlds must remain hidden.");
  assert(collection.productMemberships?.length === 6, "Expected exactly six cinematic memberships.");
  const worlds = [];
  for (let worldNumber = 1; worldNumber <= 6; worldNumber += 1) {
    const product = await resolveCinematicWorld(worldNumber);
    const activeVariants = product.variants.filter((variant) => variant.isActive);
    const inventories = await Promise.all(activeVariants.map((variant) => db.collection("inventory").findOne({ variantId: variant.id })));
    worlds.push({ world: worldNumber, product: product.name, publication: product.status, variants: activeVariants.length, inventory: activeVariants.length === 0 ? "NO_ACTIVE_VARIANT" : inventories.every(Boolean) ? inventories.map((item) => item.available > 0 ? "TRACKED_AVAILABLE" : "TRACKED_OUT_OF_STOCK").join(",") : "UNTRACKED", eligible: product.status === "PUBLISHED" && activeVariants.length === 1 && !!inventories[0] && inventories[0].available > 0 });
  }

  const target = worlds.find((world) => world.publication === "PUBLISHED" && world.variants === 1);
  assert(target, "No published single-variant cinematic fixture target exists.");
  const product = await resolveCinematicWorld(target.world);
  const variant = product.variants.find((candidate) => candidate.isActive);
  const existingInventory = await db.collection("inventory").findOne({ variantId: variant.id });
  if (!existingInventory) {
    const inventoryId = new ObjectId();
    await db.collection("inventory").insertOne({ _id: inventoryId, variantId: variant.id, sku: variant.sku, available: 2, reserved: 0, committed: 0, version: 0, updatedAt: new Date() });
    createdIds.inventory.push(inventoryId);
  }

  const service = createCartService();
  const added = await service.addItemBySlug({ kind: "GUEST" }, { productSlug: product.slug, variantId: variant.id, quantity: 1 });
  assert(added.setCookie && added.cart.itemCount === 1 && added.cart.items.length === 1, "Cinematic add must create one persistent guest-cart line.");
  assert(added.cart.items[0].productSlug === product.slug, "Returned cart must use canonical product identity.");
  const cart = await db.collection("carts").findOne({ "owner.guestTokenHash": hashGuestCartToken(added.setCookie.value) });
  assert(cart, "Successful cinematic add must persist a guest cart.");
  createdIds.carts.push(cart._id);
  console.log(`CINEMATIC_CART_INTEGRATION: PASS (six_mappings=6, successful_world=${target.world}, guest_item_count=${added.cart.itemCount}, reservation_calls=0)`);
  console.log(`CINEMATIC_WORLD_STATUS: ${JSON.stringify(worlds)}`);
} finally {
  if (connected) {
    const db = client.db();
    if (createdIds.carts.length) await db.collection("carts").deleteMany({ _id: { $in: createdIds.carts } });
    if (createdIds.inventory.length) await db.collection("inventory").deleteMany({ _id: { $in: createdIds.inventory } });
  }
  await client.close();
}
process.exit(0);
