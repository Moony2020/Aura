import "server-only";

import type { PublicError } from "@/lib/errors/serialize";
import { serializePublicError } from "@/lib/errors/serialize";
import { MongoCollectionRepository } from "@/server/repositories/mongo-collection-repository";
import { MongoProductRepository } from "@/server/repositories/mongo-product-repository";
import type { FragranceCatalogItem } from "@/server/queries/list-published-fragrances";
import { listPublishedFragrances } from "@/server/queries/list-published-fragrances";

export type PublicCollectionDetail = { slug: string; name: string; description: string; campaignMediaUrl: string | null; products: FragranceCatalogItem[] };
export type PublicCollectionResult = { collection: PublicCollectionDetail | null; error: PublicError | null };

export async function getPublicCollection(slug: string): Promise<PublicCollectionResult> {
  try {
    const collection = await new MongoCollectionRepository().findBySlug(slug);
    if (!collection || collection.status !== "PUBLISHED" || collection.visibility !== "PUBLIC") return { collection: null, error: null };
    const products = await new MongoProductRepository().findByIds(collection.productMemberships.map((membership) => membership.productId));
    const publishedById = new Map(products.filter((product) => product.status === "PUBLISHED").map((product) => [product.id, product]));
    const catalog = await listPublishedFragrances();
    if (catalog.error) return { collection: null, error: catalog.error };
    const catalogBySlug = new Map(catalog.products.map((product) => [product.slug, product]));
    const orderedProducts = collection.productMemberships
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((membership) => publishedById.get(membership.productId))
      .filter((product): product is NonNullable<typeof product> => Boolean(product))
      .map((product) => catalogBySlug.get(product.slug))
      .filter((product): product is FragranceCatalogItem => Boolean(product));
    return { collection: { slug: collection.slug, name: collection.name, description: collection.description, campaignMediaUrl: collection.campaignMedia[0]?.url ?? null, products: orderedProducts }, error: null };
  } catch (error) {
    return { collection: null, error: serializePublicError(error) };
  }
}
