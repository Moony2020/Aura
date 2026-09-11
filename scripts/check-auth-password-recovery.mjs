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
const { passwordResetPurpose } = await import("../src/domain/auth/auth-token.schema.ts");
const { hashPassword, verifyPasswordHash } = await import("../src/server/auth/password-hasher.ts");
const { createPasswordResetToken, hashAuthToken } = await import("../src/server/auth/verification-token.ts");
const { inspectPasswordResetToken, requestPasswordReset, resetPassword } = await import("../src/server/auth/password-reset-service.ts");
const { validateSessionToken } = await import("../src/server/auth/session-authority.ts");
const { InMemoryEmailSender } = await import("../src/server/email/email-sender.ts");
const { MongoAuthCredentialsRepository } = await import("../src/server/repositories/mongo-auth-credentials-repository.ts");
const { MongoAuthTokenRepository } = await import("../src/server/repositories/mongo-auth-token-repository.ts");
const { MongoUserRepository } = await import("../src/server/repositories/mongo-user-repository.ts");

const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const tokens = db.collection("authTokens");
const suffix = new ObjectId().toHexString();
const password = "Stage44-original-secure-password";
const newPassword = "Stage44-new-secure-password";
const fixtureIds = [];
const fixtureEmails = [];
const now = new Date();
const userRepository = new MongoUserRepository();
const credentialRepository = new MongoAuthCredentialsRepository();
const tokenRepository = new MongoAuthTokenRepository();

async function createFixture(label, status = "ACTIVE") {
  const id = new ObjectId();
  const email = `stage44-${label}-${suffix}@example.test`;
  fixtureIds.push(id);
  fixtureEmails.push(email);
  await users.insertOne({ _id: id, email, normalizedEmail: email, firstName: "Stage", lastName: "Four", role: "CUSTOMER", status, emailVerifiedAt: status === "ACTIVE" ? now : null, createdAt: now, updatedAt: now });
  await credentials.insertOne({ _id: new ObjectId(), userId: id.toHexString(), passwordHash: await hashPassword(password), passwordHashVersion: 1, sessionVersion: 0, passwordChangedAt: now, createdAt: now, updatedAt: now });
  return { id: id.toHexString(), email };
}

async function createToken(userId, expiresAt = new Date(Date.now() + 60 * 60 * 1000)) {
  const generated = createPasswordResetToken(now);
  await tokens.insertOne({ _id: new ObjectId(), userId, purpose: passwordResetPurpose, tokenHash: generated.tokenHash, expiresAt, createdAt: now, consumedAt: null });
  return generated.rawToken;
}

class FailingCredentialRepository extends MongoAuthCredentialsRepository {
  async updatePasswordAndIncrementSessionVersion() { throw new Error("injected reset transaction failure"); }
}

