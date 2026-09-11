import "server-only";

import { unstable_cache } from "next/cache";
import { z } from "zod";

import type { ProductAudience } from "@/domain/product/product.schema";
import { validationError } from "@/lib/errors/aura-error";
import type { PublicError } from "@/lib/errors/serialize";
import { serializePublicError } from "@/lib/errors/serialize";
import { MongoCollectionRepository } from "@/server/repositories/mongo-collection-repository";
import {
  MongoFragranceFamilyRepository,
  MongoFragranceNoteRepository,
  MongoProductFragranceTaxonomyRepository,
} from "@/server/repositories/mongo-fragrance-repository";
import { MongoProductRepository } from "@/server/repositories/mongo-product-repository";

export const SEARCH_QUERY_MAX_LENGTH = 80;
export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUICK_LIMIT = 8;

const searchQuerySchema = z
  .string()
  .trim()
  .max(SEARCH_QUERY_MAX_LENGTH)
  .transform((value) => value.replace(/\s+/g, " "));

export type SearchMatchKind = "name" | "collection" | "family" | "taxonomy" | "description" | "sku";

export type FragranceSearchResult = {
  slug: string;
  name: string;
  description: string;
  audience: ProductAudience | null;
  family: string | null;
  collection: string | null;
  price: { amount: number; currency: string; isFrom: boolean };
  thumbnail: { url: string; alt: string; kind: "IMAGE" | "VIDEO"; posterUrl?: string } | null;
  match: { kind: SearchMatchKind; label: string };
};

export type FragranceSearchResponse = {
  query: string;
  results: FragranceSearchResult[];
  error: PublicError | null;
};

type IndexedProduct = FragranceSearchResult & {
  haystack: {
    name: string[];
    collection: string[];
    family: string[];
    taxonomy: string[];
    description: string[];
    sku: string[];
  };
};

function normalizeForSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function tokensFor(value: string | null | undefined): string[] {
  const normalized = normalizeForSearch(value ?? "");
  return normalized ? [normalized, ...normalized.split(" ").filter((part) => part.length > 1)] : [];
}

function posterForMedia(media: FragranceSearchResult["thumbnail"]) {
  if (!media || media.kind !== "VIDEO" || !media.url.includes("res.cloudinary.com")) return media;
  const posterUrl = media.url.replace("/video/upload/", "/video/upload/so_0/").replace(/\.(mp4|mov|webm)(\?.*)?$/i, ".jpg$2");
  return { ...media, posterUrl };
}

function priceFromVariants(product: Awaited<ReturnType<MongoProductRepository["listPublished"]>>[number]) {
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const variants = activeVariants.length ? activeVariants : product.variants;
  const lowest = variants.reduce((current, variant) => (variant.price.amount < current.price.amount ? variant : current), variants[0]);
  return { amount: lowest.price.amount, currency: lowest.price.currency, isFrom: variants.length > 1 };
}

function mediaFromProduct(product: Awaited<ReturnType<MongoProductRepository["listPublished"]>>[number]) {
  const image = product.media.filter((asset) => asset.kind === "IMAGE").sort((a, b) => a.position - b.position)[0];
  const video = product.media
    .filter((asset) => asset.kind === "VIDEO" && asset.provider === "CLOUDINARY")
    .sort((a, b) => a.position - b.position)[0];
  const media = image ?? video ?? null;
  return media ? posterForMedia({ url: media.url, alt: media.alt, kind: media.kind }) : null;
}

function scoreField(values: string[], query: string, exactScore: number, containsScore: number) {
  let score = 0;
  for (const value of values) {
    if (value === query) score = Math.max(score, exactScore);
    else if (value.startsWith(query)) score = Math.max(score, containsScore + 4);
    else if (value.includes(query)) score = Math.max(score, containsScore);
  }
  return score;
}

