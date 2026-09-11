import assert from "node:assert/strict";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}
if (!process.env.AUTH_SECRET) process.env.AUTH_SECRET = randomBytes(32).toString("base64url");

const serviceSource = fs.readFileSync("src/server/account/account-profile-service.ts", "utf8");
const actionSource = fs.readFileSync("src/server/account/actions.ts", "utf8");
assert.match(serviceSource, /requireCurrentSessionAuthority/);
assert.match(serviceSource, /userProfileUpdateSchema\.parse/);
assert.match(serviceSource, /updateProfile\(user\.id, profile\)/);
assert.doesNotMatch(serviceSource, /addresses|wishlist|cart|order/i);
assert.match(actionSource, /Object\.fromEntries\(formData\)/);

const { decode, encode } = await import("next-auth/jwt");
const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { hashPassword } = await import("../src/server/auth/password-hasher.ts");
const { validateSessionToken } = await import("../src/server/auth/session-authority.ts");
const { getAccountProfileForAuthority, updateAccountProfileForAuthority } = await import("../src/server/account/account-profile-service.ts");

const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const tokens = db.collection("authTokens");
const suffix = new ObjectId().toHexString();
const fixtureIds = [];
const fixtureEmails = [];
const now = new Date();
const password = "Stage45-P1-secure-password";

async function createFixture(label, status = "ACTIVE") {
  const id = new ObjectId();
  const email = `stage45-p1-${label}-${suffix}@example.test`;
  fixtureIds.push(id);
  fixtureEmails.push(email);
  await users.insertOne({ _id: id, email, normalizedEmail: email, firstName: `Before-${label}`, lastName: "Profile", phone: "+46700000000", role: "CUSTOMER", status, emailVerifiedAt: status === "ACTIVE" ? now : null, createdAt: now, updatedAt: now });
  await credentials.insertOne({ _id: new ObjectId(), userId: id.toHexString(), passwordHash: await hashPassword(password), passwordHashVersion: 1, sessionVersion: 0, passwordChangedAt: now, createdAt: now, updatedAt: now });
  return { id: id.toHexString(), email };
}

async function authorityFor(userId, sessionVersion = 0) {
  const jwt = await encode({ secret: process.env.AUTH_SECRET, salt: "authjs.session-token", token: { sub: userId, sessionVersion } });
  const decoded = await decode({ secret: process.env.AUTH_SECRET, salt: "authjs.session-token", token: jwt });
  assert.ok(decoded);
  return validateSessionToken(decoded);
}

async function expectRejected(work, label) { await assert.rejects(work, undefined, label); }

