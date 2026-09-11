import "server-only";
import { z } from "zod";
import type { Product } from "../../domain/product/product.schema.ts";
import type { Wishlist } from "../../domain/wishlist/wishlist.schema.ts";
import { AuraError, notFoundError, validationError } from "../../lib/errors/aura-error.ts";
import { ERROR_CODES } from "../../lib/errors/error-codes.ts";
import type { ProductRepository } from "../repositories/product-repository.ts";
import { MongoProductRepository } from "../repositories/mongo-product-repository.ts";
import type { WishlistRepository } from "../repositories/wishlist-repository.ts";
import { MongoWishlistRepository } from "../repositories/mongo-wishlist-repository.ts";
import { buildGuestWishlistCookie, generateGuestWishlistToken, guestWishlistExpiresAt, hashGuestWishlistToken, isPlausibleGuestWishlistToken, type GuestWishlistCookieDescriptor } from "./guest-wishlist-token.ts";

export type WishlistOwnershipContext = { kind: "GUEST"; guestToken?: string | null } | { kind: "USER"; userId: string };
export type WishlistViewItem = { productSlug: string | null; productName: string; media: { url: string; alt: string } | null; audience: Product["audience"] | null; family: null; currentPrice: { amount: number; currency: string } | null; availability: "AVAILABLE" | "UNAVAILABLE"; savedAt: string };
export type WishlistViewModel = { items: WishlistViewItem[]; itemCount: number; version: number };
export type WishlistMutationResult = { wishlist: WishlistViewModel; setCookie?: GuestWishlistCookieDescriptor };
type Deps = { wishlistRepository?: WishlistRepository; productRepository?: ProductRepository };
const slugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160);

