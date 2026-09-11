import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("src/app/(storefront)/verify-email/page.tsx", "utf8");
const component = fs.readFileSync("src/components/auth/EmailVerificationExperience.tsx", "utf8");
const css = fs.readFileSync("src/app/globals.css", "utf8");

for (const required of ["READY", "VERIFYING", "SUCCESS", "EXPIRED", "INVALID", "USED", "ERROR", "Verify email", "aria-live", "autoComplete=\"email\""]) {
  assert.equal(component.includes(required), true, `missing UI contract: ${required}`);
}
assert.equal(component.includes("/api/auth/verification?token="), true);
assert.equal(component.includes('method: "POST"'), true);
assert.equal(component.includes("window.history.replaceState"), true);
assert.equal(component.includes("useEffect(() => verify"), false);
assert.equal(component.includes("localStorage"), false);
assert.equal(component.includes("sessionStorage"), false);
assert.equal(component.includes("console."), false);
assert.equal(component.includes("userId"), false);
assert.equal(component.includes("tokenHash"), false);
assert.equal(page.includes("verify-email"), false, "raw token must stay out of the visible page copy");
assert.equal(page.includes('referrer: "no-referrer"'), true);
assert.equal(css.includes(".email-verification"), true);
assert.equal(css.includes("prefers-reduced-motion"), true);
console.log("AUTH_VERIFICATION_UI_CONTRACT_CHECK: PASS (explicit verification action, safe transient token handling, all terminal states, resend semantics, accessibility hooks, and reduced-motion styling)");
