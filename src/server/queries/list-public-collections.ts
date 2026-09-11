import "server-only";

import type { PublicError } from "@/lib/errors/serialize";
import { serializePublicError } from "@/lib/errors/serialize";
import { MongoCollectionRepository } from "@/server/repositories/mongo-collection-repository";

export type PublicCollectionSummary = { slug: string; name: string; description: string; campaignMediaUrl: string | null };
export type PublicCollectionsResult = { collections: PublicCollectionSummary[]; error: PublicError | null };

export async function listPublicCollections(): Promise<PublicCollectionsResult> {
  try {
    const collections = await new MongoCollectionRepository().listVisible();
    return {
      collections: collections.map((collection) => ({ slug: collection.slug, name: collection.name, description: collection.description, campaignMediaUrl: collection.campaignMedia[0]?.url ?? null })),
      error: null,
    };
  } catch (error) {
    return { collections: [], error: serializePublicError(error) };
  }
}
