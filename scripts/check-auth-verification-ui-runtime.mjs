import assert from "node:assert/strict";
import fs from "node:fs";
import { ObjectId } from "mongodb";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { registerCustomer } = await import("../src/server/auth/registration-service.ts");
const { InMemoryEmailSender } = await import("../src/server/email/email-sender.ts");

const baseUrl = (process.env.AURA_DEV_URL ?? "http://localhost:3000").replace(/\/$/, "");
const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const tokens = db.collection("authTokens");
const suffix = new ObjectId().toHexString();
const email = `stage42-p3-ui-${suffix}@example.test`;
const password = "Stage42-P3-ui-runtime-password";
let userId = null;

try {
  const sender = new InMemoryEmailSender();
  const registration = await registerCustomer({ email, firstName: "UI", lastName: "Fixture", password, passwordConfirmation: password }, {
    emailSender: sender,
    verificationOrigin: baseUrl,
  });
  assert.equal(registration.ok, true);
  const rawToken = new URL(sender.messages[0].verificationUrl).searchParams.get("token");
  assert.ok(rawToken);
  const user = await users.findOne({ normalizedEmail: email });
  assert.ok(user);
  userId = user._id.toHexString();

  const page = await fetch(`${baseUrl}/verify-email?token=${encodeURIComponent(rawToken)}`, { redirect: "manual" });
  await page.text();
  assert.equal(page.status, 200);

  const inspection = await fetch(`${baseUrl}/api/auth/verification?token=${encodeURIComponent(rawToken)}`, { cache: "no-store" });
  assert.equal(inspection.status, 200);
  assert.deepEqual(await inspection.json(), { state: "READY" });
  assert.equal((await users.findOne({ _id: new ObjectId(userId) })).status, "PENDING");
  assert.equal((await tokens.findOne({ userId, purpose: "EMAIL_VERIFICATION" })).consumedAt, null);

  const explicitMutation = await fetch(`${baseUrl}/api/auth/verification`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: rawToken }),
  });
  assert.equal(explicitMutation.status, 200);
  assert.deepEqual(await explicitMutation.json(), { ok: true, status: "VERIFIED" });
  assert.equal((await users.findOne({ _id: new ObjectId(userId) })).status, "ACTIVE");
  assert.ok((await users.findOne({ _id: new ObjectId(userId) })).emailVerifiedAt instanceof Date);
  assert.ok((await tokens.findOne({ userId, purpose: "EMAIL_VERIFICATION" })).consumedAt instanceof Date);
  assert.equal((await credentials.findOne({ userId })).sessionVersion, 0);

  const cleanPage = await fetch(`${baseUrl}/verify-email`, { redirect: "manual" });
  assert.equal(cleanPage.status, 200);
  console.log(`AUTH_VERIFICATION_UI_RUNTIME_CHECK: PASS (real Next page ${baseUrl}/verify-email, GET READY left User PENDING, explicit POST produced SUCCESS/ACTIVE, and sessionVersion remained 0)`);
} finally {
  if (userId) {
    await credentials.deleteMany({ userId });
    await tokens.deleteMany({ userId });
    await users.deleteOne({ _id: new ObjectId(userId) });
  }
  assert.equal(await users.countDocuments({ normalizedEmail: email }), 0);
  await (await mongoClientPromise).close();
}
