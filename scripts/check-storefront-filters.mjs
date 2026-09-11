import fs from "node:fs";

const query = fs.readFileSync("src/server/queries/list-published-fragrances.ts", "utf8");
const page = fs.readFileSync("src/app/(storefront)/fragrances/page.tsx", "utf8");
const controls = fs.readFileSync("src/components/storefront/CatalogFilterControls.tsx", "utf8");
const card = fs.readFileSync("src/components/storefront/FragranceCard.tsx", "utf8");

for (const token of [
  "CatalogQueryInput",
  "normalizeCatalogQuery",
  "catalogSortValues",
  "catalogAvailabilityValues",
  "catalogAudienceParamValues",
  "parsePrice",
  "majorUnitToMinorUnit",
  "minorUnitToMajorUnit",
  "Repeated catalog filter values are not supported.",
  "Catalog price range is impossible.",
  "Unsupported catalog audience filter.",
  "Unsupported catalog family filter.",
  "new MongoProductRepository().listPublished()",
  "MongoProductFragranceTaxonomyRepository",
  "MongoInventoryRepository",
  "priceFromVariants",
  "availabilityFromStock",
  "applyFilters",
  "sortCatalog",
  "buildFacets",
  "activeFilters",
]) {
  if (!query.includes(token)) throw new Error(`Catalog filter query contract missing: ${token}`);
}

for (const token of [
  "searchParams",
  "params?.audience",
  "params?.family",
  "params?.minPrice",
  "params?.maxPrice",
  "params?.availability",
  "params?.concentration",
  "params?.sort",
  "CatalogFilterControls",
  "No published fragrances match these filters.",
]) {
  if (!page.includes(token)) throw new Error(`Filtered /fragrances route contract missing: ${token}`);
}

for (const token of [
  '"use client"',
  "Filter & Sort",
  "role=\"dialog\"",
  "aria-modal=\"true\"",
  "Escape",
  "Tab",
  "document.body.style.overflow",
  "trigger?.focus()",
  "router.push(params.toString() ? `/fragrances?",
  "Clear all",
  "activeFilters.map",
  "method",
]) {
  if (!controls.includes(token)) throw new Error(`Catalog filter UI contract missing: ${token}`);
}

if (!card.includes("formatMinorUnitMoney(price)") || card.includes("price.amount)") || card.includes("price.amount / 100")) throw new Error("Fragrance card price formatting must use the centralized minor-unit money formatter.");

for (const forbidden of ["mongodb", "MongoProductRepository", "seed", "gsap", "HeroPortalExperience", "Best Selling", "Most Reviewed", "Trending", "Rating"]) {
  if (controls.includes(forbidden) || page.includes(forbidden)) throw new Error(`Forbidden filter UI dependency or fake commercial signal: ${forbidden}`);
}

for (const forbidden of ["$where", "raw Mongo", "JSON.parse", "sortObject", "operator"]) {
  if (query.includes(forbidden)) throw new Error(`Potential raw query/operator leakage: ${forbidden}`);
}

console.log("PASS: Stage 2.10 canonical catalog filters/sorting, URL source-of-truth UI, mobile drawer accessibility, price policy, and no fake/commercial/client query leakage are enforced.");
