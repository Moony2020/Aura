import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const requireToken = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`${label} missing: ${token}`);
};

const page = read("src/app/(storefront)/login/page.tsx");
const form = read("src/components/auth/LoginForm.tsx");
const logout = read("src/components/auth/LogoutButton.tsx");
const actions = read("src/server/auth/actions.ts");
const helper = read("src/server/auth/current-session.ts");
const header = read("src/components/storefront/StorefrontHeaderShell.tsx");

for (const token of ["LoginForm", "LogoutButton", "getCurrentSessionAuthority", "auth-page"]) {
  requireToken(page, token, "Maison login page");
}
for (const token of ["useActionState", "name=\"email\"", "name=\"password\"", "autoComplete=\"current-password\"", "Signing in…"]) {
  requireToken(form, token, "Credentials login form");
}
for (const token of ["signIn(\"credentials\"", "safeCallbackUrl", "redirectTo: callbackUrl", "AuthError", "INVALID_LOGIN_MESSAGE", "formData.get(\"password\")"]) {
  requireToken(actions, token, "Credentials login action");
}
for (const token of ["signOut({ redirectTo: \"/\" })"]) requireToken(actions, token, "Logout action");
for (const token of ["requireCurrentSessionAuthority", "loadUserSessionAuthority(userId)"]) requireToken(helper, token, "Server session helpers");
requireToken(logout, "action={logoutAction}", "Logout form");
requireToken(header, "href=\"/account\"", "Maison account link");

if (form.includes("next-auth") || form.includes("auth()")) throw new Error("Login UI must not contain direct Auth.js runtime access.");
console.log("PASS: Stage 4.3 P3 login UI, real sign-in/sign-out actions, protected session helpers, and the protected Maison account link are present.");
