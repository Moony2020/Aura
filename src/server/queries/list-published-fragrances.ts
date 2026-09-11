import "server-only";

import { unstable_cache } from "next/cache";
import { z } from "zod";

import type { PublicError } from "@/lib/errors/serialize";
import type { Product, ProductAudience } from "@/domain/product/product.schema";
import { validationError } from "@/lib/errors/aura-error";
import { serializePublicError } from "@/lib/errors/serialize";
import { majorUnitToMinorUnit, minorUnitToMajorUnit } from "@/lib/money";
import { MongoCollectionRepository } from "@/server/repositories/mongo-collection-repository";
import { MongoFragranceFamilyRepository, MongoProductFragranceTaxonomyRepository } from "@/server/repositories/mongo-fragrance-repository";
import { MongoInventoryRepository } from "@/server/repositories/mongo-order-inventory-repository";
import { MongoProductRepository } from "@/server/repositories/mongo-product-repository";

export const catalogSortValues = ["featured", "newest", "price-asc", "price-desc", "name-asc"] as const;
export const catalogAvailabilityValues = ["available", "out-of-stock", "untracked"] as const;
export const catalogConcentrationValues = ["EAU_DE_TOILETTE", "EAU_DE_PARFUM", "EAU_DE_PARFUM_INTENSE", "EXTRAIT_DE_PARFUM", "PARFUM"] as const;
export const catalogAudienceParamValues = ["women", "men", "unisex"] as const;
export const CATALOG_FILTER_VALUE_MAX_LENGTH = 80;
export const CATALOG_PRICE_MAX_MAJOR_UNITS = 1_000_000;

const audienceParamToDomain = { women: "WOMEN", men: "MEN", unisex: "UNISEX" } as const;

const catalogSortSchema = z.enum(catalogSortValues);
const catalogAvailabilitySchema = z.enum(catalogAvailabilityValues);
const catalogAudienceParamSchema = z.enum(catalogAudienceParamValues);
const catalogConcentrationSchema = z.enum(catalogConcentrationValues);

export type CatalogSort = (typeof catalogSortValues)[number];
export type CatalogAvailability = (typeof catalogAvailabilityValues)[number];
export type CatalogQueryInput = {
  audience?: ProductAudience | (typeof catalogAudienceParamValues)[number] | string | string[];
  family?: string | string[];
  minPrice?: string | number | string[];
  maxPrice?: string | number | string[];
  availability?: CatalogAvailability | string | string[];
  concentration?: (typeof catalogConcentrationValues)[number] | string | string[];
  sort?: CatalogSort | string | string[];
};

export type NormalizedCatalogQuery = {
  audience: ProductAudience | null;
  audienceParam: (typeof catalogAudienceParamValues)[number] | null;
  family: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  availability: CatalogAvailability | null;
  concentration: (typeof catalogConcentrationValues)[number] | null;
  sort: CatalogSort;
};

export type FragranceCatalogItem = {
  slug: string;
  name: string;
  description: string;
  brand: string;
  audience: ProductAudience | null;
  family: string | null;
  familySlug: string | null;
  collection: string | null;
  concentration: string;
  concentrations: string[];
  volumeMl: number;
  variants: Array<{
    id: string;
    name: string;
    volumeMl: number;
    concentration: string;
    availability: "AVAILABLE" | "OUT_OF_STOCK" | "UNTRACKED";
  }>;
  availability: CatalogAvailability;
  price: { amount: number; currency: string; isFrom: boolean };
  createdAt: string;
  launchAt: string | null;
  media: { url: string; alt: string; kind: "IMAGE" | "VIDEO"; posterUrl?: string } | null;
};

export type CatalogFacetOption = { value: string; label: string; count: number; disabled?: boolean };
export type CatalogActiveFilter = { key: keyof NormalizedCatalogQuery; label: string; href: string };
export type CatalogFacets = {
  audiences: CatalogFacetOption[];
  families: CatalogFacetOption[];
  availability: CatalogFacetOption[];
  concentrations: CatalogFacetOption[];
  price: { min: number | null; max: number | null };
};
export type PublishedFragrancesResult = { products: FragranceCatalogItem[]; query: NormalizedCatalogQuery; facets: CatalogFacets; activeFilters: CatalogActiveFilter[]; error: PublicError | null };

const emptyQuery: NormalizedCatalogQuery = {
  audience: null,
  audienceParam: null,
  family: null,
  minPrice: null,
  maxPrice: null,
  availability: null,
  concentration: null,
  sort: "featured",
};

const emptyFacets: CatalogFacets = { audiences: [], families: [], availability: [], concentrations: [], price: { min: null, max: null } };

