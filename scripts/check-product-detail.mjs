import fs from "node:fs";

const page = fs.readFileSync("src/app/(storefront)/product/[slug]/page.tsx", "utf8");
const query = fs.readFileSync("src/server/queries/get-published-product-detail.ts", "utf8");
const gallery = fs.readFileSync("src/components/storefront/ProductGallery.tsx", "utf8");
const variants = fs.readFileSync("src/components/storefront/ProductVariantSelector.tsx", "utf8");
const card = fs.readFileSync("src/components/storefront/FragranceCard.tsx", "utf8");
for (const token of ["getPublishedProductDetail", "notFound", "ProductVariantSelector", "ProductGallery", "Fragrance notes"]) if (!page.includes(token)) throw new Error(`Product detail page contract missing: ${token}`);
for (const token of ["product.status !== \"PUBLISHED\"", "listProductNotes", "listProductFamilies", "listVisible", "getByVariantId", "serializePublicError"]) if (!query.includes(token)) throw new Error(`Product detail read boundary missing: ${token}`);
for (const token of ["aria-pressed", "poster", "alt", "video"]) if (!gallery.includes(token)) throw new Error(`Product gallery accessibility/media boundary missing: ${token}`);
for (const token of ["Choose a size", "price", "SKU", "availability", "radio", "addCartItemAction", "publishCartView", "requestCartDrawerOpen", "Online availability currently unavailable"]) if (!variants.includes(token)) throw new Error(`Variant selection/Add to Bag boundary missing: ${token}`);
if (!card.includes('href={`/product/${product.slug}`}')) throw new Error("Catalog card does not link to the Product Detail route.");
for (const forbidden of ["HeroPortalExperience", "FragranceWorlds", "gsap", "CartProvider", "addToCart", "seed-cinematic-products"]) if ([page, query, gallery, variants].some((source) => source.includes(forbidden))) throw new Error(`Forbidden product detail dependency: ${forbidden}`);
console.log("PASS: published-only Product Detail route, canonical media/taxonomy/variant reads, accessible selector, real PDP Add to Bag, card navigation, and cinematic boundaries are enforced.");
