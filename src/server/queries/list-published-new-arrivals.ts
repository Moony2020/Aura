import "server-only";

import type { FragranceCatalogItem } from "@/server/queries/list-published-fragrances";
import { listPublishedFragrances } from "@/server/queries/list-published-fragrances";
import type { PublicError } from "@/lib/errors/serialize";

export type PublishedNewArrivalsResult = {
  products: FragranceCatalogItem[];
  error: PublicError | null;
};

export async function listPublishedNewArrivals(now = new Date()): Promise<PublishedNewArrivalsResult> {
  const result = await listPublishedFragrances();
  if (result.error) return { products: [], error: result.error };

  return {
    products: result.products
      .filter((product) => product.launchAt !== null && Date.parse(product.launchAt) <= now.getTime())
      .sort((a, b) => Date.parse(b.launchAt ?? "") - Date.parse(a.launchAt ?? "") || a.name.localeCompare(b.name)),
    error: null,
  };
}

