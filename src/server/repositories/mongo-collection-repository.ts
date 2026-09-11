import "server-only";

import { ObjectId, type Collection as MongoCollection } from "mongodb";

import { collectionCreateSchema, collectionSchema, type Collection, type CollectionCreateInput } from "@/domain/collection/collection.schema";
import { getMongoDb } from "@/server/db/mongodb";

import type { CollectionRepository } from "./collection-repository";
import { MongoProductRepository } from "./mongo-product-repository";

type CollectionDocument = Omit<Collection, "id"> & { _id: ObjectId };
const collectionName = "collections";

function toCollection(document: CollectionDocument): Collection {
  return collectionSchema.parse({ ...document, id: document._id.toHexString() });
}

export class MongoCollectionRepository implements CollectionRepository {
  private readonly productRepository = new MongoProductRepository();

  private async collection(): Promise<MongoCollection<CollectionDocument>> {
    return (await getMongoDb()).collection<CollectionDocument>(collectionName);
  }

  async findBySlug(slug: string): Promise<Collection | null> {
    const document = await (await this.collection()).findOne({ slug });
    return document ? toCollection(document) : null;
  }

  async listVisible(): Promise<Collection[]> {
    const documents = await (await this.collection())
      .find({ status: "PUBLISHED", visibility: "PUBLIC" })
      .sort({ updatedAt: -1 })
      .toArray();
    return documents.map(toCollection);
  }

  async create(input: CollectionCreateInput): Promise<Collection> {
    const parsed = collectionCreateSchema.parse(input);
    const productIds = parsed.productMemberships.map(({ productId }) => productId);
    const products = await this.productRepository.findByIds(productIds);
    if (products.length !== productIds.length) {
      throw new Error("Collection membership references a missing product.");
    }
    if (parsed.status === "PUBLISHED" && parsed.visibility === "PUBLIC" && products.some((product) => product.status !== "PUBLISHED")) {
      throw new Error("A public published collection can reference only published products.");
    }
    const now = new Date();
    const document: CollectionDocument = { ...parsed, _id: new ObjectId(), createdAt: now, updatedAt: now };
    await (await this.collection()).insertOne(document);
    return toCollection(document);
  }
}
