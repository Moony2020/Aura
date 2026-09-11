import fs from "node:fs";

const page = fs.readFileSync("src/app/(storefront)/fragrances/page.tsx", "utf8");
const query = fs.readFileSync("src/server/queries/list-published-fragrances.ts", "utf8");
const productRepository = fs.readFileSync("src/server/repositories/mongo-product-repository.ts", "utf8");
const card = fs.readFileSync("src/components/storefront/FragranceCard.tsx", "utf8");
const nav = fs.readFileSync("src/config/storefront-navigation.ts", "utf8");

for (const token of ["listPublishedFragrances", "No published fragrances match these filters.", "role=\"alert\"", "fragrance-catalog-title", "CatalogFilterControls"]) if (!page.includes(token)) throw new Error(`Catalog page boundary missing: ${token}`);
for (const token of ["listPublished()", "serializePublicError", "posterUrl", "isFrom"]) if (!query.includes(token)) throw new Error(`Catalog query boundary missing: ${token}`);
for (const token of ["next/image", "alt=", "formatPrice", "Details soon"]) if (!card.includes(token)) throw new Error(`Product card boundary missing: ${token}`);
if (!nav.includes('{ label: "Fragrances", href: "/fragrances", status: "available" }')) throw new Error("Fragrances navigation destination is not live.");
for (const forbidden of ["HeroPortalExperience", "FragranceWorlds", "gsap", "CartProvider", "addToCart", "products = ["]) if (page.includes(forbidden) || query.includes(forbidden) || card.includes(forbidden)) throw new Error(`Forbidden catalog dependency: ${forbidden}`);
if (!productRepository.includes('status: "PUBLISHED"')) throw new Error("Product repository does not constrain published products.");
console.log("PASS: canonical published catalog query, safe states, media policy, live navigation, and cinematic/commerce boundaries are enforced.");
