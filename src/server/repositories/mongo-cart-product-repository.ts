import "server-only";

import { ObjectId, type Collection } from "mongodb";

import { productSchema, type Product } from "../../domain/product/product.schema.ts";
import { getMongoDb } from "../db/mongodb.ts";
import type { CartProductRepository } from "./cart-product-repository.ts";

type ProductDocument = Omit<Product, "id"> & { _id: ObjectId };

function toProduct(document: ProductDocument): Product {
  return productSchema.parse({
    ...document,
    id: document._id.toHexString(),
  });
}

export class MongoCartProductRepository implements CartProductRepository {
  private async collection(): Promise<Collection<ProductDocument>> {
    return (await getMongoDb()).collection<ProductDocument>("products");
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const document = await (await this.collection()).findOne({ slug });
    return document ? toProduct(document) : null;
  }

  async findByIds(ids: readonly string[]): Promise<Product[]> {
    const objectIds = ids.map((id) => new ObjectId(id));
    const documents = await (await this.collection())
      .find({ _id: { $in: objectIds } })
      .toArray();

    return documents.map(toProduct);
  }
}