export class WishlistService {
  private readonly wishlists: WishlistRepository;
  private readonly products: ProductRepository;
  constructor(deps: Deps = {}) { this.wishlists = deps.wishlistRepository ?? new MongoWishlistRepository(); this.products = deps.productRepository ?? new MongoProductRepository(); }
  async readCurrentWishlist(context: WishlistOwnershipContext) { const owner = await this.existing(context); return this.toView(owner.wishlist); }
  async isProductSaved(context: WishlistOwnershipContext, slug: string) { const product = await this.products.findBySlug(slugSchema.parse(slug)); if (!product) return false; const owner = await this.existing(context); return !!owner?.wishlist?.items.some((item) => item.productId === product.id); }
  async saveProduct(context: WishlistOwnershipContext, productSlug: string, expectedVersion?: number): Promise<WishlistMutationResult> {
    const slug = slugSchema.parse(productSlug); const product = await this.products.findBySlug(slug); if (!product || product.status !== "PUBLISHED") throw notFoundError("Product");
    const owner = await this.forMutation(context); const expiresAt = context.kind === "GUEST" ? guestWishlistExpiresAt() : undefined;
    const wishlist = owner.wishlist ?? await this.create(context, owner); const alreadySaved = wishlist.items.some((item) => item.productId === product.id);
    const mutated = alreadySaved ? wishlist : await this.wishlists.addProduct(wishlist.id, product.id, { expectedVersion: expectedVersion ?? wishlist.version, ...(expiresAt ? { expiresAt } : {}) });
    return { wishlist: await this.toView(mutated), setCookie: owner.cookie };
  }
  async removeProduct(context: WishlistOwnershipContext, productSlug: string, expectedVersion?: number): Promise<WishlistMutationResult> { const product = await this.products.findBySlug(slugSchema.parse(productSlug)); if (!product) throw notFoundError("Product"); const owner = await this.existing(context); if (!owner?.wishlist) throw notFoundError("Wishlist"); const expiresAt = context.kind === "GUEST" ? guestWishlistExpiresAt() : undefined; const mutated = await this.wishlists.removeProduct(owner.wishlist.id, product.id, { expectedVersion, ...(expiresAt ? { expiresAt } : {}) }); return { wishlist: await this.toView(mutated), setCookie: owner.token && expiresAt ? buildGuestWishlistCookie(owner.token, expiresAt) : undefined }; }
  async clear(context: WishlistOwnershipContext, expectedVersion?: number): Promise<WishlistMutationResult> { const owner = await this.existing(context); if (!owner?.wishlist) return { wishlist: emptyWishlist() }; const expiresAt = context.kind === "GUEST" ? guestWishlistExpiresAt() : undefined; const mutated = await this.wishlists.clear(owner.wishlist.id, { expectedVersion, ...(expiresAt ? { expiresAt } : {}) }); return { wishlist: await this.toView(mutated), setCookie: owner.token && expiresAt ? buildGuestWishlistCookie(owner.token, expiresAt) : undefined }; }
  private async existing(context: WishlistOwnershipContext): Promise<{ wishlist: Wishlist | null; token?: string; cookie?: GuestWishlistCookieDescriptor }> { if (context.kind === "USER") return { wishlist: await this.wishlists.findUserWishlist(context.userId) }; if (!isPlausibleGuestWishlistToken(context.guestToken)) return { wishlist: null }; const token = context.guestToken; const wishlist = await this.wishlists.findGuestWishlistByTokenHash(hashGuestWishlistToken(token)); if (!wishlist) return { wishlist: null }; if (wishlist.expiresAt && wishlist.expiresAt <= new Date()) { await this.wishlists.markExpired(wishlist.id); return { wishlist: null }; } return { wishlist, token }; }
  private async forMutation(context: WishlistOwnershipContext) { const current = await this.existing(context); if (current.wishlist || context.kind === "USER") return current; const token = generateGuestWishlistToken(); const expiresAt = guestWishlistExpiresAt(); return { wishlist: null, token, cookie: buildGuestWishlistCookie(token, expiresAt) }; }
  private async create(context: WishlistOwnershipContext, owner: { token?: string; cookie?: GuestWishlistCookieDescriptor }) { if (context.kind === "USER") return this.wishlists.createUserWishlist({ userId: context.userId }); if (!owner.token || !owner.cookie) throw new AuraError(ERROR_CODES.INTERNAL_ERROR, "Wishlist ownership could not be created."); return this.wishlists.createGuestWishlist({ guestTokenHash: hashGuestWishlistToken(owner.token), expiresAt: owner.cookie.options.expires }); }
  private async toView(wishlist: Wishlist | null): Promise<WishlistViewModel> {
    if (!wishlist) return emptyWishlist();
    const products = new Map((await this.products.findByIds(wishlist.items.map((item) => item.productId))).map((product) => [product.id, product]));
    return {
      items: wishlist.items.map((item) => {
        const product = products.get(item.productId);
        if (!product) return { productSlug: null, productName: "Unavailable fragrance", media: null, audience: null, family: null, currentPrice: null, availability: "UNAVAILABLE", savedAt: item.addedAt.toISOString() };
        const active = product.variants.filter((variant) => variant.isActive).sort((a, b) => a.price.amount - b.price.amount)[0];
        const media = product.media.find((entry) => entry.id === product.primaryMediaId) ?? product.media[0];
        const mediaUrl = media ? (
          (media.kind === "VIDEO" || media.url.includes("/video/upload/") || media.url.match(/\.(mp4|mov|webm)(\?.*)?$/i))
            ? media.url.replace("/video/upload/", "/video/upload/so_0/").replace(/\.(mp4|mov|webm)(\?.*)?$/i, ".jpg$2")
            : media.url
        ) : null;
        return {
          productSlug: product.status === "PUBLISHED" ? product.slug : null,
          productName: product.name,
          media: media && mediaUrl ? { url: mediaUrl, alt: media.alt } : null,
          audience: product.audience ?? null,
          family: null,
          currentPrice: active?.price ?? null,
          availability: product.status === "PUBLISHED" ? "AVAILABLE" : "UNAVAILABLE",
          savedAt: item.addedAt.toISOString(),
        };
      }),
      itemCount: wishlist.items.length,
      version: wishlist.version,
    };
  }
}
export const createWishlistService = (deps?: Deps) => new WishlistService(deps);
export const emptyWishlist = (): WishlistViewModel => ({ items: [], itemCount: 0, version: 0 });
export function toWishlistError(error: unknown): AuraError { if (error instanceof z.ZodError) return validationError("Wishlist input validation failed."); if (error instanceof AuraError) return error; return new AuraError(ERROR_CODES.INTERNAL_ERROR, "Unexpected wishlist service failure.", { cause: error }); }
