import assert from "node:assert/strict";
import fs from "node:fs";
import { ObjectId } from "mongodb";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) { const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry)); if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, ""); }
const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { hashPassword } = await import("../src/server/auth/password-hasher.ts");
const { loadUserSessionAuthority } = await import("../src/server/auth/session-authority.ts");
const { hashGuestCartToken } = await import("../src/server/cart/guest-cart-token.ts");
const { hashGuestWishlistToken } = await import("../src/server/wishlist/guest-wishlist-token.ts");
const { mergeGuestCartForAuthority, mergeGuestWishlistForAuthority } = await import("../src/server/commerce/guest-merge-service.ts");

const db = await getMongoDb(); const users = db.collection("users"); const credentials = db.collection("authCredentials"); const carts = db.collection("carts"); const wishlists = db.collection("wishlists"); const inventory = db.collection("inventory");
const userId = new ObjectId(); const now = new Date(); const tag = new ObjectId().toHexString(); const email = `stage48-p1-${tag}@example.test`; const cartToken = `cart-${tag}`.padEnd(43, "x").slice(0, 43); const wishlistToken = `wish-${tag}`.padEnd(43, "x").slice(0, 43);
const products = await db.collection("products").find({ status: "PUBLISHED" }).limit(2).toArray(); const product = products[0]; const secondProduct = products[1] ?? products[0]; const variant = product?.variants?.find((candidate) => candidate.isActive);
assert.ok(product && variant, "published product fixture is required"); const productId = product._id.toHexString(); const variantId = variant.id; const sku = `AURA-${tag.slice(0, 12).toUpperCase()}`;
const line = (quantity) => ({ productId, variantId, quantity });
const cartDoc = (id, owner, items, version = 0) => ({ _id: id, owner, status: "ACTIVE", items, version, ...(owner.kind === "GUEST" ? { expiresAt: new Date(Date.now() + 86400000) } : {}), createdAt: now, updatedAt: now });
const wishlistDoc = (id, owner, items, version = 0) => ({ _id: id, owner, items, version, ...(owner.kind === "GUEST" ? { expiresAt: new Date(Date.now() + 86400000) } : {}), createdAt: now, updatedAt: now });
let inventoryInserted = false; let userCartId; let guestCartId; let guestWishlistId; let userWishlistId; const guestCartHashes = new Set();
try {
  await users.insertOne({ _id: userId, email, normalizedEmail: email, firstName: "Merge", lastName: "Customer", role: "CUSTOMER", status: "ACTIVE", emailVerifiedAt: now, createdAt: now, updatedAt: now });
  await credentials.insertOne({ _id: new ObjectId(), userId: userId.toHexString(), passwordHash: await hashPassword("Stage48-P1-merge-password"), passwordHashVersion: 1, sessionVersion: 0, passwordChangedAt: now, createdAt: now, updatedAt: now });
  const existingInventory = await inventory.findOne({ variantId });
  if (!existingInventory) { await inventory.insertOne({ _id: new ObjectId(), variantId, sku, available: 10, reserved: 0, committed: 0, version: 0, updatedAt: now }); inventoryInserted = true; }
  const authority = await loadUserSessionAuthority(userId.toHexString()); assert.ok(authority);

  userCartId = new ObjectId(); guestCartId = new ObjectId(); guestCartHashes.add(hashGuestCartToken(cartToken));
  await carts.insertMany([cartDoc(userCartId, { kind: "USER", userId: userId.toHexString() }, [line(1)]), cartDoc(guestCartId, { kind: "GUEST", guestTokenHash: hashGuestCartToken(cartToken) }, [line(2)])]);
  const merged = await mergeGuestCartForAuthority(authority, cartToken); assert.deepEqual(merged, { status: "MERGED", importedCount: 1 });
  assert.equal((await carts.findOne({ _id: userCartId })).items[0].quantity, 3); assert.equal((await carts.findOne({ _id: guestCartId })).status, "CONVERTED");
  assert.deepEqual(await mergeGuestCartForAuthority(authority, cartToken), { status: "NOOP", importedCount: 0 });

  const invalidGuestId = new ObjectId(); const invalidToken = `${cartToken.slice(0, 40)}bad`; const invalidProductId = new ObjectId().toHexString(); guestCartHashes.add(hashGuestCartToken(invalidToken)); await carts.insertOne(cartDoc(invalidGuestId, { kind: "GUEST", guestTokenHash: hashGuestCartToken(invalidToken) }, [{ productId: invalidProductId, variantId, quantity: 1 }]));
  await assert.rejects(() => mergeGuestCartForAuthority(authority, invalidToken)); assert.equal((await carts.findOne({ _id: invalidGuestId })).status, "ACTIVE");

  const wishlistGuestId = new ObjectId(); guestWishlistId = wishlistGuestId; userWishlistId = new ObjectId(); await wishlists.insertMany([wishlistDoc(userWishlistId, { kind: "USER", userId: userId.toHexString() }, [{ productId, addedAt: now }]), wishlistDoc(wishlistGuestId, { kind: "GUEST", guestTokenHash: hashGuestWishlistToken(wishlistToken) }, [{ productId, addedAt: now }, { productId: secondProduct._id.toHexString(), addedAt: now }])]);
  const wishMerged = await mergeGuestWishlistForAuthority(authority, wishlistToken); assert.deepEqual(wishMerged, { status: "MERGED", importedCount: secondProduct._id.toHexString() === productId ? 0 : 1 }); assert.equal((await wishlists.findOne({ _id: userWishlistId })).items.length, secondProduct._id.toHexString() === productId ? 1 : 2); assert.equal(await wishlists.findOne({ _id: wishlistGuestId }), null);

  const concurrentToken = `${tag.slice(0, 30)}-concurrent`.padEnd(43, "y").slice(0, 43); const concurrentGuestId = new ObjectId(); guestCartHashes.add(hashGuestCartToken(concurrentToken)); await carts.insertOne(cartDoc(concurrentGuestId, { kind: "GUEST", guestTokenHash: hashGuestCartToken(concurrentToken) }, [line(1)])); const outcomes = await Promise.allSettled([mergeGuestCartForAuthority(authority, concurrentToken), mergeGuestCartForAuthority(authority, concurrentToken)]); assert.ok(outcomes.some((entry) => entry.status === "fulfilled")); const concurrentGuest = await carts.findOne({ _id: concurrentGuestId }); assert.equal(concurrentGuest.status, "CONVERTED");

  await credentials.updateOne({ userId: userId.toHexString() }, { $inc: { sessionVersion: 1 } }); await assert.rejects(() => mergeGuestWishlistForAuthority(authority, wishlistToken));
  console.log("STAGE48_P1_MERGE_CHECK: PASS (Atlas Cart/Wishlist merge, atomic invalid-cart preservation, deduplication, retry/concurrency safety, stale-session rejection, and fixture cleanup)");
} finally {
  await carts.deleteMany({ $or: [{ "owner.userId": userId.toHexString() }, { "owner.guestTokenHash": { $in: [...guestCartHashes] } }] });
  await wishlists.deleteMany({ $or: [{ "owner.userId": userId.toHexString() }, { "owner.guestTokenHash": hashGuestWishlistToken(wishlistToken) }] });
  await credentials.deleteMany({ userId: userId.toHexString() }); await users.deleteOne({ _id: userId }); if (inventoryInserted) await inventory.deleteOne({ variantId, sku }); await (await mongoClientPromise).close();
}
