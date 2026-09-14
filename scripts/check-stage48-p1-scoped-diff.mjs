import { execFileSync } from "node:child_process";

const files = [
  "package.json",
  "docs/PROJECT-STATUS.md",
  "docs/MASTER-PLAN.md",
  "docs/TESTING.md",
  "docs/phases/PHASE-04-AUTH-ACCOUNT.md",
  "src/server/commerce/guest-merge-service.ts",
  "scripts/check-stage48-p1-static.mjs",
  "scripts/check-stage48-p1-merge.mjs",
  "scripts/check-stage48-p1-scoped-diff.mjs",
];

execFileSync("git", ["diff", "--check", "--", ...files], { stdio: "inherit" });
console.log("STAGE48_P1_SCOPED_DIFF_CHECK: PASS (clean P1 scoped whitespace and merge-boundary scope)");
