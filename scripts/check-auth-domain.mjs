import { randomBytes } from "node:crypto";
import { authCredentialsCreateSchema } from "../src/domain/auth/auth-credentials.schema.ts";
import { authTokenCreateSchema, emailVerificationPurpose } from "../src/domain/auth/auth-token.schema.ts";
import { ARGON2ID_POLICY, hashPassword, passwordHashNeedsRehash, verifyPasswordHash } from "../src/server/auth/password-hasher.ts";
import { createEmailVerificationToken, hashAuthToken } from "../src/server/auth/verification-token.ts";

const userId = "507f1f77bcf86cd799439011";
const password = "stage42-domain-test-password";
const passwordHash = await hashPassword(password);
if (!passwordHash.startsWith("$argon2id$") || !(await verifyPasswordHash(passwordHash, password)) || await verifyPasswordHash(passwordHash, `${password}-wrong`)) throw new Error("Argon2id hash/verify contract failed.");
if (passwordHashNeedsRehash(passwordHash)) throw new Error("Fresh Argon2id hash unexpectedly requires rehash.");
if (ARGON2ID_POLICY.memoryCost !== 19_456 || ARGON2ID_POLICY.timeCost !== 2 || ARGON2ID_POLICY.parallelism !== 1) throw new Error("Argon2id policy drifted.");

const credentials = authCredentialsCreateSchema.parse({ userId, passwordHash, passwordHashVersion: 1, sessionVersion: 0, passwordChangedAt: new Date(), createdAt: new Date(), updatedAt: new Date() });
if (credentials.sessionVersion !== 0 || /stage42-domain-test-password/.test(JSON.stringify(credentials))) throw new Error("Credential secret/version contract failed.");
try { authCredentialsCreateSchema.parse({ ...credentials, unexpected: true }); throw new Error("Credential schema accepted an unexpected field."); } catch (error) { if (error.message === "Credential schema accepted an unexpected field.") throw error; }

const generated = createEmailVerificationToken();
if (generated.rawToken.length < 40 || generated.tokenHash !== hashAuthToken(generated.rawToken) || generated.expiresAt <= new Date()) throw new Error("Verification token contract failed.");
const token = authTokenCreateSchema.parse({ userId, purpose: emailVerificationPurpose, tokenHash: generated.tokenHash, expiresAt: generated.expiresAt, createdAt: new Date(), consumedAt: null });
if (JSON.stringify(token).includes(generated.rawToken)) throw new Error("Raw verification token entered token persistence model.");
try { authTokenCreateSchema.parse({ ...token, purpose: "NOT_A_PURPOSE" }); throw new Error("Token purpose schema accepted an invalid purpose."); } catch (error) { if (error.message === "Token purpose schema accepted an invalid purpose.") throw error; }
if (randomBytes(32).length !== 32) throw new Error("Node cryptographic randomness unavailable.");

console.log("AUTH_DOMAIN_CHECK: PASS (Argon2id, sessionVersion=0, random hash-only EMAIL_VERIFICATION token, strict purpose separation)");
