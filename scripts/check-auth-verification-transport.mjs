import assert from "node:assert/strict";
import fs from "node:fs";
import { ObjectId } from "mongodb";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { registerCustomer } = await import("../src/server/auth/registration-service.ts");
const { GET, POST } = await import("../src/app/api/auth/verification/route.ts");
const { InMemoryEmailSender } = await import("../src/server/email/email-sender.ts");

const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const tokens = db.collection("authTokens");
const suffix = new ObjectId().toHexString();
const fixtureEmails = [
  `stage42-p3-transport-ready-${suffix}@example.test`,
  `stage42-p3-transport-expired-${suffix}@example.test`,
];
const password = "Stage42-P3-transport-password";

const inputFor = (email) => ({ email, firstName: "Transport", lastName: "Fixture", password, passwordConfirmation: password });
const registerFixture = async (email) => {
  const sender = new InMemoryEmailSender();
  const result = await registerCustomer(inputFor(email), { emailSender: sender, verificationOrigin: "https://aura.example.test" });
  assert.equal(result.ok, true);
  assert.equal(sender.messages.length, 1);
  const rawToken = new URL(sender.messages[0].verificationUrl).searchParams.get("token");
  assert.ok(rawToken);
  const user = await users.findOne({ normalizedEmail: email });
  assert.ok(user);
  return { rawToken, userId: user._id.toHexString() };
};

const stateRequest = (rawToken) => new Request(`https://aura.example.test/api/auth/verification?token=${encodeURIComponent(rawToken)}`);
const postRequest = (body) => new Request("https://aura.example.test/api/auth/verification", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const readJson = async (response) => ({ response, body: await response.json() });
const snapshot = async (userId) => ({
  user: await users.findOne({ _id: new ObjectId(userId) }),
  credential: await credentials.findOne({ userId }),
  token: await tokens.findOne({ userId, purpose: "EMAIL_VERIFICATION" }),
});

try {
  const readyFixture = await registerFixture(fixtureEmails[0]);
  const beforeReadyGets = await snapshot(readyFixture.userId);

  const ready = await readJson(await GET(stateRequest(readyFixture.rawToken)));
  assert.equal(ready.response.status, 200);
  assert.deepEqual(ready.body, { state: "READY" });
  assert.equal(ready.response.headers.get("cache-control"), "no-store");
  assert.equal(ready.response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(JSON.stringify(ready.body).includes(readyFixture.rawToken), false);
  assert.deepEqual(await snapshot(readyFixture.userId), beforeReadyGets);

  const repeatedReady = await readJson(await GET(stateRequest(readyFixture.rawToken)));
  assert.deepEqual(repeatedReady.body, { state: "READY" });
  assert.deepEqual(await snapshot(readyFixture.userId), beforeReadyGets);

  const authorityAttempt = await readJson(await POST(postRequest({
    token: readyFixture.rawToken,
    userId: "507f1f77bcf86cd799439011",
    email: "attacker@example.test",
    status: "ACTIVE",
    role: "ADMIN",
    tokenHash: "a".repeat(64),
    sessionVersion: 99,
  })));
  assert.equal(authorityAttempt.response.status, 400);
  assert.deepEqual(authorityAttempt.body, { ok: false, status: "INVALID" });
  assert.deepEqual(await snapshot(readyFixture.userId), beforeReadyGets);

  const activated = await readJson(await POST(postRequest({ token: readyFixture.rawToken })));
  assert.equal(activated.response.status, 200);
  assert.deepEqual(activated.body, { ok: true, status: "VERIFIED" });
  const afterActivation = await snapshot(readyFixture.userId);
  assert.equal(afterActivation.user.status, "ACTIVE");
  assert.ok(afterActivation.user.emailVerifiedAt instanceof Date);
  assert.ok(afterActivation.token.consumedAt instanceof Date);
  assert.deepEqual(afterActivation.credential, beforeReadyGets.credential);

  const used = await readJson(await GET(stateRequest(readyFixture.rawToken)));
  assert.deepEqual(used.body, { state: "USED" });
  assert.deepEqual(await snapshot(readyFixture.userId), afterActivation);

  const replay = await readJson(await POST(postRequest({ token: readyFixture.rawToken })));
  assert.equal(replay.response.status, 400);
  assert.deepEqual(replay.body, { ok: false, status: "USED" });
  assert.deepEqual(await snapshot(readyFixture.userId), afterActivation);

  const malformedJson = await readJson(await POST(new Request("https://aura.example.test/api/auth/verification", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "not-json",
  })));
  assert.equal(malformedJson.response.status, 400);
  assert.deepEqual(malformedJson.body, { ok: false, status: "INVALID" });

  const unknown = await readJson(await GET(stateRequest("unknown-transport-token")));
  assert.equal(unknown.response.status, 200);
  assert.deepEqual(unknown.body, { state: "INVALID" });

  const expiredFixture = await registerFixture(fixtureEmails[1]);
  const now = new Date();
  await tokens.updateOne({ userId: expiredFixture.userId, purpose: "EMAIL_VERIFICATION", consumedAt: null }, { $set: { expiresAt: new Date(now.getTime() - 1) } });
  const beforeExpiredGet = await snapshot(expiredFixture.userId);
  const expired = await readJson(await GET(stateRequest(expiredFixture.rawToken)));
  assert.equal(expired.response.status, 200);
  assert.deepEqual(expired.body, { state: "EXPIRED" });
  assert.deepEqual(await snapshot(expiredFixture.userId), beforeExpiredGet);

  const expiredPost = await readJson(await POST(postRequest({ token: expiredFixture.rawToken })));
  assert.equal(expiredPost.response.status, 400);
  assert.deepEqual(expiredPost.body, { ok: false, status: "EXPIRED" });
  assert.deepEqual(await snapshot(expiredFixture.userId), beforeExpiredGet);

  assert.equal(JSON.stringify(activated.body).includes(readyFixture.rawToken), false);
  assert.equal(JSON.stringify(activated.body).includes(readyFixture.userId), false);
  console.log("AUTH_VERIFICATION_TRANSPORT_CHECK: PASS (GET is non-mutating, POST delegates to atomic verification, safe token-only transport, privacy headers, replay/expiry handling, and browser-authority rejection)");
} finally {
  const fixtureUsers = await users.find({ normalizedEmail: { $in: fixtureEmails } }, { projection: { _id: 1 } }).toArray();
  const fixtureIds = fixtureUsers.map((row) => row._id);
  if (fixtureIds.length) {
    await credentials.deleteMany({ userId: { $in: fixtureIds.map((id) => id.toHexString()) } });
    await tokens.deleteMany({ userId: { $in: fixtureIds.map((id) => id.toHexString()) } });
    await users.deleteMany({ _id: { $in: fixtureIds } });
  }
  assert.equal(await users.countDocuments({ normalizedEmail: { $in: fixtureEmails } }), 0);
  assert.equal(await credentials.countDocuments({ userId: { $in: fixtureIds.map((id) => id.toHexString()) } }), 0);
  assert.equal(await tokens.countDocuments({ userId: { $in: fixtureIds.map((id) => id.toHexString()) } }), 0);
  await (await mongoClientPromise).close();
}