function posterForMedia(media: FragranceCatalogItem["media"]) {
  if (!media || media.kind !== "VIDEO" || !media.url.includes("res.cloudinary.com")) return media;
  const posterUrl = media.url.replace("/video/upload/", "/video/upload/so_0/").replace(/\.(mp4|mov|webm)(\?.*)?$/i, ".jpg$2");
  return { ...media, posterUrl };
}

function singleValue(value: string | number | string[] | undefined, key: string) {
  if (Array.isArray(value)) throw validationError("Repeated catalog filter values are not supported.", { key });
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).trim();
  if (normalized.length > CATALOG_FILTER_VALUE_MAX_LENGTH) throw validationError("Catalog filter value is too long.", { key, maxLength: CATALOG_FILTER_VALUE_MAX_LENGTH });
  return normalized;
}

function parsePrice(value: string | number | string[] | undefined, key: "minPrice" | "maxPrice") {
  const raw = singleValue(value, key);
  if (raw === null) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) throw validationError("Catalog price filter is malformed.", { key });
  const majorUnits = Number(raw);
  if (!Number.isFinite(majorUnits) || majorUnits < 0 || majorUnits > CATALOG_PRICE_MAX_MAJOR_UNITS) throw validationError("Catalog price filter is out of range.", { key });
  return majorUnitToMinorUnit(majorUnits);
}

export function normalizeCatalogQuery(input: CatalogQueryInput = {}): NormalizedCatalogQuery {
  const rawAudience = singleValue(input.audience, "audience");
  let audience: ProductAudience | null = null;
  let audienceParam: NormalizedCatalogQuery["audienceParam"] = null;
  if (rawAudience) {
    const lowered = rawAudience.toLowerCase();
    if (["WOMEN", "MEN", "UNISEX"].includes(rawAudience)) {
      audience = rawAudience as ProductAudience;
      audienceParam = rawAudience.toLowerCase() as NormalizedCatalogQuery["audienceParam"];
    } else {
      const parsed = catalogAudienceParamSchema.safeParse(lowered);
      if (!parsed.success) throw validationError("Unsupported catalog audience filter.", { key: "audience" });
      audienceParam = parsed.data;
      audience = audienceParamToDomain[parsed.data];
    }
  }

  const family = singleValue(input.family, "family")?.toLowerCase() ?? null;
  if (family && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(family)) throw validationError("Unsupported catalog family filter.", { key: "family" });

  const minPrice = parsePrice(input.minPrice, "minPrice");
  const maxPrice = parsePrice(input.maxPrice, "maxPrice");
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) throw validationError("Catalog price range is impossible.", { key: "price" });

  const rawAvailability = singleValue(input.availability, "availability");
  const availability = rawAvailability ? catalogAvailabilitySchema.parse(rawAvailability) : null;
  const rawConcentration = singleValue(input.concentration, "concentration");
  const concentration = rawConcentration ? catalogConcentrationSchema.parse(rawConcentration) : null;
  const rawSort = singleValue(input.sort, "sort");
  const sort = rawSort ? catalogSortSchema.parse(rawSort) : "featured";

  return { audience, audienceParam, family, minPrice, maxPrice, availability, concentration, sort };
}

function priceFromVariants(product: Product) {
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const variants = activeVariants.length ? activeVariants : product.variants;
  const lowest = variants.reduce((current, variant) => variant.price.amount < current.price.amount ? variant : current, variants[0]);
  return { variants, lowest, price: { amount: lowest.price.amount, currency: lowest.price.currency, isFrom: variants.length > 1 } };
}

function availabilityFromStock(stock: Array<{ available: number } | null>): CatalogAvailability {
  if (stock.some((entry) => entry && entry.available > 0)) return "available";
  if (stock.length && stock.every((entry) => entry && entry.available <= 0)) return "out-of-stock";
  return "untracked";
}

function sortCatalog(items: FragranceCatalogItem[], query: NormalizedCatalogQuery) {
  const sorted = [...items];
  if (query.sort === "newest") return sorted.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.name.localeCompare(b.name));
  if (query.sort === "price-asc") return sorted.sort((a, b) => a.price.amount - b.price.amount || a.name.localeCompare(b.name));
  if (query.sort === "price-desc") return sorted.sort((a, b) => b.price.amount - a.price.amount || a.name.localeCompare(b.name));
  if (query.sort === "name-asc" || query.sort === "featured") return sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}

function countBy<T extends string>(items: FragranceCatalogItem[], values: readonly T[], getValue: (item: FragranceCatalogItem) => string | null) {
  return values.map((value) => ({ value, count: items.filter((item) => getValue(item) === value).length }));
}