try {
  const active = await createFixture("active");
  const secondUser = await createFixture("second");
  const pending = await createFixture("pending", "PENDING");
  const disabled = await createFixture("disabled", "DISABLED");

  const activeAuthority = await authorityFor(active.id);
  assert.ok(activeAuthority);
  const safeRead = await getAccountProfileForAuthority(activeAuthority);
  assert.deepEqual(Object.keys(safeRead).sort(), ["email", "firstName", "lastName", "phone"]);
  assert.equal(safeRead.email, active.email);
  assert.equal("id" in safeRead, false);
  assert.equal("role" in safeRead, false);
  assert.equal("status" in safeRead, false);
  assert.equal("sessionVersion" in safeRead, false);

  const beforeUpdate = await users.findOne({ _id: new ObjectId(active.id) });
  const beforeCredential = await credentials.findOne({ userId: active.id });
  const updated = await updateAccountProfileForAuthority(activeAuthority, { firstName: "Updated", lastName: "Account", phone: "+46701112233" });
  assert.deepEqual(updated, { email: active.email, firstName: "Updated", lastName: "Account", phone: "+46701112233" });
  const afterUpdate = await users.findOne({ _id: new ObjectId(active.id) });
  const afterCredential = await credentials.findOne({ userId: active.id });
  assert.equal(afterUpdate.firstName, "Updated");
  assert.equal(afterUpdate.lastName, "Account");
  assert.equal(afterUpdate.phone, "+46701112233");
  for (const field of ["_id", "email", "normalizedEmail", "role", "status", "emailVerifiedAt", "createdAt"]) assert.deepEqual(afterUpdate[field], beforeUpdate[field], `protected user field changed: ${field}`);
  for (const field of ["userId", "passwordHash", "passwordHashVersion", "sessionVersion", "passwordChangedAt", "createdAt"]) assert.deepEqual(afterCredential[field], beforeCredential[field], `credential field changed: ${field}`);

  await expectRejected(() => getAccountProfileForAuthority(null), "unauthenticated account read must reject");
  await expectRejected(() => updateAccountProfileForAuthority(null, { firstName: "Denied" }), "unauthenticated profile update must reject");
  assert.equal(await authorityFor(pending.id), null, "PENDING users cannot establish account authority");
  assert.equal(await authorityFor(disabled.id), null, "DISABLED users cannot establish account authority");

  const secondBefore = await users.findOne({ _id: new ObjectId(secondUser.id) });
  await expectRejected(() => updateAccountProfileForAuthority(activeAuthority, { firstName: "Attack", userId: secondUser.id }), "client-selected userId must be rejected");
  assert.deepEqual(await users.findOne({ _id: new ObjectId(secondUser.id) }), secondBefore, "cross-user payload changed the second account");

  const protectedSnapshot = await users.findOne({ _id: new ObjectId(active.id) });
  for (const [field, value] of Object.entries({ role: "ADMIN", status: "DISABLED", sessionVersion: 9, emailVerifiedAt: new Date(), email: "attacker@example.test", normalizedEmail: "attacker@example.test", password: "attacker-password", passwordHash: "attacker-hash", authCredentials: {}, authTokens: [], permissions: ["ADMIN"], addresses: [], orders: [], cartId: secondUser.id, wishlistId: secondUser.id, _id: new ObjectId() })) {
    await expectRejected(() => updateAccountProfileForAuthority(activeAuthority, { firstName: "Attack", [field]: value }), `protected field must reject: ${field}`);
    const current = await users.findOne({ _id: new ObjectId(active.id) });
    for (const protectedField of ["email", "normalizedEmail", "role", "status", "emailVerifiedAt", "createdAt"]) assert.deepEqual(current[protectedField], protectedSnapshot[protectedField], `attack changed ${protectedField}`);
  }

  await credentials.updateOne({ userId: active.id }, { $inc: { sessionVersion: 1 }, $set: { updatedAt: new Date() } });
  assert.equal(await authorityFor(active.id, 0), null, "old JWT must become stale after sessionVersion increment");
  await expectRejected(() => getAccountProfileForAuthority(null), "stale authority must reject account read");
  await expectRejected(() => updateAccountProfileForAuthority(null, { firstName: "Stale" }), "stale authority must reject profile update");

  console.log("AUTH_ACCOUNT_PROFILE_CHECK: PASS (Atlas-backed canonical safe account reads, strict profile allowlist, protected-field/cross-user rejection, ACTIVE/verified authority, sessionVersion revocation, and cleanup)");
} finally {
  const userIds = fixtureIds.map((id) => id.toHexString());
  if (fixtureIds.length) {
    await credentials.deleteMany({ userId: { $in: userIds } });
    await tokens.deleteMany({ userId: { $in: userIds } });
    await users.deleteMany({ _id: { $in: fixtureIds } });
  }
  assert.equal(await users.countDocuments({ normalizedEmail: { $in: fixtureEmails } }), 0, "user fixtures were not cleaned up");
  assert.equal(await credentials.countDocuments({ userId: { $in: userIds } }), 0, "credential fixtures were not cleaned up");
  assert.equal(await tokens.countDocuments({ userId: { $in: userIds } }), 0, "token fixtures were not cleaned up");
  await (await mongoClientPromise).close();
}
