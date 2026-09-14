import { execFileSync } from "node:child_process";

const files = [
  "docs/PROJECT-STATUS.md",
  "docs/MASTER-PLAN.md",
  "docs/TESTING.md",
  "docs/API.md",
  "docs/ARCHITECTURE.md",
  "docs/DATABASE.md",
  "docs/SECURITY.md",
  "docs/phases/PHASE-04-AUTH-ACCOUNT.md",
  "scripts/check-stage48-current-status.mjs",
  "scripts/check-stage48-p3-scoped-diff.mjs",
];

execFileSync("git", ["diff", "--check", "--", ...files], { stdio: "inherit" });
console.log("STAGE48_P3_SCOPED_DIFF_CHECK: PASS");
