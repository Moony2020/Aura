import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const phase = read("docs/phases/PHASE-04-AUTH-ACCOUNT.md");
const adr = read("docs/decisions/ARCHITECTURE-DECISIONS.md");
const architecture = read("docs/ARCHITECTURE.md");
const database = read("docs/DATABASE.md");
const api = read("docs/API.md");
const security = read("docs/SECURITY.md");
const status = read("docs/PROJECT-STATUS.md");
const masterPlan = read("docs/MASTER-PLAN.md");
const testing = read("docs/TESTING.md");
const packageJson = JSON.parse(read("package.json"));

const requireToken = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`${label} missing: ${token}`);
};

for (const token of [
  "Stage 4.1 — Authentication Architecture",
  "canonical identity",
  "Auth.js owns authentication and session mechanics",
  "UnsupportedStrategy",
  "Credentials-only + database sessions is **not supported**",
  "Auth.js Credentials + JWT",
  "sessionVersion",
  "COMPLETE ✅",
  "JWT sessions do not require an `authSessions` collection.",
  "The accepted minimal path is Option A.",
  "authCredentials",
  "authSessions",
  "authTokens",
  "Argon2id",
  "PENDING",
  "ACTIVE",
  "DISABLED",
  "CUSTOMER",
  "ADMIN",
  "Stage 4.8",
  "Do not import global `auth()`",
]) requireToken(phase, token, "Phase 4.1 architecture");

for (const token of [
  "ADR-007",
  "ADR-030",
  "ADR-031",
  "ADR-032",
  "Authentication & Customer Account",
  "Stage 4.2 — Registration & Email Validation",
]) requireToken(masterPlan + adr + status, token, "Phase 4 checkpoint/decision register");

for (const [source, tokens] of [
  [architecture, ["canonical `users`", "UnsupportedStrategy", "JWT Sessions", "sessionVersion", "Stage 4.1"]],
  [database, ["canonical AURA identity", "not compatible", "sessionVersion", "Stage 4.1"]],
  [api, ["AURA canonical User", "JWT Sessions", "sessionVersion", "Stage 4.1"]],
  [security, ["canonical identity", "UnsupportedStrategy", "sessionVersion", "Stage 4.1"]],
  [testing, ["domain:auth:architecture:check", "UnsupportedStrategy", "JWT", "Stage 4.1"]],
]) {
  for (const token of tokens) {
    if (!source.includes(token)) throw new Error(`Cross-document auth architecture reference missing: ${token}`);
  }
}

if (packageJson.scripts["domain:auth:architecture:check"] !== "node scripts/check-auth-architecture.mjs") {
  throw new Error("Auth architecture check is not registered in package.json.");
}

if (packageJson.dependencies?.["next-auth"] !== "5.0.0-beta.32") {
  throw new Error("Stage 4.3 P1 must pin the owner-approved next-auth@5.0.0-beta.32 dependency.");
}
if (packageJson.dependencies?.["@auth/mongodb-adapter"] || packageJson.devDependencies?.["@auth/mongodb-adapter"]) {
  throw new Error("The MongoDB adapter is outside the accepted Auth.js JWT path.");
}
if (!read("package-lock.json").includes("node_modules/next-auth")) {
  throw new Error("package-lock.json is missing the pinned next-auth dependency.");
}

const sourceRoots = ["src/app", "src/components", "src/domain", "src/server", "src/lib"];
const scan = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = `${directory}/${entry.name}`;
  if (entry.isDirectory()) return scan(path);
  return /\.(ts|tsx|js|mjs)$/.test(entry.name) ? [path] : [];
});
const sourceFiles = sourceRoots.flatMap(scan);
for (const file of sourceFiles) {
  const normalizedFile = file.replaceAll("\\\\", "/");
  const isAuthBoundary = normalizedFile === "src/app/api/auth/[...nextauth]/route.ts" || normalizedFile.startsWith("src/server/auth/");
  if (isAuthBoundary) continue;
  const source = read(file);
  for (const token of ["next-auth", "@auth/", "NextAuth", "Auth.js"]) {
    if (source.includes(token)) throw new Error(`Authentication runtime token was introduced in ${file}: ${token}`);
  }
}

// The protected Account route was deliberately added by the completed Stage 4.5
// contract. Keep the architecture check current without relaxing its runtime
// boundary checks above: its existence is now required, not a Phase 4.1 leak.
for (const path of ["src/app/(storefront)/account"]) {
  if (!fs.existsSync(path)) throw new Error(`Completed authentication surface is missing: ${path}`);
}

for (const path of ["src/app/api/auth/register", "src/app/api/auth/verification", "src/app/api/auth/verification/resend"]) {
  if (!fs.existsSync(path)) throw new Error(`Stage 4.2 transport boundary is missing: ${path}`);
}

for (const layout of ["src/app/layout.tsx", "src/app/(storefront)/layout.tsx"]) {
  const source = read(layout);
  for (const token of ["cookies(", "headers(", "auth("]) {
    if (source.includes(token)) throw new Error(`Auth request state must not enter route layout ${layout}: ${token}`);
  }
}

if (fs.existsSync("src/app/loading.tsx") || fs.existsSync("src/app/(storefront)/loading.tsx")) {
  throw new Error("Phase 3 true-404 fix must remain intact: root/storefront loading boundaries are forbidden.");
}
if (!fs.existsSync("src/app/(cinematic)/loading.tsx")) throw new Error("The isolated cinematic loading boundary must remain present.");

const userSchema = read("src/domain/user/user.schema.ts");
for (const token of ["CUSTOMER", "ADMIN", "PENDING", "ACTIVE", "DISABLED", "normalizedEmail"]) {
  requireToken(userSchema, token, "canonical User schema");
}
if (/passwordHash|password\s*:/i.test(userSchema)) throw new Error("Password material must not be added to the canonical User schema in Stage 4.1.");

console.log("PASS: Auth.js architecture boundary, Stage 4.2 registration/verification transport, and the Stage 4.3 Auth.js transport boundary are present; the approved P1 dependency is pinned and no out-of-scope auth surface was introduced.");