function rankProduct(product: IndexedProduct, normalizedQuery: string): { score: number; match: FragranceSearchResult["match"] } {
  const scores: Array<{ kind: SearchMatchKind; label: string; score: number }> = [
    { kind: "name", label: "Name match", score: scoreField(product.haystack.name, normalizedQuery, 120, 96) },
    { kind: "collection", label: product.collection ? `Collection · ${product.collection}` : "Collection match", score: scoreField(product.haystack.collection, normalizedQuery, 82, 68) },
    { kind: "family", label: product.family ? `Family · ${product.family}` : "Family match", score: scoreField(product.haystack.family, normalizedQuery, 74, 58) },
    { kind: "taxonomy", label: "Notes and accords", score: scoreField(product.haystack.taxonomy, normalizedQuery, 62, 46) },
    { kind: "description", label: "Description match", score: scoreField(product.haystack.description, normalizedQuery, 38, 24) },
    { kind: "sku", label: "SKU match", score: scoreField(product.haystack.sku, normalizedQuery, 28, 20) },
  ];
  const best = scores.sort((a, b) => b.score - a.score)[0];
  return { score: best.score, match: { kind: best.kind, label: best.label } };
}

async function buildSearchIndex(): Promise<IndexedProduct[]> {
  const productRepository = new MongoProductRepository();
  const taxonomyRepository = new MongoProductFragranceTaxonomyRepository();
  const familyRepository = new MongoFragranceFamilyRepository();
  const noteRepository = new MongoFragranceNoteRepository();
  const collectionRepository = new MongoCollectionRepository();

  const [products, collections] = await Promise.all([productRepository.listPublished(), collectionRepository.listVisible()]);
  const collectionByProductId = new Map<string, string>();
  collections.forEach((collection) => {
    collection.productMemberships.forEach((membership) => collectionByProductId.set(membership.productId, collection.name));
  });

  const productIds = products.map((product) => product.id);
  const [familyLinks, noteLinks] = await Promise.all([
    taxonomyRepository.listFamiliesByProductIds(productIds),
    taxonomyRepository.listNotesByProductIds(productIds),
  ]);
  const familyLinksByProductId = new Map<string, typeof familyLinks>();
  familyLinks.forEach((link) => {
    const links = familyLinksByProductId.get(link.productId) ?? [];
    links.push(link);
    familyLinksByProductId.set(link.productId, links);
  });
  const noteLinksByProductId = new Map<string, typeof noteLinks>();
  noteLinks.forEach((link) => {
    const links = noteLinksByProductId.get(link.productId) ?? [];
    links.push(link);
    noteLinksByProductId.set(link.productId, links);
  });
  const [families, notes] = await Promise.all([
    familyRepository.findByIds([...new Set(familyLinks.map((link) => link.familyId))]),
    noteRepository.findByIds([...new Set(noteLinks.map((link) => link.noteId))]),
  ]);
  const familyById = new Map(families.map((family) => [family.id, family]));
  const noteById = new Map(notes.map((note) => [note.id, note]));

  return products.map((product) => {
      const productFamilyLinks = familyLinksByProductId.get(product.id) ?? [];
      const productNoteLinks = noteLinksByProductId.get(product.id) ?? [];
      const productFamilies = productFamilyLinks.map((link) => familyById.get(link.familyId)).filter((family): family is NonNullable<typeof family> => family != null);
      const productNotes = productNoteLinks.map((link) => noteById.get(link.noteId)).filter((note): note is NonNullable<typeof note> => note != null);
      const publishedFamilies = productFamilies.filter((family) => family.status === "PUBLISHED");
      const publishedNotes = productNotes.filter((note) => note.status === "PUBLISHED");
      const family = publishedFamilies[0]?.name ?? null;
      const collection = collectionByProductId.get(product.id) ?? null;
      const taxonomyNames = [...publishedFamilies.map((item) => item.name), ...publishedNotes.map((item) => item.name), ...publishedNotes.map((item) => item.kind)];

      return {
        slug: product.slug,
        name: product.name,
        description: product.description,
        audience: product.audience ?? null,
        family,
        collection,
        price: priceFromVariants(product),
        thumbnail: mediaFromProduct(product),
        match: { kind: "name", label: "Name match" },
        haystack: {
          name: tokensFor(product.name),
          collection: tokensFor(collection),
          family: tokensFor(family),
          taxonomy: taxonomyNames.flatMap(tokensFor),
          description: tokensFor(product.description),
          sku: product.variants.flatMap((variant) => tokensFor(variant.sku)),
        },
      } satisfies IndexedProduct;
    });
}

