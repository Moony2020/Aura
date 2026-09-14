import "server-only";

import { cookies } from "next/headers";

import { safeErrorLog } from "@/lib/errors/log";
import { getCurrentSessionAuthority } from "@/server/auth/current-session";
import { buildExpiredGuestCartCookie, GUEST_CART_COOKIE_NAME } from "@/server/cart/guest-cart-token";
import { mergeGuestCartForAuthority, mergeGuestWishlistForAuthority } from "@/server/commerce/guest-merge-service";
import { buildExpiredGuestWishlistCookie, GUEST_WISHLIST_COOKIE_NAME } from "@/server/wishlist/guest-wishlist-token";
import type { SessionAuthority } from "@/server/auth/session-authority";

type MergeResult = { status: "MERGED" | "NOOP"; importedCount: number };
type CookieStore = { get(name: string): { value: string } | undefined; set(name: string, value: string, options: object): void };
type MergeDependencies = {
  cookieStore?: CookieStore;
  authorityLoader?: () => Promise<SessionAuthority | null>;
  cartMerge?: (authority: SessionAuthority, token: string) => Promise<MergeResult>;
  wishlistMerge?: (authority: SessionAuthority, token: string) => Promise<MergeResult>;
};

function recordMergeFailure(operation: string, error: unknown) {
  console.warn(JSON.stringify(safeErrorLog(error, operation)));
}

export async function runPostLoginGuestMerge(dependencies: MergeDependencies = {}): Promise<void> {
  const cookieStore = dependencies.cookieStore ?? await cookies();
  const authorityLoader = dependencies.authorityLoader ?? getCurrentSessionAuthority;
  const cartMerge = dependencies.cartMerge ?? mergeGuestCartForAuthority;
  const wishlistMerge = dependencies.wishlistMerge ?? mergeGuestWishlistForAuthority;
  const cartToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;
  const wishlistToken = cookieStore.get(GUEST_WISHLIST_COOKIE_NAME)?.value;
  if (!cartToken && !wishlistToken) return;

  const authority = await authorityLoader();
  if (!authority) return;

  if (cartToken) {
    try {
      const result = await cartMerge(authority, cartToken);
      if (result.status === "MERGED") {
        const expired = buildExpiredGuestCartCookie();
        cookieStore.set(expired.name, expired.value, expired.options);
      }
    } catch (error) {
      recordMergeFailure("post-login-cart-merge", error);
    }
  }

  if (wishlistToken) {
    try {
      const result = await wishlistMerge(authority, wishlistToken);
      if (result.status === "MERGED") {
        const expired = buildExpiredGuestWishlistCookie();
        cookieStore.set(expired.name, expired.value, expired.options);
      }
    } catch (error) {
      recordMergeFailure("post-login-wishlist-merge", error);
    }
  }
}