function buildFacets(items: FragranceCatalogItem[]): CatalogFacets {
  const audiences = countBy(items, catalogAudienceParamValues, (item) => item.audience?.toLowerCase() ?? null)
    .filter((item) => item.count > 0)
    .map((item) => ({ value: item.value, label: item.value[0].toUpperCase() + item.value.slice(1), count: item.count }));
  const familyMap = new Map<string, { label: string; count: number }>();
  items.forEach((item) => {
    if (!item.family || !item.familySlug) return;
    const current = familyMap.get(item.familySlug) ?? { label: item.family, count: 0 };
    current.count += 1;
    familyMap.set(item.familySlug, current);
  });
  const families = [...familyMap.entries()].map(([value, item]) => ({ value, label: item.label, count: item.count })).sort((a, b) => a.label.localeCompare(b.label));
  const availability = countBy(items, catalogAvailabilityValues, (item) => item.availability)
    .filter((item) => item.count > 0)
    .map((item) => ({ value: item.value, label: item.value === "available" ? "Available" : item.value === "out-of-stock" ? "Out of stock" : "Untracked", count: item.count }));
  const concentrations = catalogConcentrationValues
    .map((value) => ({ value, count: items.filter((item) => item.concentrations.includes(value)).length }))
    .filter((item) => item.count > 0)
    .map((item) => ({ value: item.value, label: item.value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()), count: item.count }));
  const prices = items.map((item) => item.price.amount);
  return { audiences, families, availability, concentrations, price: { min: prices.length ? Math.min(...prices) : null, max: prices.length ? Math.max(...prices) : null } };
}

function applyFilters(items: FragranceCatalogItem[], query: NormalizedCatalogQuery) {
  return items.filter((item) => {
    if (query.audience && item.audience !== query.audience) return false;
    if (query.family && item.familySlug !== query.family) return false;
    if (query.minPrice !== null && item.price.amount < query.minPrice) return false;
    if (query.maxPrice !== null && item.price.amount > query.maxPrice) return false;
    if (query.availability && item.availability !== query.availability) return false;
    if (query.concentration && !item.concentrations.includes(query.concentration)) return false;
    return true;
  });
}

function buildActiveFilters(query: NormalizedCatalogQuery, facets: CatalogFacets): CatalogActiveFilter[] {
  const entries = new URLSearchParams();
  if (query.audienceParam) entries.set("audience", query.audienceParam);
  if (query.family) entries.set("family", query.family);
  if (query.minPrice !== null) entries.set("minPrice", String(minorUnitToMajorUnit(query.minPrice)));
  if (query.maxPrice !== null) entries.set("maxPrice", String(minorUnitToMajorUnit(query.maxPrice)));
  if (query.availability) entries.set("availability", query.availability);
  if (query.concentration) entries.set("concentration", query.concentration);
  if (query.sort !== "featured") entries.set("sort", query.sort);
  const hrefWithout = (...keys: string[]) => {
    const next = new URLSearchParams(entries);
    keys.forEach((key) => next.delete(key));
    const value = next.toString();
    return value ? `/fragrances?${value}` : "/fragrances";
  };
  const filters: CatalogActiveFilter[] = [];
  if (query.audienceParam) filters.push({ key: "audience", label: facets.audiences.find((item) => item.value === query.audienceParam)?.label ?? query.audienceParam, href: hrefWithout("audience") });
  if (query.family) filters.push({ key: "family", label: facets.families.find((item) => item.value === query.family)?.label ?? query.family, href: hrefWithout("family") });
  if (query.minPrice !== null || query.maxPrice !== null) filters.push({ key: "minPrice", label: `$${query.minPrice !== null ? minorUnitToMajorUnit(query.minPrice) : "0"}–$${query.maxPrice !== null ? minorUnitToMajorUnit(query.maxPrice) : "∞"}`, href: hrefWithout("minPrice", "maxPrice") });
  if (query.availability) filters.push({ key: "availability", label: facets.availability.find((item) => item.value === query.availability)?.label ?? query.availability, href: hrefWithout("availability") });
  if (query.concentration) filters.push({ key: "concentration", label: facets.concentrations.find((item) => item.value === query.concentration)?.label ?? query.concentration, href: hrefWithout("concentration") });
  return filters;
}

