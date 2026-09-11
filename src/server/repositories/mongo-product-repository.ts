import "server-only";

import { ObjectId, type Collection } from "mongodb";

import {
  productCreateSchema,
  productSchema,
  type Product,
  type ProductCreateInput,
} from "@/domain/product/product.schema";
import { getMongoDb } from "@/server/db/mongodb";

import type { ProductRepository } from "./product-repository";

type ProductDocument = Omit<Product, "id"> & { _id: ObjectId };

const productsCollectionName = "products";

function toProduct(document: ProductDocument): Product {
  return productSchema.parse({
    ...document,
    id: document._id.toHexString(),
  });
}

export class MongoProductRepository implements ProductRepository {
  private async collection(): Promise<Collection<ProductDocument>> {
    return (await getMongoDb()).collection<ProductDocument>(productsCollectionName);
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

  async listPublished(): Promise<Product[]> {
    const documents = await (await this.collection())
      .find({ status: "PUBLISHED" })
      .sort({ name: 1 })
      .toArray();

    return documents.map(toProduct);
  }

  async create(input: ProductCreateInput): Promise<Product> {
    const parsed = productCreateSchema.parse(input);
    const now = new Date();
    const document: ProductDocument = {
      ...parsed,
      _id: new ObjectId(),
      createdAt: now,
      updatedAt: now,
    };

    await (await this.collection()).insertOne(document);
    return toProduct(document);
  }
}
