import type { Collection, CollectionCreateInput } from "@/domain/collection/collection.schema";

export interface CollectionRepository {
  findBySlug(slug: string): Promise<Collection | null>;
  listVisible(): Promise<Collection[]>;
  create(input: CollectionCreateInput): Promise<Collection>;
}