const getPublishedFragranceCatalog = unstable_cache(
  async (): Promise<FragranceCatalogItem[]> => {
    const publishedProducts = await new MongoProductRepository().listPublished();
    const taxonomy = new MongoProductFragranceTaxonomyRepository();
    const families = new MongoFragranceFamilyRepository();
    const collections = await new MongoCollectionRepository().listVisible();
    const collectionByProductId = new Map<string, string>();
    collections.forEach((collection) => collection.productMemberships.forEach((membership) => collectionByProductId.set(membership.productId, collection.name)));

    // Batch every per-product lookup into a handful of queries instead of firing
    // 2+N round-trips per product (was a Mongo N+1: taxonomy + family + one
    // inventory lookup per variant, for every product, on every request).
    const productIds = publishedProducts.map((product) => product.id);
    const allFamilyLinks = await taxonomy.listFamiliesByProductIds(productIds);
    const familyLinksByProduct = new Map<string, typeof allFamilyLinks>();
    allFamilyLinks.forEach((link) => {
      const list = familyLinksByProduct.get(link.productId) ?? [];
      list.push(link);
      familyLinksByProduct.set(link.productId, list);
    });
    const familyRowsById = new Map(
      (await families.findByIds([...new Set(allFamilyLinks.map((link) => link.familyId))])).map((family) => [family.id, family]),
    );

    const allVariantIds = publishedProducts.flatMap((product) => product.variants.map((variant) => variant.id));
    const inventoryByVariantId = new Map(
      (await new MongoInventoryRepository().listByVariantIds(allVariantIds)).map((row) => [row.variantId, row]),
    );

    return publishedProducts.map((product) => {
      const familyLinks = familyLinksByProduct.get(product.id) ?? [];
      const publishedFamily = familyLinks
        .map((link) => familyRowsById.get(link.familyId))
        .filter((family): family is NonNullable<typeof family> => family != null && family.status === "PUBLISHED")
        .sort((a, b) => (familyLinks.find((link) => link.familyId === a.id)?.position ?? 0) - (familyLinks.find((link) => link.familyId === b.id)?.position ?? 0))[0];
      const { variants, lowest, price } = priceFromVariants(product);
      const availability = availabilityFromStock(variants.map((variant) => inventoryByVariantId.get(variant.id) ?? null));
      const image = product.media.filter((asset) => asset.kind === "IMAGE").sort((a, b) => a.position - b.position)[0];
      const video = product.media.filter((asset) => asset.kind === "VIDEO" && asset.provider === "CLOUDINARY").sort((a, b) => a.position - b.position)[0];
      const media = image ?? video ?? null;
      const selectedMedia = media ? posterForMedia({ url: media.url, alt: media.alt, kind: media.kind }) : null;
      return {
        slug: product.slug,
        name: product.name,
        description: product.description,
        brand: product.brand,
        audience: product.audience ?? null,
        family: publishedFamily?.name ?? null,
        familySlug: publishedFamily?.slug ?? null,
        collection: collectionByProductId.get(product.id) ?? null,
        concentration: lowest.concentration,
        concentrations: [...new Set(variants.map((variant) => variant.concentration))],
        volumeMl: lowest.volumeMl,
        variants: variants
          .map((variant) => ({
            id: variant.id,
            name: variant.name,
            volumeMl: variant.volumeMl,
            concentration: variant.concentration,
            availability: (inventoryByVariantId.has(variant.id)
              ? (inventoryByVariantId.get(variant.id)?.available ?? 0) > 0
                ? "AVAILABLE"
                : "OUT_OF_STOCK"
              : "UNTRACKED") as "AVAILABLE" | "OUT_OF_STOCK" | "UNTRACKED",
          }))
          .sort((a, b) => a.volumeMl - b.volumeMl),
        availability,
        price,
        createdAt: product.createdAt.toISOString(),
        launchAt: product.launchAt?.toISOString() ?? null,
        media: selectedMedia,
      } satisfies FragranceCatalogItem;
    });
  },
  ["published-fragrance-catalog"],
  { revalidate: 300 },
);

let publishedFragranceCatalogSnapshot: { expiresAt: number; value: FragranceCatalogItem[] } | null = null;
let publishedFragranceCatalogPromise: Promise<FragranceCatalogItem[]> | null = null;

async function readPublishedFragranceCatalog() {
  if (publishedFragranceCatalogSnapshot && publishedFragranceCatalogSnapshot.expiresAt > Date.now()) {
    return publishedFragranceCatalogSnapshot.value;
  }
  publishedFragranceCatalogPromise ??= getPublishedFragranceCatalog();
  try {
    const value = await publishedFragranceCatalogPromise;
    publishedFragranceCatalogSnapshot = { expiresAt: Date.now() + 300_000, value };
    return value;
  } finally {
    publishedFragranceCatalogPromise = null;
  }
}

export async function listPublishedFragrances(options?: CatalogQueryInput): Promise<PublishedFragrancesResult> {
  try {
    const query = normalizeCatalogQuery(options);
    const items = await readPublishedFragranceCatalog();

    const facets = buildFacets(items);
    const filtered = applyFilters(items, query);
    return { products: sortCatalog(filtered, query), query, facets, activeFilters: buildActiveFilters(query, facets), error: null };
  } catch (error) {
    return { products: [], query: emptyQuery, facets: emptyFacets, activeFilters: [], error: serializePublicError(error) };
  }
}
