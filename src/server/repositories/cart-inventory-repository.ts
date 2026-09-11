import type { Inventory } from "../../domain/inventory/inventory.schema.ts";

export interface CartInventoryRepository {
  getByVariantId(variantId: string): Promise<Inventory | null>;
}
