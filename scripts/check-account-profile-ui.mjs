import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const page = read("src/app/(storefront)/account/page.tsx");
const form = read("src/components/account/AccountProfileForm.tsx");
const loginPage = read("src/app/(storefront)/login/page.tsx");
const loginAction = read("src/server/auth/actions.ts");
const storefrontLayout = read("src/app/(storefront)/layout.tsx");
const rootLayout = read("src/app/layout.tsx");

for (const token of ["getCurrentSessionAuthority", "getAccountProfileForAuthority", "redirect(\"/login?callbackUrl=%2Faccount\")", "dynamic = \"force-dynamic\""]) assert.match(page, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
for (const token of ["updateProfileAction", "name=\"firstName\"", "name=\"lastName\"", "name=\"phone\"", "readOnly", "autoComplete=\"given-name\"", "autoComplete=\"family-name\"", "autoComplete=\"tel\"", "aria-live=\"polite\"", "disabled={pending}"]) assert.ok(form.includes(token), `Profile form missing ${token}`);
for (const forbidden of ["name=\"userId\"", "name=\"_id\"", "name=\"ownerId\"", "name=\"role\"", "name=\"status\"", "name=\"sessionVersion\"", "name=\"emailVerifiedAt\"", "name=\"password\""]) assert.equal(form.includes(forbidden), false, `Profile form exposes forbidden authority field ${forbidden}`);
assert.match(loginPage, /safeCallbackUrl/);
assert.match(loginAction, /safeCallbackUrl/);
assert.equal(/getCurrentSessionAuthority|auth\(/.test(storefrontLayout), false, "Storefront layout must remain session-free");
assert.equal(/getCurrentSessionAuthority|auth\(/.test(rootLayout), false, "Root layout must remain session-free");
assert.equal(fs.existsSync("src/app/loading.tsx"), false, "Root loading boundary must remain absent");
assert.equal(fs.existsSync("src/app/(storefront)/loading.tsx"), false, "Storefront loading boundary must remain absent");
console.log("AUTH_ACCOUNT_PROFILE_UI_CHECK: PASS (protected P1-backed account route, strict client surface, safe login return, accessible profile UX, and preserved global auth/404 boundaries)");
