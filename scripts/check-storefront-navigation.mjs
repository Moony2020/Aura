import fs from "node:fs";

const config = fs.readFileSync("src/config/storefront-navigation.ts", "utf8");
const controller = fs.readFileSync("src/components/storefront/StorefrontMegaMenu.tsx", "utf8");
const header = fs.readFileSync("src/components/storefront/StorefrontHeaderShell.tsx", "utf8");
const mobile = fs.readFileSync("src/components/storefront/MobileNavigation.tsx", "utf8");
const styles = fs.readFileSync("src/app/globals.css", "utf8");

for (const label of ["Fragrances", "Collections", "New Arrivals", "Makeup"]) {
  if (!config.includes(label)) throw new Error(`Missing navigation label: ${label}`);
}
if ((config.match(/status: "available" \}/g) ?? []).length !== 3 || !config.includes('href: "/fragrances"') || !config.includes('href: "/collections"') || !config.includes('href: "/new-arrivals"')) throw new Error("Fragrances, Collections, and New Arrivals must remain the live storefront destinations.");
for (const token of ["aria-expanded", "aria-controls", "Escape", "pointerdown", "onFocus", "onClick", "onMouseEnter"]) {
  if (!controller.includes(token)) throw new Error(`Mega-menu interaction boundary missing: ${token}`);
}
for (const token of ["MongoCollectionRepository", "listVisible", "StorefrontMegaMenu"]) {
  if (!header.includes(token)) throw new Error(`Canonical collection boundary missing: ${token}`);
}
if (!styles.includes(".storefront-mega-nav") || !styles.includes("@media (max-width: 1100px)")) throw new Error("Responsive mega-menu boundary is missing.");
for (const token of ["aria-expanded", "aria-controls", "role=\"dialog\"", "aria-modal=\"true\"", "Escape", "overflow", "resize", "focusable"]) {
  if (!mobile.includes(token)) throw new Error(`Mobile navigation boundary missing: ${token}`);
}
if (!styles.includes("env(safe-area-inset-top)") || !styles.includes("env(safe-area-inset-bottom)")) throw new Error("Mobile safe-area padding is missing.");
if (mobile.includes("mongodb") || mobile.includes("MongoClient") || mobile.includes("MONGODB_URI")) throw new Error("MongoDB code leaked into the mobile client component.");
for (const forbidden of ["HeroPortalExperience", "FragranceWorlds", "gsap", "seed-cinematic-products", "searchOpen", "CartProvider"]) {
  if (controller.includes(forbidden) || header.includes(forbidden)) throw new Error(`Forbidden Stage 2.3 dependency: ${forbidden}`);
}
console.log("PASS: desktop mega-menu configuration, canonical collection boundary, keyboard interactions, and mobile isolation are enforced.");
