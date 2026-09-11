import assert from "node:assert/strict";
import fs from "node:fs";
import { ObjectId } from "mongodb";

if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
  if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
}

const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { registerCustomer, resendEmailVerification } = await import("../src/server/auth/registration-service.ts");
const { InMemoryEmailSender } = await import("../src/server/email/email-sender.ts");
const { MongoAuthCredentialsRepository } = await import("../src/server/repositories/mongo-auth-credentials-repository.ts");
const { MongoAuthTokenRepository } = await import("../src/server/repositories/mongo-auth-token-repository.ts");
const { MongoUserRepository } = await import("../src/server/repositories/mongo-user-repository.ts");

const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const tokens = db.collection("authTokens");
const userRepository = new MongoUserRepository();
const credentialRepository = new MongoAuthCredentialsRepository();
const tokenRepository = new MongoAuthTokenRepository();
const suffix = new ObjectId().toHexString();
const email = `stage42-p2-${suffix}@example.test`;
const duplicateEmail = `stage42-p2-race-${suffix}@example.test`;
const failureEmail = `stage42-p2-failure-${suffix}@example.test`;
const rollbackEmail = `stage42-p2-rollback-${suffix}@example.test`;
const password = "Stage42-P2-secure-password";

const inputFor = (value) => ({ email: value, firstName: "Stage", lastName: "Two", password, passwordConfirmation: password });
const assertNoSecret = (value, secret) => assert.equal(JSON.stringify(value).includes(secret), false, "secret crossed a persistence/public boundary");

class FailingTokenRepository extends MongoAuthTokenRepository {
  async createEmailVerification() {
    throw new Error("injected transaction failure");
  }
}

