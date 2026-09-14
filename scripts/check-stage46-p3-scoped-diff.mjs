import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

const scoped = [
  "package.json",
  "docs/PROJECT-STATUS.md",
  "docs/TESTING.md",
  "docs/phases/PHASE-04-AUTH-ACCOUNT.md",
  "scripts/check-commerce-architecture.mjs",
  "scripts/check-address-management-boundary.mjs",
  "scripts/check-address-management.mjs",
  "scripts/check-account-addresses-ui.mjs",
  "src/app/(storefront)/account/page.tsx",
  "src/components/account/AccountAddresses.tsx",
  "src/server/account/address-actions.ts",
  "src/server/account/address-service.ts",
];

execFileSync("git", ["diff", "--check", "--", ...scoped], { stdio: "inherit" });
const source = execFileSync("git", ["diff", "--", ...scoped], { encoding: "utf8" });
const additions = source.split("\n").filter((line) => line.startsWith("+") && !line.startsWith("+++"));
assert.doesNotMatch(additions.join("\n"), /checkout redesign|shipping-provider integration/i);
console.log("STAGE46_P3_SCOPED_DIFF_CHECK: PASS (clean scoped whitespace and no Stage 4.7 or prohibited checkout expansion)");
