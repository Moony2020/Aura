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
const { MongoAddressRepository } = await import("../src/server/repositories/mongo-user-repository.ts");
const { createAddressForAuthority, listCurrentAddressesForAuthority, updateAddressForAuthority, deleteAddressForAuthority } = await import("../src/server/account/address-service.ts");

const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const addresses = db.collection("addresses");
const suffix = new ObjectId().toHexString();
const fixtureIds = [];
const fixtureEmails = [];
const now = new Date();
const password = "Stage46-P1-address-password";

async function createFixture(label, status = "ACTIVE") {
  const id = new ObjectId();
  const email = `stage46-p1-${label}-${suffix}@example.test`;
  fixtureIds.push(id);
  fixtureEmails.push(email);
  await users.insertOne({ _id: id, email, normalizedEmail: email, firstName: label, lastName: "Address", phone: "+46700000000", role: "CUSTOMER", status, emailVerifiedAt: status === "ACTIVE" ? now : null, createdAt: now, updatedAt: now });
  await credentials.insertOne({ _id: new ObjectId(), userId: id.toHexString(), passwordHash: await hashPassword(password), passwordHashVersion: 1, sessionVersion: 0, passwordChangedAt: now, createdAt: now, updatedAt: now });
  return { id: id.toHexString(), email };
}

async function authorityFor(userId, sessionVersion = 0) {
  const jwt = await encode({ secret: process.env.AUTH_SECRET, salt: "authjs.session-token", token: { sub: userId, sessionVersion } });
  const decoded = await decode({ secret: process.env.AUTH_SECRET, salt: "authjs.session-token", token: jwt });
  assert.ok(decoded);
  return validateSessionToken(decoded);
}

async function expectRejected(work, label) {
  await assert.rejects(work, undefined, label);
}

const addressInput = {
  recipientFirstName: "Aura",
  recipientLastName: "Customer",
  addressLine1: "1 Maison Street",
  city: "Stockholm",
  postalCode: "111 22",
  countryCode: "SE",
  phone: "+46701112233",
  defaultShipping: true,
  defaultBilling: true,
};

try {
  const owner = await createFixture("owner");
  const other = await createFixture("other");
  const pending = await createFixture("pending", "PENDING");
  const disabled = await createFixture("disabled", "DISABLED");
  const ownerAuthority = await authorityFor(owner.id);
  const otherAuthority = await authorityFor(other.id);
  assert.ok(ownerAuthority);
  assert.ok(otherAuthority);
  assert.deepEqual(await listCurrentAddressesForAuthority(ownerAuthority), []);

  const created = await createAddressForAuthority(ownerAuthority, addressInput);
  assert.match(created.id, /^[a-f\d]{24}$/i);
  const persisted = await addresses.findOne({ _id: new ObjectId(created.id), userId: owner.id });
  assert.ok(persisted, "created address must persist with canonical owner id");
  assert.equal(persisted.defaultShipping, true);
  assert.equal(persisted.defaultBilling, true);
  assert.equal((await listCurrentAddressesForAuthority(ownerAuthority)).length, 1);

  await expectRejected(() => createAddressForAuthority(ownerAuthority, { ...addressInput, userId: other.id }), "browser userId must be rejected");
  await expectRejected(() => createAddressForAuthority(ownerAuthority, { ...addressInput, ownerId: other.id }), "browser ownerId must be rejected");
  await expectRejected(() => createAddressForAuthority(ownerAuthority, { ...addressInput, unexpected: "reject" }), "unknown address fields must be rejected");

  const updated = await updateAddressForAuthority(ownerAuthority, created.id, { addressLine1: "2 Maison Street", defaultShipping: false });
  assert.equal(updated.addressLine1, "2 Maison Street");
  assert.equal(updated.defaultShipping, false);
  assert.equal((await addresses.findOne({ _id: new ObjectId(created.id) })).addressLine1, "2 Maison Street");

  await expectRejected(() => listCurrentAddressesForAuthority(null), "unauthenticated list must reject");
  await expectRejected(() => updateAddressForAuthority(otherAuthority, created.id, { city: "Gothenburg" }), "cross-user update must reject");
  await expectRejected(() => deleteAddressForAuthority(otherAuthority, created.id), "cross-user delete must reject");
  assert.equal(await addresses.countDocuments({ _id: new ObjectId(created.id), userId: other.id }), 0);

  const second = await createAddressForAuthority(ownerAuthority, { ...addressInput, defaultShipping: true, defaultBilling: true });
  const defaults = await addresses.find({ userId: owner.id }).toArray();
  assert.equal(defaults.filter((row) => row.defaultShipping).length, 1, "existing shipping default semantics must be preserved");
  assert.equal(defaults.filter((row) => row.defaultBilling).length, 1, "existing billing default semantics must be preserved");
  assert.equal(defaults.find((row) => row._id.equals(new ObjectId(second.id))).defaultShipping, true);
  await deleteAddressForAuthority(ownerAuthority, created.id);
  assert.equal(await addresses.countDocuments({ _id: new ObjectId(created.id) }), 0);

  assert.equal(await authorityFor(pending.id), null, "PENDING users cannot establish address authority");
  assert.equal(await authorityFor(disabled.id), null, "DISABLED users cannot establish address authority");
  await credentials.updateOne({ userId: owner.id }, { $inc: { sessionVersion: 1 }, $set: { updatedAt: new Date() } });
  const stale = await authorityFor(owner.id, 0);
  assert.equal(stale, null, "stale sessionVersion must be rejected");
  await expectRejected(() => listCurrentAddressesForAuthority(stale), "stale authority list must reject");

  console.log("ADDRESS_MANAGEMENT_CHECK: PASS (Atlas persistence, canonical ownership, strict input boundary, cross-user protection, ACTIVE/verified authority, sessionVersion revocation, and existing default semantics)");
} finally {
  const userIds = fixtureIds.map((id) => id.toHexString());
  if (fixtureIds.length) {
    await addresses.deleteMany({ userId: { $in: userIds } });
    await credentials.deleteMany({ userId: { $in: userIds } });
    await users.deleteMany({ _id: { $in: fixtureIds } });
  }
  assert.equal(await users.countDocuments({ normalizedEmail: { $in: fixtureEmails } }), 0, "user fixtures were not cleaned up");
  await (await mongoClientPromise).close();
}
