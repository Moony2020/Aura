import assert from "node:assert/strict";
import fs from "node:fs";

const files = [
  "package.json",
  "src/app/globals.css",
  "src/app/(storefront)/forgot-password/page.tsx",
  "src/app/(storefront)/reset-password/page.tsx",
  "src/app/api/auth/password-reset/route.ts",
  "src/app/api/auth/password-reset/request/route.ts",
  "src/components/auth/LoginForm.tsx",
  "src/components/auth/PasswordResetRequestForm.tsx",
  "src/components/auth/PasswordResetForm.tsx",
  "src/domain/auth/auth-token.schema.ts",
  "src/domain/auth/password-reset.schema.ts",
  "src/server/auth/password-reset-service.ts",
  "src/server/auth/verification-token.ts",
  "src/server/email/email-sender.ts",
  "src/server/repositories/auth-credentials-repository.ts",
  "src/server/repositories/auth-token-repository.ts",
  "src/server/repositories/mongo-auth-credentials-repository.ts",
  "src/server/repositories/mongo-auth-token-repository.ts",
  "scripts/check-auth-password-recovery.mjs",
  "scripts/check-auth-password-recovery-runtime.mjs",
  "scripts/check-auth-password-recovery-ui.mjs",
  "scripts/check-stage44-scoped-diff.mjs",
];

const failures = [];
for (const file of files) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/[ \t]+$/.test(line)) failures.push(`${file}:${index + 1}: trailing whitespace`);
  });
}

assert.deepEqual(failures, [], failures.join("\n"));
console.log("STAGE44_SCOPED_DIFF_CHECK: PASS (zero trailing-whitespace errors in Stage 4.4 source, routes, components, package manifest, and verification scripts)");
