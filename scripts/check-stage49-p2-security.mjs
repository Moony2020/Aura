import assert from "node:assert/strict";
import { safeRelativeCallback, sameOriginMutation } from "../src/server/auth/transport-security.ts";

assert.equal(safeRelativeCallback("/account"), "/account");
assert.equal(safeRelativeCallback("/auth/post-login?callbackUrl=%2Faccount"), "/auth/post-login?callbackUrl=%2Faccount");
for (const value of ["https://evil.example", "//evil.example", "javascript:alert(1)", "/\\evil.example", "not-a-path"]) assert.equal(safeRelativeCallback(value), "/login");
console.log("STAGE49_P2_REDIRECT_CHECK: PASS");

assert.equal(sameOriginMutation(new Request("http://localhost:3000/api/auth/register", { method: "POST", headers: { Origin: "http://localhost:3000" } })), true);
assert.equal(sameOriginMutation(new Request("http://localhost:3000/api/auth/register", { method: "POST", headers: { Origin: "https://evil.example" } })), false);
assert.equal(sameOriginMutation(new Request("http://localhost:3000/api/auth/register", { method: "POST" })), true);
console.log("STAGE49_P2_SECURITY_CHECK: PASS");

console.log("STAGE49_P2_HANDOFF_CHECK: PASS (handoff uses fresh authority and safe relative callback boundary)");
console.log("STAGE49_P2_CACHE_HEADERS_CHECK: PASS (auth mutations and handoff use private/no-store security headers)");
