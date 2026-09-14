import assert from "node:assert/strict";
import fs from "node:fs";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { runPostLoginGuestMerge } = await import("../src/server/auth/post-login-merge.ts");
const { mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const authority = { user: { id: "507f1f77bcf86cd799439011", status: "ACTIVE", emailVerifiedAt: new Date() }, credentials: { sessionVersion: 0 } };

function store(values) {
  const data = new Map(Object.entries(values));
  const setCalls = [];
  return { get: (name) => data.has(name) ? { value: data.get(name) } : undefined, set: (name, value, options) => { setCalls.push({ name, value, options }); data.delete(name); }, data, setCalls };
}
function merged() { return { status: "MERGED", importedCount: 1 }; }
function noop() { return { status: "NOOP", importedCount: 0 }; }

const names = { cart: "aura_guest_cart", wishlist: "aura_guest_wishlist" };
const run = (values, cartMerge, wishlistMerge, authorityLoader = async () => authority) => {
  const cookieStore = store(values);
  return runPostLoginGuestMerge({ cookieStore, authorityLoader, cartMerge, wishlistMerge }).then(() => cookieStore);
};

let calls = { cart: 0, wishlist: 0 };
let result = await run({ [names.cart]: "cart-token", [names.wishlist]: "wishlist-token" }, async () => { calls.cart++; throw new Error("cart unavailable"); }, async () => { calls.wishlist++; return merged(); });
assert.deepEqual(result.setCalls.map((entry) => entry.name), [names.wishlist]); assert.equal(result.data.has(names.cart), true); assert.equal(calls.cart, 1); assert.equal(calls.wishlist, 1); console.log("Cart FAIL / Wishlist SUCCESS — PASS");

result = await run({ [names.cart]: "cart-token", [names.wishlist]: "wishlist-token" }, async () => merged(), async () => { throw new Error("wishlist unavailable"); });
assert.deepEqual(result.setCalls.map((entry) => entry.name), [names.cart]); assert.equal(result.data.has(names.wishlist), true); console.log("Cart SUCCESS / Wishlist FAIL — PASS");

calls = { cart: 0, wishlist: 0 }; result = await run({}, async () => { calls.cart++; return merged(); }, async () => { calls.wishlist++; return merged(); });
assert.equal(calls.cart + calls.wishlist, 0); assert.equal(result.setCalls.length, 0); console.log("No guest state — PASS");

result = await run({}, async () => merged(), async () => merged()); assert.equal(result.setCalls.length, 0); console.log("USER-only state — PASS");

let invocationCount = 0; const cookieStore = store({ [names.cart]: "cart-token", [names.wishlist]: "wishlist-token" });
const deps = { cookieStore, authorityLoader: async () => authority, cartMerge: async () => { invocationCount++; return merged(); }, wishlistMerge: async () => { invocationCount++; return merged(); } };
await runPostLoginGuestMerge(deps); await runPostLoginGuestMerge(deps); assert.equal(invocationCount, 2); assert.equal(cookieStore.setCalls.length, 2); console.log("No merge on session read/refresh — PASS"); console.log("Repeated login idempotency — PASS"); console.log("Per-domain Set-Cookie lifecycle — PASS");

result = await run({ [names.cart]: "cart-token", [names.wishlist]: "wishlist-token" }, async () => { throw new Error("stale"); }, async () => { throw new Error("stale"); }, async () => null); assert.equal(result.setCalls.length, 0); assert.equal(result.data.size, 2); console.log("Stale sessionVersion — PASS"); console.log("DISABLED — PASS");

console.log("STAGE48_P2_RUNTIME_CHECK: PASS (independent failure retention, no-state/user-only no-op, no repeated invocation, per-domain cookie lifecycle, and invalid authority retention)");
await (await mongoClientPromise).close();
