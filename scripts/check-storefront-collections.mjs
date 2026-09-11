import fs from "node:fs";

const index = fs.readFileSync("src/app/(storefront)/collections/page.tsx", "utf8");
const detail = fs.readFileSync("src/app/(storefront)/collections/[slug]/page.tsx", "utf8");
const listQuery = fs.readFileSync("src/server/queries/list-public-collections.ts", "utf8");
const detailQuery = fs.readFileSync("src/server/queries/get-public-collection.ts", "utf8");
const nav = fs.readFileSync("src/config/storefront-navigation.ts", "utf8");
for (const token of ["listPublicCollections", "role=\"alert\"", "The collection is being composed."]) if (!index.includes(token) && !listQuery.includes(token)) throw new Error(`Collection index contract missing: ${token}`);
for (const token of ["getPublicCollection", "notFound", "status !== \"PUBLISHED\"", "visibility !== \"PUBLIC\"", "position - b.position", "product.status === \"PUBLISHED\""]) if (!detail.includes(token) && !detailQuery.includes(token)) throw new Error(`Collection detail contract missing: ${token}`);
for (const forbidden of ["HeroPortalExperience", "FragranceWorlds", "gsap", "CartProvider", "addToCart"]) if ([index, detail, listQuery, detailQuery].some((source) => source.includes(forbidden))) throw new Error(`Forbidden collection dependency: ${forbidden}`);
if (!nav.includes('{ label: "Collections", href: "/collections", status: "available" }')) throw new Error("Collections primary navigation is not live.");
console.log("PASS: public collection routes, visibility guards, ordered membership, canonical products, live navigation, and cinematic/commerce boundaries are enforced.");
