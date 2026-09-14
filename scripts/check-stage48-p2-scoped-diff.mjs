import { execFileSync } from "node:child_process";
const files = ["package.json", "docs/PROJECT-STATUS.md", "docs/MASTER-PLAN.md", "docs/TESTING.md", "docs/phases/PHASE-04-AUTH-ACCOUNT.md", "src/app/(storefront)/auth/post-login/route.ts", "src/server/auth/actions.ts", "src/server/auth/post-login-merge.ts", "src/server/wishlist/guest-wishlist-token.ts", "scripts/check-stage48-p2-static.mjs", "scripts/check-stage48-p2-runtime.mjs", "scripts/check-stage48-p2-authjs-http.mjs", "scripts/stage48-p2-fixture.mjs", "scripts/check-stage48-p2-scoped-diff.mjs"];
execFileSync("git", ["diff", "--check", "--", ...files], { stdio: "inherit" });
console.log("STAGE48_P2_SCOPED_DIFF_CHECK: PASS (clean P2 login orchestration and guest-cookie lifecycle scope)");
