import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { getMongoDb } from "../src/server/db/mongodb.ts";
import { MongoAuthRateLimitRepository } from "../src/server/repositories/mongo-auth-rate-limit-repository.ts";
import { requestIp } from "../src/server/auth/request-ip.ts";

const repo = new MongoAuthRateLimitRepository();
const db = await getMongoDb();
const collection = db.collection("authRateLimits");
const fixture = `stage49-p1-fixture-${Date.now()}-${Math.random()}`;
const hash = (kind, value) => createHash("sha256").update(`aura-auth-rate-limit:v1:${kind}:${value}`).digest("hex");
const made = new Set();
const attempt = (kind, value, limit, windowMs, now, minimumSpacingMs) => { made.add(hash(kind, value)); return repo.attempt({ keyHash: hash(kind, value), kind, limit, windowMs, now, minimumSpacingMs }); };

try {
  await collection.drop().catch((error) => { if (error?.code !== 26) throw error; });
  const now = new Date();
  const concurrentValue = `${fixture}:concurrent`;
  const concurrent = await Promise.all(Array.from({ length: 25 }, () => attempt("LOGIN_ACCOUNT", concurrentValue, 100, 900_000, now)));
  assert.equal(concurrent.filter((r) => r.allowed).length, 25);
  const persisted = await collection.findOne({ keyHash: hash("LOGIN_ACCOUNT", concurrentValue), kind: "LOGIN_ACCOUNT" });
  assert.equal(persisted?.count, 25);
  console.log("P1_ATOMIC_CONCURRENCY_CHECK: PASS");

  const thresholdValue = `${fixture}:threshold`;
  const threshold = await Promise.all(Array.from({ length: 4 }, () => attempt("LOGIN_ACCOUNT", thresholdValue, 3, 900_000, now)));
  assert.equal(threshold.filter((r) => r.allowed).length, 3);
  assert.equal(threshold.filter((r) => !r.allowed).length, 1);
  console.log("P1_THRESHOLD_CHECK: PASS");

  const rolloverValue = `${fixture}:rollover`;
  await attempt("REGISTRATION_EMAIL", rolloverValue, 1, 1_000, now);
  const fresh = await attempt("REGISTRATION_EMAIL", rolloverValue, 1, 1_000, new Date(now.getTime() + 2_000));
  assert.equal(fresh.allowed, true);
  assert.equal(fresh.count, 1);
  console.log("P1_EXPIRY_ROLLOVER_CHECK: PASS");

  const isolatedA = `${fixture}:identity-a`;
  const isolatedB = `${fixture}:identity-b`;
  await attempt("FORGOT_PASSWORD_EMAIL", isolatedA, 1, 3_600_000, now);
  const b = await attempt("FORGOT_PASSWORD_EMAIL", isolatedB, 1, 3_600_000, now);
  assert.equal(b.allowed, true);
  assert.equal(hash("FORGOT_PASSWORD_EMAIL", isolatedA), hash("FORGOT_PASSWORD_EMAIL", isolatedA));
  assert.notEqual(hash("FORGOT_PASSWORD_EMAIL", isolatedA), hash("FORGOT_PASSWORD_EMAIL", isolatedB));
  console.log("P1_KEY_ISOLATION_CHECK: PASS");

  assert.equal(requestIp(new Request("http://localhost", { headers: { "x-forwarded-for": "1.2.3.4", "x-real-ip": "5.6.7.8" } })), null);
  assert.equal(requestIp(new Request("http://localhost", { headers: { "x-aura-test-ip": "controlled-test-ip" } })), "controlled-test-ip");
  console.log("P1_TRUSTED_IP_CHECK: PASS");

  const docs = await collection.find({ keyHash: { $in: [...made] } }).toArray();
  assert.ok(docs.length > 0);
  for (const doc of docs) { assert.match(doc.keyHash, /^[a-f0-9]{64}$/); assert.ok(!Object.hasOwn(doc, "email")); }
  console.log("P1_ATLAS_RATE_LIMIT_CHECK: PASS");
} finally {
  await collection.deleteMany({ keyHash: { $in: [...made] } });
  const remaining = await collection.countDocuments({ keyHash: { $in: [...made] } });
  assert.equal(remaining, 0);
  console.log("P1_CLEANUP_CHECK: PASS");
}
