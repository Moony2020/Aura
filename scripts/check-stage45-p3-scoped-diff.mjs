import assert from "node:assert/strict";
import fs from "node:fs";

// This final-audit scope intentionally covers the Stage 4.5 P3 code and test
// artifacts. Documentation is checked for internal consistency by the final
// audit, but its inherited trailing whitespace is an explicitly documented
// repository baseline and must not be mass-reformatted here.
const files = [
  "package.json",
  "src/app/globals.css",
  "scripts/check-auth-architecture.mjs",
  "scripts/check-auth-p3.mjs",
  "scripts/check-auth-verification-ui.mjs",
  "scripts/check-storefront-responsive-accessibility.mjs",
  "scripts/check-stage45-p3-scoped-diff.mjs",
];

const failures = [];
for (const file of files) {
  if (!fs.existsSync(file)) {
    failures.push(`${file}: missing scoped Stage 4.5 P3 evidence file`);
    continue;
  }

  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/[ \t]+$/.test(line)) failures.push(`${file}:${index + 1}: trailing whitespace`);
  });
}

assert.deepEqual(failures, [], failures.join("\n"));
console.log("STAGE45_P3_SCOPED_DIFF_CHECK: PASS (zero trailing-whitespace errors in Stage 4.5 P3 audit and regression-repair code; inherited documentation whitespace is verified separately and intentionally preserved)");
