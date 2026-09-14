import assert from "node:assert/strict";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}
if (!process.env.AUTH_SECRET) process.env.AUTH_SECRET = randomBytes(32).toString("base64url");

const { decode, encode } = await import("next-auth/jwt");
const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { hashPassword } = await import("../src/server/auth/password-hasher.ts");
const { validateSessionToken } = await import("../src/server/auth/session-authority.ts");
const { MongoOrderRepository } = await import("../src/server/repositories/mongo-order-inventory-repository.ts");
const { getOrderHistoryDetailForAuthority, listOrderHistoryForAuthority } = await import("../src/server/order/order-history-service.ts");

const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const orders = db.collection("orders");
const suffix = new ObjectId().toHexString();
const fixtureIds = [];
const fixtureEmails = [];
const fixtureOrderIds = [];
const now = new Date();
const password = "Stage47-P1-order-history-password";

async function fixtureUser(label, status = "ACTIVE") {
  const id = new ObjectId(); const email = `stage47-p1-${label}-${suffix}@example.test`;
  fixtureIds.push(id); fixtureEmails.push(email);
  await users.insertOne({ _id: id, email, normalizedEmail: email, firstName: label, lastName: "Order", phone: "+46700000000", role: "CUSTOMER", status, emailVerifiedAt: status === "ACTIVE" ? now : null, createdAt: now, updatedAt: now });
  await credentials.insertOne({ _id: new ObjectId(), userId: id.toHexString(), passwordHash: await hashPassword(password), passwordHashVersion: 1, sessionVersion: 0, passwordChangedAt: now, createdAt: now, updatedAt: now });
  return id.toHexString();
}

async function authorityFor(userId, sessionVersion = 0) {
  const jwt = await encode({ secret: process.env.AUTH_SECRET, salt: "authjs.session-token", token: { sub: userId, sessionVersion } });
  const decoded = await decode({ secret: process.env.AUTH_SECRET, salt: "authjs.session-token", token: jwt });
  assert.ok(decoded); return validateSessionToken(decoded);
}

function orderInput(userId, orderNumber) {
  return { userId, orderNumber, items: [{ productId: new ObjectId().toHexString(), variantId: "11111111-1111-4111-8111-111111111111", sku: "AURA-ROSE-100", productName: "Historical Rose", variantName: "Eau de Parfum", volumeMl: 100, concentration: "Eau de Parfum", unitPrice: { amount: 7900, currency: "SEK" }, quantity: 1, lineTotal: { amount: 7900, currency: "SEK" } }], shippingAddress: { recipientFirstName: "Historical", recipientLastName: "Customer", addressLine1: "1 Snapshot Street", city: "Stockholm", postalCode: "11122", countryCode: "SE", phone: "+46701112233" }, totals: { subtotal: { amount: 7900, currency: "SEK" }, shipping: { amount: 0, currency: "SEK" }, tax: { amount: 0, currency: "SEK" }, discount: { amount: 0, currency: "SEK" }, total: { amount: 7900, currency: "SEK" } }, status: "CONFIRMED", paymentStatus: "PAID", fulfillmentStatus: "FULFILLED", inventoryReservationStatus: "COMMITTED" }; }

async function rejected(work, label) { await assert.rejects(work, undefined, label); }

try {
  const ownerId = await fixtureUser("owner"); const otherId = await fixtureUser("other"); const pendingId = await fixtureUser("pending", "PENDING"); const disabledId = await fixtureUser("disabled", "DISABLED");
  const ownerAuthority = await authorityFor(ownerId); const otherAuthority = await authorityFor(otherId);
  assert.ok(ownerAuthority); assert.ok(otherAuthority); assert.deepEqual(await listOrderHistoryForAuthority(ownerAuthority), []);
  const repo = new MongoOrderRepository();
  const created = await repo.create(orderInput(ownerId, `AURA-${suffix.slice(0, 10).toUpperCase()}`)); fixtureOrderIds.push(new ObjectId(created.id));
  const otherOrder = await repo.create(orderInput(otherId, `AURA-${suffix.slice(10, 20).toUpperCase()}`)); fixtureOrderIds.push(new ObjectId(otherOrder.id));
  const list = await listOrderHistoryForAuthority(ownerAuthority); assert.equal(list.length, 1); assert.equal(list[0].orderNumber, created.orderNumber); assert.equal("id" in list[0], false); assert.equal("userId" in list[0], false); assert.equal(list[0].items[0].productName, "Historical Rose"); assert.equal(list[0].shippingAddress.addressLine1, "1 Snapshot Street"); assert.equal(list[0].totals.total.amount, 7900); assert.equal(list[0].status, "CONFIRMED");
  const detail = await getOrderHistoryDetailForAuthority(ownerAuthority, created.id); assert.equal(detail.orderNumber, created.orderNumber);
  await rejected(() => getOrderHistoryDetailForAuthority(ownerAuthority, otherOrder.id), "cross-user detail must reject");
  await rejected(() => getOrderHistoryDetailForAuthority(ownerAuthority, "not-an-id"), "invalid order id must reject");
  for (const field of ["userId", "customerId", "ownerId", "accountId"]) await rejected(() => getOrderHistoryDetailForAuthority(ownerAuthority, { [field]: created.id }), `browser ${field} authority must reject`);
  await rejected(() => listOrderHistoryForAuthority(null), "unauthenticated list must reject"); assert.equal(await authorityFor(pendingId), null); assert.equal(await authorityFor(disabledId), null);
  await users.updateOne({ _id: new ObjectId(ownerId) }, { $set: { status: "DISABLED", updatedAt: new Date() } }); await rejected(() => listOrderHistoryForAuthority(ownerAuthority), "disabled-after-login list must reject"); await rejected(() => getOrderHistoryDetailForAuthority(ownerAuthority, created.id), "disabled-after-login detail must reject");
  await users.updateOne({ _id: new ObjectId(ownerId) }, { $set: { status: "ACTIVE", updatedAt: new Date() } }); await credentials.updateOne({ userId: ownerId }, { $inc: { sessionVersion: 1 }, $set: { updatedAt: new Date() } }); await rejected(() => listOrderHistoryForAuthority(ownerAuthority), "stale session list must reject"); await rejected(() => getOrderHistoryDetailForAuthority(ownerAuthority, created.id), "stale session detail must reject");
  console.log("ORDER_HISTORY_BOUNDARY_CHECK: PASS (Atlas-backed own list/detail, read-only safe view model, cross-user rejection, snapshot/totals integrity, ACTIVE/verified authority, disabled-after-login, stale sessionVersion, and cleanup)");
} finally {
  if (fixtureOrderIds.length) await orders.deleteMany({ _id: { $in: fixtureOrderIds } });
  if (fixtureIds.length) { const ids = fixtureIds.map((id) => id.toHexString()); await credentials.deleteMany({ userId: { $in: ids } }); await users.deleteMany({ _id: { $in: fixtureIds } }); assert.equal(await users.countDocuments({ normalizedEmail: { $in: fixtureEmails } }), 0); }
  await (await mongoClientPromise).close();
}
