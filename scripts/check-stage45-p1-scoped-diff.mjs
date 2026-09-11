import assert from "node:assert/strict";
import fs from "node:fs";

const files = [
  "package.json",
  "src/domain/user/user.schema.ts",
  "src/server/account/account-profile-service.ts",
  "src/server/account/actions.ts",
  "scripts/check-account-profile-boundary.mjs",
  "scripts/server-only-alias-loader.mjs",
  "scripts/check-stage45-p1-scoped-diff.mjs",
];

const failures = [];
for (const file of files) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/[ \t]+$/.test(line)) failures.push(`${file}:${index + 1}: trailing whitespace`);
  });
}

assert.deepEqual(failures, [], failures.join("\n"));
console.log("STAGE45_P1_SCOPED_DIFF_CHECK: PASS (zero trailing-whitespace errors in the Stage 4.5 P1 server boundary, action, schema, manifest, and verification scripts)");
