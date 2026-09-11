import type { Product, ProductCreateInput } from "@/domain/product/product.schema";

export interface ProductRepository {
  findBySlug(slug: string): Promise<Product | null>;
  findByIds(ids: readonly string[]): Promise<Product[]>;
  listPublished(): Promise<Product[]>;
  create(input: ProductCreateInput): Promise<Product>;
}
