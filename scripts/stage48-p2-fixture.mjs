import fs from "node:fs";
import { ObjectId } from "mongodb";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}
const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { hashPassword } = await import("../src/server/auth/password-hasher.ts");
const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const email = `stage48-p2-${new ObjectId().toHexString()}@example.test`;
const password = "Stage48-P2-runtime-password";
const userId = new ObjectId();
const now = new Date();
const mode = process.argv[2];
try {
  if (mode === "setup") {
    await users.insertOne({ _id: userId, email, normalizedEmail: email, firstName: "P2", lastName: "Runtime", role: "CUSTOMER", status: "ACTIVE", emailVerifiedAt: now, createdAt: now, updatedAt: now });
    await credentials.insertOne({ _id: new ObjectId(), userId: userId.toHexString(), passwordHash: await hashPassword(password), passwordHashVersion: 1, sessionVersion: 0, passwordChangedAt: now, createdAt: now, updatedAt: now });
    console.log(JSON.stringify({ email, password, userId: userId.toHexString() }));
  } else if (mode === "cleanup") {
    const target = process.argv[3];
    const user = await users.findOne({ email: target });
    if (user) {
      const id = user._id.toHexString();
      await Promise.all([credentials.deleteMany({ userId: id }), db.collection("carts").deleteMany({ "owner.userId": id }), db.collection("wishlists").deleteMany({ "owner.userId": id }), users.deleteOne({ _id: user._id })]);
    }
    console.log("STAGE48_P2_FIXTURE_CLEANUP: PASS");
  } else throw new Error("Use setup or cleanup <email>.");
} finally { await (await mongoClientPromise).close(); }
