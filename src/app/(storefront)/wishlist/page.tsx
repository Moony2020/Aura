import type { Metadata } from "next";
import { cookies } from "next/headers";
import { WishlistPageClient } from "@/components/storefront/WishlistPageClient";
import { createWishlistService, emptyWishlist } from "@/server/wishlist/wishlist-service";
import { GUEST_WISHLIST_COOKIE_NAME } from "@/server/wishlist/guest-wishlist-token";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Wishlist", description: "Your saved AURA fragrances.", robots: { index: false, follow: false } };
export default async function WishlistPage() { try { const store = await cookies(); const wishlist = await createWishlistService().readCurrentWishlist({ kind: "GUEST", guestToken: store.get(GUEST_WISHLIST_COOKIE_NAME)?.value ?? null }); return <WishlistPageClient initialWishlist={wishlist} />; } catch { return <WishlistPageClient initialWishlist={emptyWishlist()} />; } }