const getSearchIndex = unstable_cache(
  buildSearchIndex,
  ["published-fragrance-search-index"],
  { revalidate: 300 },
);

declare global {
  // eslint-disable-next-line no-var
  var __auraSearchIndexSnapshot: { expiresAt: number; value: IndexedProduct[] } | undefined;
}

let searchIndexSnapshot: { expiresAt: number; value: IndexedProduct[] } | null = null;
let searchIndexPromise: Promise<IndexedProduct[]> | null = null;

async function refreshSearchIndex() {
  searchIndexPromise ??= getSearchIndex();
  try {
    const value = await searchIndexPromise;
    const snapshot = { expiresAt: Date.now() + 300_000, value };
    searchIndexSnapshot = snapshot;
    globalThis.__auraSearchIndexSnapshot = snapshot;
    return value;
  } finally {
    searchIndexPromise = null;
  }
}

async function readSearchIndex() {
  const now = Date.now();
  const cachedSnapshot = globalThis.__auraSearchIndexSnapshot ?? searchIndexSnapshot;

  if (cachedSnapshot && cachedSnapshot.expiresAt > now) {
    searchIndexSnapshot = cachedSnapshot;
    globalThis.__auraSearchIndexSnapshot = cachedSnapshot;
    return cachedSnapshot.value;
  }

  // Keep serving the last known-good catalog while Atlas revalidates. This
  // avoids making every search wait on a slow or temporarily unavailable
  // database connection after the cached snapshot has expired.
  if (cachedSnapshot) {
    searchIndexSnapshot = cachedSnapshot;
    globalThis.__auraSearchIndexSnapshot = cachedSnapshot;
    void refreshSearchIndex().catch(() => {});
    return cachedSnapshot.value;
  }

  return refreshSearchIndex();
}

// Background pre-warm
if (typeof window === "undefined") {
  readSearchIndex().catch(() => {});
}

export async function searchPublishedFragrances(query: string, options?: { limit?: number }): Promise<FragranceSearchResponse> {
  try {
    const parsedQuery = searchQuerySchema.safeParse(query);
    if (!parsedQuery.success) throw validationError("Search query validation failed.", { maxLength: SEARCH_QUERY_MAX_LENGTH });

    const normalizedQuery = normalizeForSearch(parsedQuery.data);
    if (!normalizedQuery || normalizedQuery.length < SEARCH_QUERY_MIN_LENGTH) {
      return { query: parsedQuery.data, results: [], error: null };
    }

    const index = await readSearchIndex();
    const ranked = index
      .map((product) => {
        const ranking = rankProduct(product, normalizedQuery);
        return { product, ...ranking };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
      .slice(0, Math.max(1, Math.min(options?.limit ?? 30, 30)))
      .map(({ product, match }) => ({
        slug: product.slug,
        name: product.name,
        description: product.description,
        audience: product.audience,
        family: product.family,
        collection: product.collection,
        price: product.price,
        thumbnail: product.thumbnail,
        match,
      }));

    return { query: parsedQuery.data, results: ranked, error: null };
  } catch (error) {
    return { query: typeof query === "string" ? query.slice(0, SEARCH_QUERY_MAX_LENGTH) : "", results: [], error: serializePublicError(error) };
  }
}
