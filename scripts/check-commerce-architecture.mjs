import fs from "node:fs";
import { MongoClient, ServerApiVersion } from "mongodb";

const read = (path) => fs.readFileSync(path, "utf8");
const phase = read("docs/phases/PHASE-03-COMMERCE.md");
const adr = read("docs/decisions/ARCHITECTURE-DECISIONS.md");
const architecture = read("docs/ARCHITECTURE.md");
const database = read("docs/DATABASE.md");
const security = read("docs/SECURITY.md");
const api = read("docs/API.md");
const status = read("docs/PROJECT-STATUS.md");

const requireToken = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`${label} missing: ${token}`);
};

for (const token of [
  "aura_guest_cart",
  "HttpOnly",
  "SameSite=Lax",
  "ACTIVE",
  "CONVERTED",
  "EXPIRED",
  "productId",
  "variantId",
  "integer minor units",
  "Adding to cart does not reserve inventory",
  "UNTRACKED",
  "getCart()",
  "addItem()",
  "updateItemQuantity()",
  "removeItem()",
  "clearCart()",
  "Server Actions are the default",
  "Route Handlers are reserved",
  "Cart view model",
  "total unit quantity",
  "Wishlist implementation belongs to Stage 3.7",
  "Discount Foundation belongs to Stage 3.8",
  "Gift Card Foundation belongs to Stage 3.9",
  "Stage 3.10 owns Fragrance World -> Cart integration",
  "RESOURCE_OWNERSHIP_ERROR",
  "CONFLICT",
  "version",
  "expiresAt",
  "Active Cart",
  "Immutable Order snapshots",
]) requireToken(phase, token, "Phase 3 commerce architecture");

for (const token of ["ADR-022", "ADR-023", "ADR-024", "ADR-025", "ADR-026"]) {
  requireToken(adr, token, "ADR register");
}

for (const token of [
  "Guest carts are future MongoDB documents",
  "Cart Collection — Stage 3.2",
  "server/database-authoritative",
  "CSRF review",
  "shared server/application service layer",
  "Next Phase:** Phase 4",
]) {
  if (![database, architecture, security, api, status].some((source) => source.includes(token))) {
    throw new Error(`Cross-document commerce architecture reference missing: ${token}`);
  }
}

const sourceRoots = ["src/app", "src/components", "src/domain", "src/server", "src/lib"];
const scan = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = `${directory}/${entry.name}`;
  if (entry.isDirectory()) return scan(path);
  return /\.(ts|tsx|js|mjs)$/.test(entry.name) ? [path] : [];
});
const sourceFiles = sourceRoots.flatMap(scan);
const forbiddenSourceTokens = [
  "CartProvider",
  "addToCart",
  "localStorage",
  "mergeCart",
  "Stripe(",
  "paypal",
  "Auth.js",
  "NextAuth",
];
for (const file of sourceFiles) {
  const source = read(file);
  for (const token of forbiddenSourceTokens) {
    if (source.includes(token)) throw new Error(`Commerce architecture must not introduce implementation token ${token} in ${file}`);
  }
}

for (const forbiddenPath of [
  "src/app/api/cart",
  "src/components/storefront/Cart",
  "src/app/(storefront)/checkout",
  "src/app/checkout",
]) {
  if (fs.existsSync(forbiddenPath)) throw new Error(`Commerce architecture must not create implementation path: ${forbiddenPath}`);
}

const envLine = read(".env.local").split(/\r?\n/).find((line) => /^\s*MONGODB_URI\s*=/.test(line));
const uri = process.env.MONGODB_URI ?? envLine?.replace(/^\s*MONGODB_URI\s*=\s*/, "").trim().replace(/^"|"$/g, "");
if (!uri) throw new Error("MONGODB_URI is unavailable.");

const client = new MongoClient(uri, {
  appName: "aura-stage-3-1-commerce-architecture-check",
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  serverSelectionTimeoutMS: 10000,
});

await client.connect();
try {
  const names = new Set((await client.db().listCollections({}, { nameOnly: true }).toArray()).map((collection) => collection.name));
  for (const forbidden of ["cartItems", "wishlistItems"]) {
    if (names.has(forbidden)) throw new Error(`Commerce architecture must not create MongoDB collection before its owning stage: ${forbidden}`);
  }
} finally {
  await client.close();
}

console.log("PASS: commerce architecture is documented and still blocks premature checkout/payment work while allowing accepted Cart, Wishlist, and inventory-aware commerce scope.");
