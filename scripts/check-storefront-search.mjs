import fs from "node:fs";

const service = fs.readFileSync("src/server/queries/search-published-fragrances.ts", "utf8");
const apiRoute = fs.readFileSync("src/app/api/search/route.ts", "utf8");
const overlay = fs.readFileSync("src/components/storefront/StorefrontSearchAction.tsx", "utf8");
const header = fs.readFileSync("src/components/storefront/StorefrontHeaderShell.tsx", "utf8");
const page = fs.readFileSync("src/app/(storefront)/search/page.tsx", "utf8");

for (const token of [
  'import "server-only"',
  "searchPublishedFragrances",
  "MongoProductRepository",
  "MongoProductFragranceTaxonomyRepository",
  "MongoFragranceNoteRepository",
  "MongoFragranceFamilyRepository",
  "MongoCollectionRepository",
  "SEARCH_QUERY_MAX_LENGTH",
  "SEARCH_QUERY_MIN_LENGTH",
  "Search query validation failed.",
  "maxLength: SEARCH_QUERY_MAX_LENGTH",
  "normalizeForSearch",
  "scoreField",
  "productRepository.listPublished()",
  "publishedNotes",
  "publishedFamilies",
  "serializePublicError",
]) {
  if (!service.includes(token)) throw new Error(`Search service contract missing: ${token}`);
}

for (const token of ["NextResponse.json", "SEARCH_QUICK_LIMIT", "searchPublishedFragrances"]) {
  if (!apiRoute.includes(token)) throw new Error(`Search API route contract missing: ${token}`);
}

if (!apiRoute.includes("result.error?.status ?? 200")) {
  throw new Error("Search API route does not propagate validation failure status codes for oversized queries.");
}

for (const token of [
  '"use client"',
  "formatMinorUnitMoney",
  "role=\"dialog\"",
  "aria-modal=\"true\"",
  "inputRef.current?.focus()",
  "document.body.style.overflow",
  "trigger?.focus()",
  "Escape",
  "Tab",
  "ArrowDown",
  "ArrowUp",
  "setTimeout(async",
  "AbortController",
  "/api/search?q=",
  "router.push(`/search?q=",
]) {
  if (!overlay.includes(token)) throw new Error(`Search overlay contract missing: ${token}`);
}

if (!header.includes("StorefrontSearchAction") || !header.includes("<StorefrontSearchAction")) throw new Error("Header does not isolate search in the client component.");

for (const token of ["searchPublishedFragrances(query)", "action=\"/search\"", "search-page-results-grid", "Published fragrances only"]) {
  if (!page.includes(token)) throw new Error(`Search results page contract missing: ${token}`);
}

for (const forbidden of [
  "mongodb",
  "server-only",
  "MongoProductRepository",
  "searchPublishedFragrances",
  "seed",
  "gsap",
  "HeroPortalExperience",
  "Price slider",
  "Sort dropdown",
]) {
  if (overlay.includes(forbidden)) throw new Error(`Forbidden client search dependency or premature feature: ${forbidden}`);
}

for (const forbidden of ["Price slider", "Sort dropdown", "filter panel", "Popular:"]) {
  if (page.includes(forbidden) || overlay.includes(forbidden)) throw new Error(`Forbidden Stage 2.10/fake popularity UI: ${forbidden}`);
}

console.log("PASS: Stage 2.9 search service, API, client overlay accessibility boundary, server-rendered /search route, and no Mongo/client/filter leakage are enforced.");
