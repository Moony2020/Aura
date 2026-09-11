import assert from "node:assert/strict";
import fs from "node:fs";
import { ObjectId } from "mongodb";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { registerCustomer } = await import("../src/server/auth/registration-service.ts");
const { classifyEmailVerificationToken, verifyEmailToken } = await import("../src/server/auth/verification-service.ts");
const { InMemoryEmailSender } = await import("../src/server/email/email-sender.ts");
const { hashAuthToken } = await import("../src/server/auth/verification-token.ts");

const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const tokens = db.collection("authTokens");
const suffix = new ObjectId().toHexString();
const password = "Stage42-P3-secure-password";
const emails = {
  verified: `stage42-p3-verified-${suffix}@example.test`,
  active: `stage42-p3-active-${suffix}@example.test`,
  expired: `stage42-p3-expired-${suffix}@example.test`,
  disabled: `stage42-p3-disabled-${suffix}@example.test`,
  concurrent: `stage42-p3-concurrent-${suffix}@example.test`,
};
const fixtureEmails = Object.values(emails);

const inputFor = (email) => ({ email, firstName: "Stage", lastName: "Three", password, passwordConfirmation: password });
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

try {
  const now = new Date();

  const verifiedFixture = await registerFixture(emails.verified);
  const verifiedCredentialBefore = await credentials.findOne({ userId: verifiedFixture.userId });
  assert.ok(verifiedCredentialBefore);
  assert.equal((await users.findOne({ _id: new ObjectId(verifiedFixture.userId) })).status, "PENDING");
  assert.equal((await tokens.findOne({ userId: verifiedFixture.userId })).consumedAt, null);

  const verified = await verifyEmailToken(verifiedFixture.rawToken, { now });
  assert.equal(verified.ok, true);
  assert.equal(verified.status, "VERIFIED");
  const verifiedUser = await users.findOne({ _id: new ObjectId(verifiedFixture.userId) });
  const verifiedToken = await tokens.findOne({ userId: verifiedFixture.userId });
  assert.equal(verifiedUser.status, "ACTIVE");
  assert.ok(verifiedUser.emailVerifiedAt instanceof Date);
  assert.ok(verifiedToken.consumedAt instanceof Date);
  assert.deepEqual(await credentials.findOne({ userId: verifiedFixture.userId }), verifiedCredentialBefore);

  const replay = await verifyEmailToken(verifiedFixture.rawToken, { now: new Date(now.getTime() + 1) });
  assert.deepEqual(replay, { ok: false, status: "USED" });

  const activeFixture = await registerFixture(emails.active);
  await users.updateOne({ _id: new ObjectId(activeFixture.userId) }, { $set: { status: "ACTIVE", emailVerifiedAt: now, updatedAt: now } });
  const active = await verifyEmailToken(activeFixture.rawToken, { now });
  assert.deepEqual(active, { ok: true, status: "ALREADY_ACTIVE" });
  assert.equal((await users.findOne({ _id: new ObjectId(activeFixture.userId) })).status, "ACTIVE");
  assert.ok((await tokens.findOne({ userId: activeFixture.userId })).consumedAt instanceof Date);

  const expiredFixture = await registerFixture(emails.expired);
  const expiredAt = new Date(now.getTime() - 1);
  await tokens.updateOne({ userId: expiredFixture.userId, consumedAt: null }, { $set: { expiresAt: expiredAt } });
  const expired = await verifyEmailToken(expiredFixture.rawToken, { now });
  assert.deepEqual(expired, { ok: false, status: "EXPIRED" });
  assert.equal((await users.findOne({ _id: new ObjectId(expiredFixture.userId) })).status, "PENDING");
  assert.equal((await tokens.findOne({ userId: expiredFixture.userId })).consumedAt, null);

  const disabledFixture = await registerFixture(emails.disabled);
  await users.updateOne({ _id: new ObjectId(disabledFixture.userId) }, { $set: { status: "DISABLED", updatedAt: now } });
  const disabled = await verifyEmailToken(disabledFixture.rawToken, { now });
  assert.deepEqual(disabled, { ok: true, status: "DISABLED" });
  assert.equal((await users.findOne({ _id: new ObjectId(disabledFixture.userId) })).status, "DISABLED");
  assert.ok((await tokens.findOne({ userId: disabledFixture.userId })).consumedAt instanceof Date);

  const concurrentFixture = await registerFixture(emails.concurrent);
  const concurrentResults = await Promise.all([
    verifyEmailToken(concurrentFixture.rawToken),
    verifyEmailToken(concurrentFixture.rawToken),
  ]);
  assert.equal(concurrentResults.filter((result) => result.ok && result.status === "VERIFIED").length, 1);
  assert.equal(concurrentResults.filter((result) => !result.ok && result.status === "USED").length, 1);
  assert.equal((await users.findOne({ _id: new ObjectId(concurrentFixture.userId) })).status, "ACTIVE");
  assert.ok((await tokens.findOne({ userId: concurrentFixture.userId })).consumedAt instanceof Date);

  const syntheticWrongPurpose = classifyEmailVerificationToken({ purpose: "PASSWORD_RESET", expiresAt: new Date(now.getTime() + 60_000), consumedAt: null }, now);
  assert.equal(syntheticWrongPurpose, "INVALID");

  const orphanRawToken = `orphan-${suffix}`;
  const orphanTokenHash = hashAuthToken(orphanRawToken);
  await tokens.insertOne({ _id: new ObjectId(), userId: new ObjectId().toHexString(), purpose: "EMAIL_VERIFICATION", tokenHash: orphanTokenHash, expiresAt: new Date(now.getTime() + 60_000), createdAt: now, consumedAt: null });
  await assert.rejects(() => verifyEmailToken(orphanRawToken, { now }));
  assert.equal((await tokens.findOne({ tokenHash: orphanTokenHash })).consumedAt, null);
  await tokens.deleteOne({ tokenHash: orphanTokenHash });
  const fixtureUserRows = await users.find({ normalizedEmail: { $in: fixtureEmails } }, { projection: { _id: 1 } }).toArray();
  const fixtureUserIds = fixtureUserRows.map((row) => row._id.toHexString());
  assert.equal(await tokens.countDocuments({ purpose: "PASSWORD_RESET", userId: { $in: fixtureUserIds } }), 0);

  console.log("AUTH_VERIFICATION_CHECK: PASS (atomic activation, hash/purpose/expiry enforcement, replay safety, disabled protection, concurrent one-winner behavior, and synthetic wrong-purpose separation)");
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
