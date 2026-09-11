import "server-only";

import { ObjectId, type Collection } from "mongodb";

import { inventorySchema, type Inventory } from "../../domain/inventory/inventory.schema.ts";
import { getMongoDb } from "../db/mongodb.ts";
import type { CartInventoryRepository } from "./cart-inventory-repository.ts";

type InventoryDocument = Inventory & { _id: ObjectId };

export class MongoCartInventoryRepository implements CartInventoryRepository {
  private async collection(): Promise<Collection<InventoryDocument>> {
    return (await getMongoDb()).collection<InventoryDocument>("inventory");
  }

  async getByVariantId(variantId: string): Promise<Inventory | null> {
    const document = await (await this.collection()).findOne({ variantId });
    return document ? inventorySchema.parse(document) : null;
  }
}
