import assert from "node:assert/strict";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";

if (fs.existsSync(".env.local")) {
  for (const key of ["MONGODB_URI", "AUTH_SECRET"]) {
    if (process.env[key]) continue;
    const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => new RegExp(`^\\s*${key}\\s*=`).test(entry));
    if (line) process.env[key] = line.replace(new RegExp(`^\\s*${key}\\s*=\\s*`), "").trim().replace(/^"|"$/g, "");
  }
}

if (!process.env.AUTH_SECRET) process.env.AUTH_SECRET = randomBytes(32).toString("base64url");

const { encode, decode } = await import("next-auth/jwt");
const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { hashPassword } = await import("../src/server/auth/password-hasher.ts");
const { authenticateCredentials } = await import("../src/server/auth/login-service.ts");
const { validateSessionToken } = await import("../src/server/auth/session-authority.ts");
const { MongoAuthCredentialsRepository } = await import("../src/server/repositories/mongo-auth-credentials-repository.ts");

const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const suffix = new ObjectId().toHexString();
const now = new Date();
const password = "Stage43-P2-secure-password";
const fixtureIds = [];

async function createFixture({ email, status, withCredentials = true }) {
  const id = new ObjectId();
  fixtureIds.push(id);
  await users.insertOne({
    _id: id,
    email,
    normalizedEmail: email,
    firstName: "Stage",
    lastName: "Four",
    role: "CUSTOMER",
    status,
    emailVerifiedAt: status === "ACTIVE" ? now : null,
    createdAt: now,
    updatedAt: now,
  });
  if (withCredentials) {
    await credentials.insertOne({
      _id: new ObjectId(),
      userId: id.toHexString(),
      passwordHash: await hashPassword(password),
      passwordHashVersion: 1,
      sessionVersion: 0,
      passwordChangedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }
  return id.toHexString();
}

const activeEmail = `stage43-p2-active-${suffix}@example.test`;
const pendingEmail = `stage43-p2-pending-${suffix}@example.test`;
const disabledEmail = `stage43-p2-disabled-${suffix}@example.test`;
const missingCredentialEmail = `stage43-p2-missing-${suffix}@example.test`;

try {
  const activeUserId = await createFixture({ email: activeEmail, status: "ACTIVE" });
  await createFixture({ email: pendingEmail, status: "PENDING" });
  await createFixture({ email: disabledEmail, status: "DISABLED" });
  await createFixture({ email: missingCredentialEmail, status: "ACTIVE", withCredentials: false });

  assert.deepEqual(await authenticateCredentials({ email: activeEmail.toUpperCase(), password }), { id: activeUserId });
  assert.equal(await authenticateCredentials({ email: activeEmail, password: "wrong-password" }), null);
  assert.equal(await authenticateCredentials({ email: pendingEmail, password }), null);
  assert.equal(await authenticateCredentials({ email: disabledEmail, password }), null);
  assert.equal(await authenticateCredentials({ email: missingCredentialEmail, password }), null);
  assert.equal(await authenticateCredentials({ email: "invalid", password }), null);

  const oldJwt = await encode({
    secret: process.env.AUTH_SECRET,
    salt: "authjs.session-token",
    token: { sub: activeUserId, sessionVersion: 0 },
  });
  const decodedOldJwt = await decode({ secret: process.env.AUTH_SECRET, salt: "authjs.session-token", token: oldJwt });
  assert.ok(decodedOldJwt);
  assert.equal(decodedOldJwt.sub, activeUserId);
  assert.equal(decodedOldJwt.sessionVersion, 0);
  assert.equal("role" in decodedOldJwt, false);
  assert.equal("status" in decodedOldJwt, false);
  assert.ok(await validateSessionToken(decodedOldJwt));

  const credentialRepository = new MongoAuthCredentialsRepository();
  const incremented = await credentialRepository.incrementSessionVersion(activeUserId);
  assert.equal(incremented.sessionVersion, 1);
  assert.equal(await validateSessionToken(decodedOldJwt), null);

  const currentJwt = await encode({
    secret: process.env.AUTH_SECRET,
    salt: "authjs.session-token",
    token: { sub: activeUserId, sessionVersion: 1 },
  });
  const decodedCurrentJwt = await decode({ secret: process.env.AUTH_SECRET, salt: "authjs.session-token", token: currentJwt });
  assert.ok(decodedCurrentJwt);
  assert.ok(await validateSessionToken(decodedCurrentJwt));

  await users.updateOne({ _id: new ObjectId(activeUserId) }, { $set: { status: "DISABLED", updatedAt: new Date() } });
  assert.equal(await validateSessionToken(decodedCurrentJwt), null);

  console.log("AUTH_LOGIN_CHECK: PASS (Credentials login, PENDING/DISABLED rejection, opaque JWT claims, server-side sessionVersion revocation, disabled-user rejection, and Atlas cleanup)");
} finally {
  if (fixtureIds.length) {
    const ids = fixtureIds.map((id) => id.toHexString());
    await credentials.deleteMany({ userId: { $in: ids } });
    await users.deleteMany({ _id: { $in: fixtureIds } });
  }
  await (await mongoClientPromise).close();
}
