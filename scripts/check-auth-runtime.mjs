import assert from "node:assert/strict";
import fs from "node:fs";
import { ObjectId } from "mongodb";

if (fs.existsSync(".env.local")) {
  if (!process.env.MONGODB_URI) {
    const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => /^\s*MONGODB_URI\s*=/.test(entry));
    if (line) process.env.MONGODB_URI = line.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
  }
}

assert.ok(process.env.AUTH_SECRET, "AUTH_SECRET must be supplied by the test process");
const baseUrl = process.env.AUTH_BASE_URL ?? "http://localhost:3000";
const { getMongoDb, mongoClientPromise } = await import("../src/server/db/mongodb.ts");
const { hashPassword } = await import("../src/server/auth/password-hasher.ts");

let cookies = new Map();
function updateCookies(response) {
  const setCookies = response.headers.getSetCookie?.() ?? (response.headers.get("set-cookie") ? [response.headers.get("set-cookie")] : []);
  for (const setCookie of setCookies) {
    const pair = setCookie.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator < 1) continue;
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (value === "" || /Max-Age=0/i.test(setCookie) || /Expires=Thu, 01 Jan 1970/i.test(setCookie)) cookies.delete(name);
    else cookies.set(name, value);
  }
}
function cookieHeader() {
  return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
}
function requestHeaders() {
  const cookie = cookieHeader();
  return cookie ? { cookie } : {};
}

const db = await getMongoDb();
const users = db.collection("users");
const credentials = db.collection("authCredentials");
const userId = new ObjectId();
const now = new Date();
const password = "Stage43-P3-runtime-password";
const email = `stage43-p3-runtime-${userId.toHexString()}@example.test`;

try {
  await users.insertOne({
    _id: userId,
    email,
    normalizedEmail: email,
    firstName: "Stage",
    lastName: "Three",
    role: "CUSTOMER",
    status: "ACTIVE",
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await credentials.insertOne({
    _id: new ObjectId(),
    userId: userId.toHexString(),
    passwordHash: await hashPassword(password),
    passwordHashVersion: 1,
    sessionVersion: 0,
    passwordChangedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, { redirect: "manual" });
  assert.equal(csrfResponse.status, 200);
  updateCookies(csrfResponse);
  const { csrfToken } = await csrfResponse.json();
  assert.equal(typeof csrfToken, "string");
  assert.ok(cookies.has("authjs.csrf-token") || cookies.has("__Host-authjs.csrf-token"), "Auth.js did not issue a CSRF cookie");

  const callbackResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: { ...requestHeaders(), "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, email, password, callbackUrl: `${baseUrl}/login`, json: "true" }),
  });
  assert.ok([200, 302, 303].includes(callbackResponse.status), `credentials callback failed: HTTP ${callbackResponse.status}`);
  updateCookies(callbackResponse);
  assert.ok(
    [...cookies.keys()].some((name) => /session-token$/.test(name)),
    `Auth.js did not issue a session cookie (HTTP ${callbackResponse.status}; location ${callbackResponse.headers.get("location") ?? "none"}; cookies ${[...cookies.keys()].join(",") || "none"})`,
  );

  const authenticatedSession = await fetch(`${baseUrl}/api/auth/session`, { headers: requestHeaders() });
  assert.equal(authenticatedSession.status, 200);
  const sessionBody = await authenticatedSession.json();
  assert.equal(sessionBody?.user?.id, userId.toHexString());

  const signOutCsrfResponse = await fetch(`${baseUrl}/api/auth/csrf`, { headers: requestHeaders(), redirect: "manual" });
  assert.equal(signOutCsrfResponse.status, 200);
  updateCookies(signOutCsrfResponse);
  const { csrfToken: signOutCsrfToken } = await signOutCsrfResponse.json();

  const signOutResponse = await fetch(`${baseUrl}/api/auth/signout`, {
    method: "POST",
    redirect: "manual",
    headers: { ...requestHeaders(), "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken: signOutCsrfToken, callbackUrl: `${baseUrl}/` }),
  });
  assert.ok([200, 302, 303].includes(signOutResponse.status), `signout failed: HTTP ${signOutResponse.status}`);
  updateCookies(signOutResponse);

  const anonymousSession = await fetch(`${baseUrl}/api/auth/session`, { headers: requestHeaders() });
  assert.equal(anonymousSession.status, 200);
  assert.equal(await anonymousSession.text(), "null");

  console.log("AUTH_RUNTIME_CHECK: PASS (real Auth.js Credentials login, Atlas-backed session read, and real logout)");
} finally {
  await credentials.deleteMany({ userId: userId.toHexString() });
  await users.deleteOne({ _id: userId });
  await (await mongoClientPromise).close();
}
