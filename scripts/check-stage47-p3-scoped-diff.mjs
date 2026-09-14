import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const paths = [
  "package.json",
  "src/app/(storefront)/account/page.tsx",
  "src/app/globals.css",
  "src/components/account/AccountOrderHistory.tsx",
  "src/server/order/order-history-service.ts",
  "src/server/repositories/order-inventory-repository.ts",
  "src/server/repositories/mongo-order-inventory-repository.ts",
  "scripts/check-order-history-boundary.mjs",
  "scripts/check-order-history-boundary-static.mjs",
  "scripts/check-order-history-ui.mjs",
  "scripts/check-order-history-ui-runtime.mjs",
  "scripts/check-stage47-p1-scoped-diff.mjs",
  "scripts/check-stage47-p2-scoped-diff.mjs",
  "scripts/check-stage47-p3-scoped-diff.mjs",
  "docs/PROJECT-STATUS.md",
  "docs/MASTER-PLAN.md",
  "docs/PHASE-04-AUTH-ACCOUNT.md",
  "docs/phases/PHASE-04-AUTH-ACCOUNT.md",
  "docs/ARCHITECTURE.md",
  "docs/DATABASE.md",
  "docs/API.md",
  "docs/SECURITY.md",
  "docs/TESTING.md",
  "docs/CHANGELOG.md",
];

const output = execFileSync("git", ["diff", "--check", "--", ...paths], { encoding: "utf8" });
assert.equal(output, "", `scoped diff has whitespace errors:\n${output}`);
console.log("STAGE47_P3_SCOPED_DIFF_CHECK: PASS");