try {
  const invalid = await registerCustomer({ ...inputFor(email), password: "short", passwordConfirmation: "short" });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.error.message.includes(password), false);

  const sender = new InMemoryEmailSender();
  const created = await registerCustomer(inputFor(`  ${email.toUpperCase()}  `), { emailSender: sender, verificationOrigin: "http://localhost:3000" });
  assert.equal(created.ok, true);
  assert.equal(created.emailDelivery, "SENT");
  assert.equal(sender.messages.length, 1);

  const user = await users.findOne({ normalizedEmail: email });
  assert.ok(user);
  assert.equal(user.email, email);
  assert.equal(user.normalizedEmail, email);
  assert.equal(user.role, "CUSTOMER");
  assert.equal(user.status, "PENDING");
  assert.equal(user.emailVerifiedAt, null);
  const userId = user._id.toHexString();
  const storedCredential = await credentials.findOne({ userId });
  assert.ok(storedCredential);
  assert.match(storedCredential.passwordHash, /^\$argon2id\$/);
  assert.equal(storedCredential.passwordHashVersion, 1);
  assert.equal(storedCredential.sessionVersion, 0);
  assertNoSecret(storedCredential, password);
  const firstRawToken = new URL(sender.messages[0].verificationUrl).searchParams.get("token");
  assert.ok(firstRawToken);
  const firstToken = await tokens.findOne({ userId });
  assert.ok(firstToken);
  assert.equal(firstToken.purpose, "EMAIL_VERIFICATION");
  assert.equal(firstToken.tokenHash.includes(firstRawToken), false);
  assertNoSecret(firstToken, firstRawToken);

  const resendSender = new InMemoryEmailSender();
  const beforePasswordHash = storedCredential.passwordHash;
  const resent = await resendEmailVerification({ email: email.toUpperCase() }, { emailSender: resendSender, verificationOrigin: "http://localhost:3000" });
  assert.equal(resent.ok, true);
  assert.equal(resent.emailDelivery, "SENT");
  assert.equal(resendSender.messages.length, 1);
  const tokenRowsAfterResend = await tokens.find({ userId }).sort({ createdAt: 1 }).toArray();
  assert.equal(tokenRowsAfterResend.length, 2);
  assert.equal(tokenRowsAfterResend.filter((row) => row.consumedAt === null).length, 1);
  assert.notEqual(tokenRowsAfterResend[0].consumedAt, null);
  assert.notEqual(tokenRowsAfterResend[0].tokenHash, tokenRowsAfterResend[1].tokenHash);
  assert.equal((await credentials.findOne({ userId })).passwordHash, beforePasswordHash);
  assert.equal((await users.countDocuments({ normalizedEmail: email })), 1);

  const unknownSender = new InMemoryEmailSender();
  const unknown = await resendEmailVerification({ email: `unknown-${suffix}@example.test` }, { emailSender: unknownSender });
  assert.equal(unknown.ok, true);
  assert.equal(unknown.message, resent.message);
  assert.equal(unknownSender.messages.length, 0);

  const failureSender = { async sendEmailVerification() { throw new Error("delivery unavailable"); } };
  const deliveryFailure = await registerCustomer(inputFor(failureEmail), { emailSender: failureSender });
  assert.equal(deliveryFailure.ok, true);
  assert.equal(deliveryFailure.emailDelivery, "PENDING");
  const failedUser = await users.findOne({ normalizedEmail: failureEmail });
  assert.ok(failedUser);
  assert.ok(await credentials.findOne({ userId: failedUser._id.toHexString() }));
  assert.equal(await tokens.countDocuments({ userId: failedUser._id.toHexString(), purpose: "EMAIL_VERIFICATION" }), 1);

  const raceSender = new InMemoryEmailSender();
  const raceResults = await Promise.all([
    registerCustomer(inputFor(duplicateEmail), { emailSender: raceSender }),
    registerCustomer(inputFor(duplicateEmail), { emailSender: raceSender }),
  ]);
  assert.equal(raceResults.every((result) => result.ok && result.accepted), true);
  const racedUser = await users.findOne({ normalizedEmail: duplicateEmail });
  assert.ok(racedUser);
  const racedUserId = racedUser._id.toHexString();
  assert.equal(await users.countDocuments({ normalizedEmail: duplicateEmail }), 1);
  assert.equal(await credentials.countDocuments({ userId: racedUserId }), 1);
  assert.equal(await tokens.countDocuments({ userId: racedUserId, purpose: "EMAIL_VERIFICATION" }), 1);

  let rollbackFailed = false;
  try {
    await registerCustomer(inputFor(rollbackEmail), {
      repositories: { users: userRepository, credentials: credentialRepository, tokens: new FailingTokenRepository() },
      emailSender: new InMemoryEmailSender(),
    });
  } catch {
    rollbackFailed = true;
  }
  assert.equal(rollbackFailed, true);
  assert.equal(await users.countDocuments({ normalizedEmail: rollbackEmail }), 0);

  console.log("AUTH_REGISTRATION_CHECK: PASS (Atlas transaction coherence, normalized CUSTOMER/PENDING registration, race-safe duplicate handling, resend rotation, post-commit delivery failure, secret boundaries, and cleanup)");
} finally {
  const fixtureUsers = await users.find({ normalizedEmail: { $in: [email, failureEmail, duplicateEmail, rollbackEmail] } }, { projection: { _id: 1 } }).toArray();
  const fixtureIds = fixtureUsers.map((row) => row._id.toHexString());
  if (fixtureIds.length) {
    await credentials.deleteMany({ userId: { $in: fixtureIds } });
    await tokens.deleteMany({ userId: { $in: fixtureIds } });
    await users.deleteMany({ _id: { $in: fixtureUsers.map((row) => row._id) } });
  }
  assert.equal(await users.countDocuments({ normalizedEmail: { $in: [email, failureEmail, duplicateEmail, rollbackEmail] } }), 0);
  assert.equal(await credentials.countDocuments({ userId: { $in: fixtureIds } }), 0);
  assert.equal(await tokens.countDocuments({ userId: { $in: fixtureIds } }), 0);
  await (await mongoClientPromise).close();
}
