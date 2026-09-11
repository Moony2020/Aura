import fs from "node:fs";
import crypto from "node:crypto";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
const uri = process.env.MONGODB_URI ?? line?.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
if (!uri) throw new Error("MONGODB_URI is unavailable.");
const client = new MongoClient(uri, { appName: "aura-stage-1-9-concurrency-check", serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }, serverSelectionTimeoutMS: 10000 });
await client.connect();
const db = client.db();
const variantId = crypto.randomUUID();
const sku = `CHECK-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
const inventory = db.collection("inventory");
const reservations = db.collection("inventoryReservations");
const orders = db.collection("orders");
const orderNumber = `AURA-CHECK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
try {
  await inventory.insertOne({ variantId, sku, available: 1, reserved: 0, committed: 0, version: 0, updatedAt: new Date() });
  const reserve = async () => {
    const session = client.startSession();
    try {
      let ok = false;
      await session.withTransaction(async () => {
        const row = await inventory.findOneAndUpdate({ variantId, available: { $gte: 1 } }, { $inc: { available: -1, reserved: 1, version: 1 } }, { returnDocument: "after", session });
        if (!row) throw new Error("SOLD_OUT");
        await reservations.insertOne({ _id: new ObjectId(), variantId, quantity: 1, status: "ACTIVE", expiresAt: new Date(Date.now() + 3600000), createdAt: new Date(), updatedAt: new Date() }, { session });
        ok = true;
      });
      return ok;
    } catch { return false; } finally { await session.endSession(); }
  };
  const results = await Promise.all([reserve(), reserve()]);
  if (results.filter(Boolean).length !== 1) throw new Error("Concurrent reservation invariant failed.");
  const active = await reservations.findOne({ variantId, status: "ACTIVE" });
  if (!active) throw new Error("Missing active reservation.");
  const released = await reservations.findOneAndUpdate({ _id: active._id, status: "ACTIVE" }, { $set: { status: "RELEASED", updatedAt: new Date() } }, { returnDocument: "after" });
  if (!released) throw new Error("Release failed.");
  await inventory.updateOne({ variantId, reserved: { $gte: active.quantity } }, { $inc: { available: active.quantity, reserved: -active.quantity } });
  const duplicateRelease = await reservations.findOneAndUpdate({ _id: active._id, status: "ACTIVE" }, { $set: { status: "RELEASED" } }, { returnDocument: "after" });
  if (duplicateRelease) throw new Error("Duplicate release was accepted.");
  const order = { orderNumber, userId: "507f1f77bcf86cd799439011", items: [{}], shippingAddress: {}, totals: {}, status: "PENDING", paymentStatus: "UNPAID", fulfillmentStatus: "UNFULFILLED", inventoryReservationStatus: "NONE", createdAt: new Date(), updatedAt: new Date() };
  await orders.insertOne(order);
  let duplicateRejected = false;
  try { await orders.insertOne({ ...order, _id: new ObjectId() }); } catch { duplicateRejected = true; }
  if (!duplicateRejected) throw new Error("Duplicate order number was accepted.");
  console.log("PASS: concurrent reservation, release idempotency guard, and order-number uniqueness are enforced.");
} finally {
  await inventory.deleteMany({ variantId }); await reservations.deleteMany({ variantId }); await orders.deleteMany({ orderNumber }); await client.close();
}
