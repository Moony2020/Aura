import assert from "node:assert/strict";
import fs from "node:fs";
import { ObjectId } from "mongodb";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) { const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry)); if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, ""); }
assert.ok(process.env.AUTH_SECRET, "AUTH_SECRET must be supplied by the test process");
const baseUrl = (process.env.AUTH_BASE_URL ?? "http://localhost:3012").replace(/\/$/, "");
const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { hashPassword } = await import("../src/server/auth/password-hasher.ts");
const db = await getMongoDb(); const users = db.collection("users"); const credentials = db.collection("authCredentials"); const orders = db.collection("orders");
const userId = new ObjectId(); const orderId = new ObjectId(); const now = new Date(); const fixtureTag = Date.now().toString(36); const email = `stage47-p2-ui-${fixtureTag}@example.test`; const password = "Stage47-P2-ui-password"; const orderNumber = `AURA-HISTORY-${fixtureTag.toUpperCase()}`; let cookies = new Map();
function updateCookies(response) { for (const setCookie of response.headers.getSetCookie?.() ?? (response.headers.get("set-cookie") ? [response.headers.get("set-cookie")] : [])) { const pair = setCookie.split(";", 1)[0]; const separator = pair.indexOf("="); if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1)); } }
function cookieHeader() { return [...cookies].map(([name, value]) => `${name}=${value}`).join("; "); }
const item = { productId: new ObjectId().toHexString(), variantId: "22222222-2222-4222-8222-222222222222", sku: "AURA-HISTORY-100", productName: "Historical Rose", variantName: "Eau de Parfum", volumeMl: 100, concentration: "Eau de Parfum", unitPrice: { amount: 7900, currency: "SEK" }, quantity: 1, lineTotal: { amount: 7900, currency: "SEK" } };
try {
  await users.insertOne({ _id: userId, email, normalizedEmail: email, firstName: "History", lastName: "Customer", role: "CUSTOMER", status: "ACTIVE", emailVerifiedAt: now, createdAt: now, updatedAt: now });
  await credentials.insertOne({ _id: new ObjectId(), userId: userId.toHexString(), passwordHash: await hashPassword(password), passwordHashVersion: 1, sessionVersion: 0, passwordChangedAt: now, createdAt: now, updatedAt: now });
  await orders.insertOne({ _id: orderId, userId: userId.toHexString(), orderNumber, items: [item], shippingAddress: { recipientFirstName: "Historical", recipientLastName: "Customer", addressLine1: "1 Snapshot Street", city: "Stockholm", postalCode: "11122", countryCode: "SE" }, totals: { subtotal: { amount: 7900, currency: "SEK" }, shipping: { amount: 0, currency: "SEK" }, tax: { amount: 0, currency: "SEK" }, discount: { amount: 0, currency: "SEK" }, total: { amount: 7900, currency: "SEK" } }, status: "CONFIRMED", paymentStatus: "PAID", fulfillmentStatus: "FULFILLED", inventoryReservationStatus: "COMMITTED", createdAt: now, updatedAt: now });
  const csrf = await fetch(`${baseUrl}/api/auth/csrf`); updateCookies(csrf); const { csrfToken } = await csrf.json();
  const login = await fetch(`${baseUrl}/api/auth/callback/credentials`, { method: "POST", redirect: "manual", headers: { cookie: cookieHeader(), "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ csrfToken, email, password, callbackUrl: `${baseUrl}/account`, json: "true" }) }); updateCookies(login); assert.ok([...cookies.keys()].some((name) => /session-token$/.test(name)), "session cookie missing");
  const page = await fetch(`${baseUrl}/account`, { headers: { cookie: cookieHeader() } }); assert.equal(page.status, 200); const html = await page.text(); assert.match(html, new RegExp(orderNumber)); assert.match(html, /Historical Rose/); assert.match(html, /79,00\s*kr|79,00\s*SEK|79,00/); assert.match(html, /Your Maison purchases/);
  console.log("ORDER_HISTORY_UI_RUNTIME_CHECK: PASS (authenticated Next Account renders Atlas-backed owned order number, historical item, total, and read-only detail from the safe P1 view model)");
} finally { await orders.deleteOne({ _id: orderId }); await credentials.deleteMany({ userId: userId.toHexString() }); await users.deleteOne({ _id: userId }); await (await mongoClientPromise).close(); }
