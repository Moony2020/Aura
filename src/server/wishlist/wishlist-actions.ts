"use server";
import { cookies } from "next/headers";
import { z } from "zod";
import { serializePublicError, type PublicError } from "../../lib/errors/serialize.ts";
import { createWishlistService, type WishlistViewModel } from "./wishlist-service.ts";
import { GUEST_WISHLIST_COOKIE_NAME, type GuestWishlistCookieDescriptor } from "./guest-wishlist-token.ts";

const input = z.object({ productSlug: z.string().trim().toLowerCase(), expectedVersion: z.number().int().nonnegative().optional() }).strict();
export type WishlistActionResponse = { ok: true; wishlist: WishlistViewModel } | { ok: false; error: PublicError };
async function context() { const store = await cookies(); return { kind: "GUEST" as const, guestToken: store.get(GUEST_WISHLIST_COOKIE_NAME)?.value ?? null }; }
async function setCookie(cookie?: GuestWishlistCookieDescriptor) { if (cookie) (await cookies()).set(cookie.name, cookie.value, cookie.options); }
export async function readCurrentWishlistAction(): Promise<WishlistActionResponse> { try { return { ok: true, wishlist: await createWishlistService().readCurrentWishlist(await context()) }; } catch (e) { return { ok: false, error: serializePublicError(e) }; } }
export async function saveWishlistProductAction(value: { productSlug: string; expectedVersion?: number }): Promise<WishlistActionResponse> { try { const parsed = input.parse(value); const result = await createWishlistService().saveProduct(await context(), parsed.productSlug, parsed.expectedVersion); await setCookie(result.setCookie); return { ok: true, wishlist: result.wishlist }; } catch (e) { return { ok: false, error: serializePublicError(e) }; } }
export async function removeWishlistProductAction(value: { productSlug: string; expectedVersion?: number }): Promise<WishlistActionResponse> { try { const parsed = input.parse(value); const result = await createWishlistService().removeProduct(await context(), parsed.productSlug, parsed.expectedVersion); await setCookie(result.setCookie); return { ok: true, wishlist: result.wishlist }; } catch (e) { return { ok: false, error: serializePublicError(e) }; } }
export async function clearWishlistAction(expectedVersion?: number): Promise<WishlistActionResponse> { try { const result = await createWishlistService().clear(await context(), expectedVersion); await setCookie(result.setCookie); return { ok: true, wishlist: result.wishlist }; } catch (e) { return { ok: false, error: serializePublicError(e) }; } }
