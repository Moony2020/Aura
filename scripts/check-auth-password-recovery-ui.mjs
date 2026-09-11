import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const requestForm = read("src/components/auth/PasswordResetRequestForm.tsx");
const resetForm = read("src/components/auth/PasswordResetForm.tsx");
const resetRoute = read("src/app/api/auth/password-reset/route.ts");
const requestRoute = read("src/app/api/auth/password-reset/request/route.ts");
const forgotPage = read("src/app/(storefront)/forgot-password/page.tsx");
const resetPage = read("src/app/(storefront)/reset-password/page.tsx");
const loginForm = read("src/components/auth/LoginForm.tsx");

for (const source of [forgotPage, resetPage, requestForm, resetForm, resetRoute, requestRoute]) {
  assert.equal(source.includes("PASSWORD_RESET"), false, "UI/transport must not expose the internal token purpose.");
}
assert.match(forgotPage, /PasswordResetRequestForm/);
assert.match(resetPage, /PasswordResetForm/);
assert.match(requestForm, /fetch\("\/api\/auth\/password-reset\/request"/);
assert.match(requestForm, /method: "POST"/);
assert.match(requestForm, /If an eligible account exists/);
assert.match(requestForm, /\/login/);
assert.match(resetForm, /\/api\/auth\/password-reset\?token=/);
assert.match(resetForm, /method: "POST"/);
assert.match(resetForm, /state !== "READY"/);
assert.match(resetForm, /history\.replaceState/);
assert.match(resetForm, /new-password/);
assert.equal(/localStorage|sessionStorage/.test(resetForm), false);
assert.match(resetRoute, /export async function GET/);
assert.match(resetRoute, /export async function POST/);
assert.match(resetRoute, /inspectPasswordResetToken/);
assert.match(resetRoute, /resetPassword/);
assert.match(resetRoute, /Cache-Control.*no-store/);
assert.match(resetRoute, /Referrer-Policy.*no-referrer/);
assert.match(requestRoute, /export async function POST/);
assert.match(requestRoute, /requestPasswordReset/);
assert.match(requestRoute, /private, no-store/);
assert.match(loginForm, /\/forgot-password/);

console.log("AUTH_PASSWORD_RECOVERY_UI_CHECK: PASS (explicit request/reset POST boundaries, non-mutating token inspection, generic request copy, session-safe reset UX, and no raw-token browser persistence)");