try {
  const active = await createFixture("active");
  const pending = await createFixture("pending", "PENDING");
  const disabled = await createFixture("disabled", "DISABLED");

  const unknownSender = new InMemoryEmailSender();
  const unknown = await requestPasswordReset({ email: `unknown-${suffix}@example.test` }, { emailSender: unknownSender });
  assert.equal(unknown.ok, true);
  assert.equal(unknownSender.passwordResetMessages.length, 0);
  for (const fixture of [pending, disabled]) {
    const sender = new InMemoryEmailSender();
    const result = await requestPasswordReset({ email: fixture.email }, { emailSender: sender });
    assert.equal(result.ok, true);
    assert.equal(sender.passwordResetMessages.length, 0);
  }

  const sender = new InMemoryEmailSender();
  const requested = await requestPasswordReset({ email: active.email.toUpperCase() }, { emailSender: sender, resetOrigin: "http://localhost:3000" });
  assert.deepEqual(requested, { ok: true, accepted: true, emailDelivery: "SENT", message: "If an eligible account exists, password reset instructions will be sent." });
  assert.equal(sender.passwordResetMessages.length, 1);
  const firstRawToken = new URL(sender.passwordResetMessages[0].resetUrl).searchParams.get("token");
  assert.ok(firstRawToken);
  const firstStored = await tokens.findOne({ userId: active.id, purpose: passwordResetPurpose, consumedAt: null });
  assert.ok(firstStored);
  assert.equal(firstStored.tokenHash, hashAuthToken(firstRawToken));
  assert.equal(firstStored.tokenHash.includes(firstRawToken), false);
  assert.equal(JSON.stringify(firstStored).includes(firstRawToken), false);
  assert.equal(await inspectPasswordResetToken(firstRawToken), "READY");

  class FailingEmailSender extends InMemoryEmailSender {
    async sendPasswordReset() { throw new Error("injected delivery failure"); }
  }
  const failedDelivery = await requestPasswordReset({ email: active.email }, { emailSender: new FailingEmailSender() });
  assert.deepEqual(failedDelivery, { ok: true, accepted: true, emailDelivery: "PENDING", message: "If an eligible account exists, password reset instructions will be sent." });
  assert.equal((await tokens.findOne({ userId: active.id, purpose: passwordResetPurpose, consumedAt: null })) !== null, true);

  const secondSender = new InMemoryEmailSender();
  const second = await requestPasswordReset({ email: active.email }, { emailSender: secondSender });
  const secondRawToken = new URL(secondSender.passwordResetMessages[0].resetUrl).searchParams.get("token");
  assert.notEqual(secondRawToken, firstRawToken);
  assert.equal(await inspectPasswordResetToken(firstRawToken), "USED");
  assert.equal(await inspectPasswordResetToken(secondRawToken), "READY");

  const oldJwt = await encode({ secret: process.env.AUTH_SECRET, salt: "authjs.session-token", token: { sub: active.id, sessionVersion: 0 } });
  const oldJwtClaims = await decode({ token: oldJwt, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" });
  assert.ok(oldJwtClaims);
  const reset = await resetPassword({ token: secondRawToken, password: newPassword, passwordConfirmation: newPassword });
  assert.deepEqual(reset, { ok: true, status: "RESET", userId: active.id });
  const updatedCredential = await credentials.findOne({ userId: active.id });
  assert.equal(updatedCredential.sessionVersion, 1);
  assert.equal(await verifyPasswordHash(updatedCredential.passwordHash, newPassword), true);
  assert.equal(await verifyPasswordHash(updatedCredential.passwordHash, password), false);
  assert.equal(await validateSessionToken({ sub: oldJwtClaims.sub, sessionVersion: oldJwtClaims.sessionVersion }), null);
  assert.equal(await inspectPasswordResetToken(secondRawToken), "USED");
  assert.deepEqual(await resetPassword({ token: secondRawToken, password: "another-stage44-password", passwordConfirmation: "another-stage44-password" }), { ok: false, status: "USED" });

  const expiredToken = await createToken(active.id, new Date(Date.now() - 1000));
  assert.equal(await inspectPasswordResetToken(expiredToken), "EXPIRED");
  assert.deepEqual(await resetPassword({ token: expiredToken, password: "expired-stage44-password", passwordConfirmation: "expired-stage44-password" }), { ok: false, status: "EXPIRED" });

  const disabledToken = await createToken(disabled.id);
  const disabledBefore = await credentials.findOne({ userId: disabled.id });
  assert.deepEqual(await resetPassword({ token: disabledToken, password: newPassword, passwordConfirmation: newPassword }), { ok: false, status: "DISABLED" });
  assert.equal((await users.findOne({ _id: new ObjectId(disabled.id) })).status, "DISABLED");
  assert.equal((await credentials.findOne({ userId: disabled.id })).passwordHash, disabledBefore.passwordHash);

  const rollbackToken = await createToken(active.id);
  const beforeRollback = await credentials.findOne({ userId: active.id });
  let rollbackFailed = false;
  try {
    await resetPassword({ token: rollbackToken, password: "rollback-stage44-password", passwordConfirmation: "rollback-stage44-password" }, { repositories: { users: userRepository, credentials: new FailingCredentialRepository(), tokens: tokenRepository } });
  } catch { rollbackFailed = true; }
  assert.equal(rollbackFailed, true);
  assert.equal((await credentials.findOne({ userId: active.id })).sessionVersion, beforeRollback.sessionVersion);
  assert.equal((await tokens.findOne({ tokenHash: hashAuthToken(rollbackToken) })).consumedAt, null);

  const concurrentToken = await createToken(active.id);
  const concurrent = await Promise.all([
    resetPassword({ token: concurrentToken, password: "concurrent-one-stage44", passwordConfirmation: "concurrent-one-stage44" }),
    resetPassword({ token: concurrentToken, password: "concurrent-two-stage44", passwordConfirmation: "concurrent-two-stage44" }),
  ]);
  assert.equal(concurrent.filter((result) => result.ok).length, 1);
  assert.equal(concurrent.filter((result) => !result.ok && result.status === "USED").length, 1);

  console.log("AUTH_PASSWORD_RECOVERY_CHECK: PASS (Atlas-backed non-enumerating request, hash-only PASSWORD_RESET rotation, expiry/used/disabled protection, atomic Argon2id update, sessionVersion revocation, rollback, concurrency, and cleanup)");
} finally {
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
