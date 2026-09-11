import "server-only";

import { ObjectId } from "mongodb";

import { notFoundError, validationError } from "../../lib/errors/aura-error.ts";
import { getMongoDb } from "../db/mongodb.ts";
import { MongoCartProductRepository } from "../repositories/mongo-cart-product-repository.ts";
import type { Product } from "../../domain/product/product.schema.ts";

const COLLECTION_SLUG = "cinematic-worlds";

export async function resolveCinematicWorld(worldNumber: number): Promise<Product> {
  if (!Number.isInteger(worldNumber) || worldNumber < 1 || worldNumber > 6) {
    throw validationError("Invalid cinematic world.");
  }

  const collection = await (await getMongoDb()).collection<{
    productMemberships?: { productId: string; position: number }[];
  }>("collections").findOne({ slug: COLLECTION_SLUG });
  const membership = collection?.productMemberships?.find(
    (item) => item.position === worldNumber - 1,
  );

  if (!membership || !ObjectId.isValid(membership.productId)) {
    throw notFoundError("Cinematic fragrance");
  }

  const product = (await new MongoCartProductRepository().findByIds([membership.productId]))[0];
  if (!product) throw notFoundError("Cinematic fragrance");

  return product;
}

export async function resolveCinematicAcquireTarget(worldNumber: number): Promise<{ product: Product; variant: Product["variants"][number] }> {
  const product = await resolveCinematicWorld(worldNumber);
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  if (activeVariants.length !== 1) {
    throw validationError(
      activeVariants.length > 1
        ? "Choose a fragrance size from the product page before adding this item."
        : "This fragrance is not currently available.",
    );
  }

  return { product, variant: activeVariants[0] };
}
