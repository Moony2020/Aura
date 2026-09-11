import assert from "node:assert/strict";
import fs from "node:fs";
import { ObjectId } from "mongodb";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { hashPassword, verifyPasswordHash } = await import("../src/server/auth/password-hasher.ts");
const { createPasswordResetToken } = await import("../src/server/auth/verification-token.ts");
const { passwordResetPurpose } = await import("../src/domain/auth/auth-token.schema.ts");

const baseUrl = (process.env.AURA_DEV_URL ?? "http://localhost:3018").replace(/\/$/, "");
const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const tokens = db.collection("authTokens");
const id = new ObjectId();
const userId = id.toHexString();
const email = `stage44-runtime-${userId}@example.test`;
const originalPassword = "Stage44-runtime-original-password";
const nextPassword = "Stage44-runtime-next-password";
const now = new Date();
const generated = createPasswordResetToken(now);

try {
  await users.insertOne({ _id: id, email, normalizedEmail: email, firstName: "Stage", lastName: "Runtime", role: "CUSTOMER", status: "ACTIVE", emailVerifiedAt: now, createdAt: now, updatedAt: now });
  await credentials.insertOne({ _id: new ObjectId(), userId, passwordHash: await hashPassword(originalPassword), passwordHashVersion: 1, sessionVersion: 0, passwordChangedAt: now, createdAt: now, updatedAt: now });
  await tokens.insertOne({ _id: new ObjectId(), userId, purpose: passwordResetPurpose, tokenHash: generated.tokenHash, expiresAt: generated.expiresAt, createdAt: now, consumedAt: null });

  const inspected = await fetch(`${baseUrl}/api/auth/password-reset?token=${encodeURIComponent(generated.rawToken)}`, { cache: "no-store" });
  assert.equal(inspected.status, 200);
  assert.deepEqual(await inspected.json(), { state: "READY" });
  assert.equal((await tokens.findOne({ userId, purpose: passwordResetPurpose })).consumedAt, null);
  assert.equal((await users.findOne({ _id: id })).status, "ACTIVE");

  const reset = await fetch(`${baseUrl}/api/auth/password-reset`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: generated.rawToken, password: nextPassword, passwordConfirmation: nextPassword }),
    cache: "no-store",
  });
  const resetPayload = await reset.json();
  assert.equal(reset.status, 200);
  assert.deepEqual(resetPayload, { ok: true, status: "RESET", userId });
  const credential = await credentials.findOne({ userId });
  assert.equal(credential.sessionVersion, 1);
  assert.equal(await verifyPasswordHash(credential.passwordHash, nextPassword), true);
  assert.equal(await verifyPasswordHash(credential.passwordHash, originalPassword), false);
  assert.ok((await tokens.findOne({ userId, purpose: passwordResetPurpose })).consumedAt instanceof Date);

  const usedInspection = await fetch(`${baseUrl}/api/auth/password-reset?token=${encodeURIComponent(generated.rawToken)}`, { cache: "no-store" });
  assert.equal(usedInspection.status, 200);
  assert.deepEqual(await usedInspection.json(), { state: "USED" });
  const replay = await fetch(`${baseUrl}/api/auth/password-reset`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: generated.rawToken, password: "Stage44-runtime-replay-password", passwordConfirmation: "Stage44-runtime-replay-password" }),
    cache: "no-store",
  });
  assert.equal(replay.status, 400);
  assert.deepEqual(await replay.json(), { ok: false, status: "USED" });

  const unknown = await fetch(`${baseUrl}/api/auth/password-reset/request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `unknown-${userId}@example.test` }),
    cache: "no-store",
  });
  assert.equal(unknown.status, 202);
  assert.deepEqual(await unknown.json(), { ok: true, accepted: true, emailDelivery: "PENDING", message: "If an eligible account exists, password reset instructions will be sent." });

  console.log(`AUTH_PASSWORD_RECOVERY_RUNTIME_CHECK: PASS (real Next GET remained non-mutating, explicit POST reset the Atlas fixture, replay was rejected, sessionVersion incremented, and unknown request stayed non-enumerating at ${baseUrl})`);
} finally {
  await credentials.deleteMany({ userId });
  await tokens.deleteMany({ userId });
  await users.deleteOne({ _id: id });
  assert.equal(await users.countDocuments({ normalizedEmail: email }), 0);
  assert.equal(await credentials.countDocuments({ userId }), 0);
  assert.equal(await tokens.countDocuments({ userId }), 0);
  await (await mongoClientPromise).close();
}
