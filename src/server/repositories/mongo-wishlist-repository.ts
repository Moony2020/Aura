import "server-only";
import { ObjectId, type Collection, type Filter } from "mongodb";
import { wishlistCreateSchema, wishlistSchema, type Wishlist } from "../../domain/wishlist/wishlist.schema.ts";
import { getMongoDb } from "../db/mongodb.ts";
import { conflictError, notFoundError } from "../../lib/errors/aura-error.ts";
import type { WishlistMutationOptions, WishlistRepository } from "./wishlist-repository.ts";
type Doc = Omit<Wishlist, "id"> & { _id: ObjectId };
const toWishlist = (doc: Doc): Wishlist => { const { _id, ...rest } = doc; return wishlistSchema.parse({ ...rest, id: _id.toHexString() }); };
const filter = (id: string, expectedVersion?: number): Filter<Doc> => ({ _id: new ObjectId(id), ...(expectedVersion === undefined ? {} : { version: expectedVersion }) });
export class MongoWishlistRepository implements WishlistRepository {
  private async collection(): Promise<Collection<Doc>> { return (await getMongoDb()).collection<Doc>("wishlists"); }
  async findGuestWishlistByTokenHash(hash: string) { const d = await (await this.collection()).findOne({ "owner.kind": "GUEST", "owner.guestTokenHash": hash }); return d ? toWishlist(d) : null; }
  async findUserWishlist(userId: string) { const d = await (await this.collection()).findOne({ "owner.kind": "USER", "owner.userId": userId }); return d ? toWishlist(d) : null; }
  async createGuestWishlist(input: { guestTokenHash: string; expiresAt: Date }) { return this.insert({ kind: "GUEST", guestTokenHash: input.guestTokenHash }, input.expiresAt); }
  async createUserWishlist(input: { userId: string }) { return this.insert({ kind: "USER", userId: input.userId }); }
  private async insert(owner: Wishlist["owner"], expiresAt?: Date) { const now = new Date(); const parsed = wishlistCreateSchema.parse({ owner, items: [], version: 0, ...(expiresAt ? { expiresAt } : {}) }); const doc: Doc = { ...parsed, _id: new ObjectId(), createdAt: now, updatedAt: now }; await (await this.collection()).insertOne(doc); return toWishlist(doc); }
  async addProduct(id: string, productId: string, options?: WishlistMutationOptions) {
    const c = await this.collection();
    const now = new Date();
    const result = await c.findOneAndUpdate(
      { ...filter(id, options?.expectedVersion), items: { $not: { $elemMatch: { productId } } } },
      [{ $set: { items: { $concatArrays: ["$items", [{ productId, addedAt: now }]], }, version: { $add: ["$version", 1] }, updatedAt: now, ...(options?.expiresAt ? { expiresAt: options.expiresAt } : {}) } }],
      { returnDocument: "after" },
    );
    if (result) return toWishlist(result);
    const existing = await c.findOne({ _id: new ObjectId(id) });
    if (existing?.items.some((item) => item.productId === productId) && options?.expectedVersion === undefined) return toWishlist(existing);
    if (existing && options?.expectedVersion !== undefined && existing.version !== options.expectedVersion) throw conflictError("Wishlist version conflict.");
    if (!existing) throw notFoundError("Wishlist");
    throw conflictError("Wishlist mutation could not be applied.");
  }
  async removeProduct(id: string, productId: string, options?: WishlistMutationOptions) { return this.mutate(id, { $pull: { items: { productId } } }, options); }
  async clear(id: string, options?: WishlistMutationOptions) { return this.mutate(id, { $set: { items: [] } }, options); }
  private async mutate(id: string, update: Record<string, unknown>, options?: WishlistMutationOptions) { const c = await this.collection(); const result = await c.findOneAndUpdate({ ...filter(id, options?.expectedVersion), items: { $exists: true } }, { ...update, $set: { ...(update.$set ?? {}), updatedAt: new Date(), ...(options?.expiresAt ? { expiresAt: options.expiresAt } : {}) }, $inc: { version: 1 } }, { returnDocument: "after" }); if (result) return toWishlist(result); const existing = await c.findOne({ _id: new ObjectId(id) }); if (existing && options?.expectedVersion !== undefined) throw conflictError("Wishlist version conflict."); if (!existing) throw notFoundError("Wishlist"); throw conflictError("Wishlist mutation could not be applied."); }
  async markExpired(id: string) { const d = await (await this.collection()).findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { expiresAt: new Date(0), updatedAt: new Date() } }, { returnDocument: "after" }); return d ? toWishlist(d) : null; }
}
