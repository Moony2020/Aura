import { execFileSync } from "node:child_process";

const files = [
  "package.json",
  "docs/PROJECT-STATUS.md",
  "docs/MASTER-PLAN.md",
  "docs/TESTING.md",
  "docs/phases/PHASE-04-AUTH-ACCOUNT.md",
  "src/domain/order/order.schema.ts",
  "src/server/repositories/order-inventory-repository.ts",
  "src/server/repositories/mongo-order-inventory-repository.ts",
  "src/server/order/order-history-service.ts",
  "scripts/check-order-history-boundary.mjs",
  "scripts/check-order-history-boundary-static.mjs",
  "scripts/check-stage47-p1-scoped-diff.mjs",
];

execFileSync("git", ["diff", "--check", "--", ...files], { stdio: "inherit" });
console.log("STAGE47_P1_SCOPED_DIFF_CHECK: PASS (clean P1 scoped whitespace and documented read-only Order History boundary scope)");
