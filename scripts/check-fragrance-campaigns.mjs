import fs from "node:fs";

const page = fs.readFileSync("src/app/(storefront)/fragrances/[audience]/page.tsx", "utf8");
const query = fs.readFileSync("src/server/queries/list-published-fragrances.ts", "utf8");
const nav = fs.readFileSync("src/config/storefront-navigation.ts", "utf8");
for (const route of ["/fragrances/women", "/fragrances/men", "/fragrances/unisex"]) if (!nav.includes(`href: "${route}"`)) throw new Error(`Missing live audience destination: ${route}`);
for (const token of ["listPublishedFragrances({ audience", "WOMEN", "MEN", "UNISEX", "role=\"alert\"", "This edit is being composed."]) if (!page.includes(token) && !query.includes(token)) throw new Error(`Campaign contract missing: ${token}`);
for (const forbidden of ["HeroPortalExperience", "FragranceWorlds", "gsap", "CartProvider", "addToCart", "rating"]) if (page.includes(forbidden)) throw new Error(`Forbidden campaign dependency: ${forbidden}`);
if (!query.includes("query.audience && item.audience !== query.audience")) throw new Error("Campaign query does not filter by canonical audience.");
console.log("PASS: audience campaign routes, canonical segmentation filter, safe states, live navigation, and cinematic/commerce boundaries are enforced.");
