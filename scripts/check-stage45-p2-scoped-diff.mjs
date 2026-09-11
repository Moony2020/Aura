import assert from "node:assert/strict";
import fs from "node:fs";

const files = [
  "package.json",
  "src/app/globals.css",
  "src/app/(storefront)/account/page.tsx",
  "src/app/(storefront)/login/page.tsx",
  "src/components/account/AccountProfileForm.tsx",
  "src/components/auth/LoginForm.tsx",
  "src/server/auth/actions.ts",
  "scripts/check-auth-p3.mjs",
  "scripts/check-account-profile-ui.mjs",
  "scripts/account-profile-runtime-fixture.mjs",
  "scripts/check-stage45-p2-scoped-diff.mjs",
];

const failures = [];
for (const file of files) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/[ \t]+$/.test(line)) failures.push(`${file}:${index + 1}: trailing whitespace`);
  });
}

assert.deepEqual(failures, [], failures.join("\n"));
console.log("STAGE45_P2_SCOPED_DIFF_CHECK: PASS (zero trailing-whitespace errors in Stage 4.5 P2 route, UI, safe-return, and runtime-verification files)");
