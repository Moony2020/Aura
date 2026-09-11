import type { Wishlist } from "../../domain/wishlist/wishlist.schema.ts";
export type WishlistMutationOptions = { expectedVersion?: number; expiresAt?: Date };
export interface WishlistRepository {
  findGuestWishlistByTokenHash(hash: string): Promise<Wishlist | null>;
  findUserWishlist(userId: string): Promise<Wishlist | null>;
  createGuestWishlist(input: { guestTokenHash: string; expiresAt: Date }): Promise<Wishlist>;
  createUserWishlist(input: { userId: string }): Promise<Wishlist>;
  addProduct(id: string, productId: string, options?: WishlistMutationOptions): Promise<Wishlist>;
  removeProduct(id: string, productId: string, options?: WishlistMutationOptions): Promise<Wishlist>;
  clear(id: string, options?: WishlistMutationOptions): Promise<Wishlist>;
  markExpired(id: string): Promise<Wishlist | null>;
}
