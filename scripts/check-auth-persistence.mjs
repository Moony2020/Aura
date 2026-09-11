import fs from "node:fs";
import { ObjectId } from "mongodb";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { MongoAuthCredentialsRepository } = await import("../src/server/repositories/mongo-auth-credentials-repository.ts");
const { MongoAuthTokenRepository } = await import("../src/server/repositories/mongo-auth-token-repository.ts");
const { hashPassword } = await import("../src/server/auth/password-hasher.ts");
const { createEmailVerificationToken } = await import("../src/server/auth/verification-token.ts");
const db = await getMongoDb();
const credentialsRepository = new MongoAuthCredentialsRepository();
const tokenRepository = new MongoAuthTokenRepository();
const userId = new ObjectId().toHexString();
const password = "stage42-persistence-test-password";
const now = new Date();

try {
  const passwordHash = await hashPassword(password);
  const credentials = await credentialsRepository.create({ userId, passwordHash, passwordHashVersion: 1, sessionVersion: 0, passwordChangedAt: now, createdAt: now, updatedAt: now });
  if (credentials.sessionVersion !== 0 || !credentials.passwordHash.startsWith("$argon2id$") || JSON.stringify(credentials).includes(password)) throw new Error("Credential persistence contract failed.");

  const generated = createEmailVerificationToken(now);
  const token = await tokenRepository.createEmailVerification({ userId, tokenHash: generated.tokenHash, expiresAt: generated.expiresAt, createdAt: now, consumedAt: null });
  const storedToken = await db.collection("authTokens").findOne({ _id: new ObjectId(token.id) });
  if (!storedToken || JSON.stringify(storedToken).includes(generated.rawToken)) throw new Error("Raw verification token was persisted.");
  if (await tokenRepository.findByHashAndPurpose(generated.tokenHash, "PASSWORD_RESET") !== null) throw new Error("Token purpose separation failed.");
  if (!await tokenRepository.consumeByHashAndPurpose(generated.tokenHash, "EMAIL_VERIFICATION", new Date())) throw new Error("Email verification token was not consumed.");
  if (await tokenRepository.consumeByHashAndPurpose(generated.tokenHash, "EMAIL_VERIFICATION", new Date()) !== null) throw new Error("Consumed verification token was reusable.");

  let rejectedCredential = false;
  try { await db.collection("authCredentials").insertOne({ _id: new ObjectId(), userId: new ObjectId().toHexString(), passwordHash, passwordHashVersion: 1, sessionVersion: 0, passwordChangedAt: now, createdAt: now, updatedAt: now, unexpected: "reject-me" }); } catch (error) { rejectedCredential = error?.code === 121; }
  if (!rejectedCredential) throw new Error("authCredentials validator accepted an unexpected field.");

  let rejectedToken = false;
  try { await db.collection("authTokens").insertOne({ _id: new ObjectId(), userId, purpose: "EMAIL_VERIFICATION", tokenHash: "a".repeat(64), expiresAt: generated.expiresAt, createdAt: now, consumedAt: null, rawToken: generated.rawToken }); } catch (error) { rejectedToken = error?.code === 121; }
  if (!rejectedToken) throw new Error("authTokens validator accepted rawToken/unexpected field.");

  const expired = createEmailVerificationToken(new Date(now.getTime() - 48 * 60 * 60 * 1000));
  await tokenRepository.createEmailVerification({ userId, tokenHash: expired.tokenHash, expiresAt: new Date(now.getTime() - 1), createdAt: now, consumedAt: null });
  if (await tokenRepository.consumeByHashAndPurpose(expired.tokenHash, "EMAIL_VERIFICATION", new Date()) !== null) throw new Error("Expired verification token was accepted.");
  console.log("AUTH_PERSISTENCE_CHECK: PASS (Atlas validators, indexes, hash-only storage, purpose binding, expiry, single-use consume)");
} finally {
  await db.collection("authCredentials").deleteMany({ userId });
  await db.collection("authTokens").deleteMany({ userId });
  const remainingCredentials = await db.collection("authCredentials").countDocuments({ userId });
  const remainingTokens = await db.collection("authTokens").countDocuments({ userId });
  if (remainingCredentials !== 0 || remainingTokens !== 0) throw new Error("Auth P1 fixture cleanup failed.");
  await (await mongoClientPromise).close();
}
