import type { Product } from "../../domain/product/product.schema.ts";

export interface CartProductRepository {
  findBySlug(slug: string): Promise<Product | null>;
  findByIds(ids: readonly string[]): Promise<Product[]>;
}
