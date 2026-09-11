import assert from "node:assert/strict";
import fs from "node:fs";
import { ObjectId } from "mongodb";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { hashPassword } = await import("../src/server/auth/password-hasher.ts");

const mode = process.argv[2];
const email = "stage45-p2-runtime@example.test";
const id = new ObjectId("65b000000000000000000045");
const userId = id.toHexString();
const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const tokens = db.collection("authTokens");

try {
  if (mode === "setup") {
    await credentials.deleteMany({ userId });
    await tokens.deleteMany({ userId });
    await users.deleteOne({ _id: id });
    const now = new Date();
    await users.insertOne({ _id: id, email, normalizedEmail: email, firstName: "Maison", lastName: "Original", phone: "+46700000000", role: "CUSTOMER", status: "ACTIVE", emailVerifiedAt: now, createdAt: now, updatedAt: now });
    await credentials.insertOne({ _id: new ObjectId(), userId, passwordHash: await hashPassword("Stage45-P2-runtime-password"), passwordHashVersion: 1, sessionVersion: 0, passwordChangedAt: now, createdAt: now, updatedAt: now });
    console.log("ACCOUNT_PROFILE_RUNTIME_FIXTURE: READY");
  } else if (mode === "assert-profile") {
    const user = await users.findOne({ _id: id });
    const credential = await credentials.findOne({ userId });
    assert.deepEqual({ firstName: user?.firstName, lastName: user?.lastName, phone: user?.phone }, { firstName: "Maison", lastName: "Updated", phone: "+46701112233" });
    assert.equal(user?.email, email);
    assert.equal(user?.role, "CUSTOMER");
    assert.equal(user?.status, "ACTIVE");
    assert.equal(credential?.sessionVersion, 0);
    console.log("ACCOUNT_PROFILE_RUNTIME_FIXTURE: PROFILE_PERSISTED");
  } else if (mode === "stale") {
    await credentials.updateOne({ userId }, { $inc: { sessionVersion: 1 }, $set: { updatedAt: new Date() } });
    console.log("ACCOUNT_PROFILE_RUNTIME_FIXTURE: SESSION_REVOKED");
  } else if (mode === "disable") {
    await users.updateOne({ _id: id }, { $set: { status: "DISABLED", updatedAt: new Date() } });
    console.log("ACCOUNT_PROFILE_RUNTIME_FIXTURE: USER_DISABLED");
  } else if (mode === "cleanup") {
    await credentials.deleteMany({ userId });
    await tokens.deleteMany({ userId });
    await users.deleteOne({ _id: id });
    assert.equal(await users.countDocuments({ _id: id }), 0);
    assert.equal(await credentials.countDocuments({ userId }), 0);
    assert.equal(await tokens.countDocuments({ userId }), 0);
    console.log("ACCOUNT_PROFILE_RUNTIME_FIXTURE: CLEANUP_COMPLETE");
  } else {
    throw new Error("Expected setup, assert-profile, stale, disable, or cleanup mode.");
  }
} finally {
  await (await mongoClientPromise).close();
}
