import "server-only";

import { ObjectId, type Collection, type Document, type Filter } from "mongodb";

import { cartCreateSchema, cartSchema, type Cart } from "../../domain/cart/cart.schema.ts";
import { ERROR_CODES } from "../../lib/errors/error-codes.ts";
import { AuraError, conflictError, notFoundError } from "../../lib/errors/aura-error.ts";
import { getMongoDb } from "../db/mongodb.ts";
import type {
  AddOrIncrementLineInput,
  CartMutationOptions,
  CartRepository,
  CreateGuestCartInput,
  CreateUserCartInput,
  RemoveLineInput,
  SetLineQuantityInput,
} from "./cart-repository.ts";

type CartDocument = Omit<Cart, "id"> & { _id: ObjectId };

const cartsCollectionName = "carts";

function toCart(document: CartDocument): Cart {
  const { _id, ...cart } = document;
  return cartSchema.parse({
    ...cart,
    id: _id.toHexString(),
  });
}

function activeFilter(cartId: string, expectedVersion?: number): Filter<CartDocument> {
  return {
    _id: new ObjectId(cartId),
    status: "ACTIVE",
    ...(expectedVersion === undefined ? {} : { version: expectedVersion }),
  };
}

function withMutationMetadata(update: Document, options?: CartMutationOptions) {
  const set = {
    updatedAt: new Date(),
    ...(options?.expiresAt ? { expiresAt: options.expiresAt } : {}),
  };

  return {
    ...update,
    $set: { ...(update.$set ?? {}), ...set },
    $inc: { ...(update.$inc ?? {}), version: 1 },
  };
}

export class MongoCartRepository implements CartRepository {
  private async collection(): Promise<Collection<CartDocument>> {
    return (await getMongoDb()).collection<CartDocument>(cartsCollectionName);
  }

  async findById(id: string): Promise<Cart | null> {
    const document = await (await this.collection()).findOne({ _id: new ObjectId(id) });
    return document ? toCart(document) : null;
  }

  async findActiveGuestCartByTokenHash(guestTokenHash: string): Promise<Cart | null> {
    const document = await (await this.collection()).findOne({
      "owner.kind": "GUEST",
      "owner.guestTokenHash": guestTokenHash,
      status: "ACTIVE",
    });

    return document ? toCart(document) : null;
  }

  async findActiveUserCart(userId: string): Promise<Cart | null> {
    const document = await (await this.collection()).findOne({
      "owner.kind": "USER",
      "owner.userId": userId,
      status: "ACTIVE",
    });

    return document ? toCart(document) : null;
  }

  async createGuestCart(input: CreateGuestCartInput): Promise<Cart> {
    const now = new Date();
    const parsed = cartCreateSchema.parse({
      owner: { kind: "GUEST", guestTokenHash: input.guestTokenHash },
      status: "ACTIVE",
      items: input.initialItems ?? [],
      version: 0,
      expiresAt: input.expiresAt,
    });
    const document: CartDocument = {
      ...parsed,
      _id: new ObjectId(),
      createdAt: now,
      updatedAt: now,
    };

    await (await this.collection()).insertOne(document);
    return toCart(document);
  }

  async createUserCart(input: CreateUserCartInput): Promise<Cart> {
    const now = new Date();
    const parsed = cartCreateSchema.parse({
      owner: { kind: "USER", userId: input.userId },
      status: "ACTIVE",
      items: input.initialItems ?? [],
      version: 0,
    });
    const document: CartDocument = {
      ...parsed,
      _id: new ObjectId(),
      createdAt: now,
      updatedAt: now,
    };

    await (await this.collection()).insertOne(document);
    return toCart(document);
  }

  async addOrIncrementLine(cartId: string, input: AddOrIncrementLineInput): Promise<Cart> {
    const collection = await this.collection();
    const now = new Date();
    const line = {
      productId: input.productId,
      variantId: input.variantId,
      quantity: input.quantity,
    };

    const result = await collection.findOneAndUpdate(
      activeFilter(cartId, input.expectedVersion),
      [
        {
          $set: {
            items: {
              $cond: [
                {
                  $in: [
                    `${line.productId}:${line.variantId}`,
                    {
                      $map: {
                        input: "$items",
                        as: "item",
                        in: { $concat: ["$$item.productId", ":", "$$item.variantId"] },
                      },
                    },
                  ],
                },
                {
                  $map: {
                    input: "$items",
                    as: "item",
                    in: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$$item.productId", line.productId] },
                            { $eq: ["$$item.variantId", line.variantId] },
                          ],
                        },
                        {
                          productId: "$$item.productId",
                          variantId: "$$item.variantId",
                          quantity: { $add: ["$$item.quantity", line.quantity] },
                        },
                        "$$item",
                      ],
                    },
                  },
                },
                { $concatArrays: ["$items", [line]] },
              ],
            },
            version: { $add: ["$version", 1] },
            updatedAt: now,
            ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
          },
        },
      ],
      { returnDocument: "after" },
    );

    if (!result) return this.throwMutationMiss(cartId, input.expectedVersion);
    return toCart(result);
  }

  async setLineQuantity(cartId: string, input: SetLineQuantityInput): Promise<Cart> {
    if (input.quantity === 0) return this.removeLine(cartId, input);

    const result = await (await this.collection()).findOneAndUpdate(
      {
        ...activeFilter(cartId, input.expectedVersion),
        items: { $elemMatch: { productId: input.productId, variantId: input.variantId } },
      },
      withMutationMetadata({
        $set: {
          "items.$.quantity": input.quantity,
        },
      }, input),
      { returnDocument: "after" },
    );

    if (!result) return this.throwMutationMiss(cartId, input.expectedVersion);
    return toCart(result);
  }

  async removeLine(cartId: string, input: RemoveLineInput): Promise<Cart> {
    const result = await (await this.collection()).findOneAndUpdate(
      {
        ...activeFilter(cartId, input.expectedVersion),
        items: { $elemMatch: { productId: input.productId, variantId: input.variantId } },
      },
      withMutationMetadata({
        $pull: {
          items: { productId: input.productId, variantId: input.variantId },
        },
      }, input),
      { returnDocument: "after" },
    );

    if (!result) return this.throwMutationMiss(cartId, input.expectedVersion);
    return toCart(result);
  }

  async clearLines(cartId: string, options?: CartMutationOptions): Promise<Cart> {
    const result = await (await this.collection()).findOneAndUpdate(
      activeFilter(cartId, options?.expectedVersion),
      withMutationMetadata({ $set: { items: [] } }, options),
      { returnDocument: "after" },
    );

    if (!result) return this.throwMutationMiss(cartId, options?.expectedVersion);
    return toCart(result);
  }

  async markExpired(cartId: string): Promise<Cart | null> {
    const result = await (await this.collection()).findOneAndUpdate(
      { _id: new ObjectId(cartId), status: "ACTIVE" },
      { $set: { status: "EXPIRED", updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    return result ? toCart(result) : null;
  }

  private async throwMutationMiss(cartId: string, expectedVersion?: number): Promise<never> {
    const existing = await this.findById(cartId);
    if (existing?.status === "ACTIVE" && expectedVersion !== undefined && existing.version !== expectedVersion) {
      throw conflictError("Cart version conflict.", { expectedVersion, currentVersion: existing.version });
    }
    if (!existing) throw notFoundError("Cart");
    throw new AuraError(ERROR_CODES.INVALID_STATE_TRANSITION, "Cart is not active.");
  }
}
