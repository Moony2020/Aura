import fs from "node:fs";

const schema = fs.readFileSync("src/domain/product/product.schema.ts", "utf8");
const query = fs.readFileSync("src/server/queries/list-published-new-arrivals.ts", "utf8");
const catalogQuery = fs.readFileSync("src/server/queries/list-published-fragrances.ts", "utf8");
const page = fs.readFileSync("src/app/(storefront)/new-arrivals/page.tsx", "utf8");
const nav = fs.readFileSync("src/config/storefront-navigation.ts", "utf8");
const mobile = fs.readFileSync("src/components/storefront/MobileNavigation.tsx", "utf8");

if (!schema.includes("launchAt: z.date().optional()")) throw new Error("Product domain is missing canonical launchAt merchandising field.");
if (!catalogQuery.includes("launchAt: product.launchAt?.toISOString() ?? null")) throw new Error("Catalog view model does not expose canonical launchAt.");

for (const token of [
  'import "server-only"',
  "listPublishedNewArrivals",
  "listPublishedFragrances()",
  "product.launchAt !== null",
  "Date.parse(product.launchAt) <= now.getTime()",
]) {
  if (!query.includes(token)) throw new Error(`New arrivals query contract missing: ${token}`);
}

if (query.includes("createdAt")) throw new Error("New arrivals query must not use technical createdAt timestamps.");

for (const token of [
  "listPublishedNewArrivals",
  "No new arrivals are approved yet",
  "has not marked any published fragrance as a New Arrival",
  "FragranceCard",
  "href=\"/fragrances\"",
]) {
  if (!page.includes(token)) throw new Error(`New arrivals page contract missing: ${token}`);
}

if (!nav.includes('{ label: "New Arrivals", href: "/new-arrivals", status: "available" }')) throw new Error("New Arrivals desktop navigation is not live.");
if (!nav.includes('{ label: "New Arrivals", href: "/new-arrivals" }')) throw new Error("New Arrivals mobile/mega navigation entry is not live.");
if (!mobile.includes("fragranceAudienceNavigation")) throw new Error("Mobile navigation does not consume shared live navigation.");

for (const forbidden of ["Best Seller", "Best Sellers", "Trending", "Rating", "Most Reviewed", "Just Dropped", "countdown", "HeroPortalExperience", "FragranceWorlds", "gsap", "seed-cinematic-products"]) {
  if (page.includes(forbidden) || query.includes(forbidden)) throw new Error(`Forbidden New Arrivals dependency or fake merchandising claim: ${forbidden}`);
}

console.log("PASS: Stage 2.11 New Arrivals uses canonical launchAt merchandising data, live navigation, published product cards, safe empty state, and no createdAt/fake/cinematic leakage.");

