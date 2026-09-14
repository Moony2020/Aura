import "server-only";
import { createHash, randomBytes } from "node:crypto";

export const GUEST_WISHLIST_COOKIE_NAME = "aura_guest_wishlist";
export const GUEST_WISHLIST_TTL_DAYS = 30;
const pattern = /^[A-Za-z0-9_-]{43}$/;
export type GuestWishlistCookieDescriptor = { name: typeof GUEST_WISHLIST_COOKIE_NAME; value: string; options: { httpOnly: true; sameSite: "lax"; path: "/"; secure: boolean; expires: Date } };
export const generateGuestWishlistToken = () => randomBytes(32).toString("base64url");
export const isPlausibleGuestWishlistToken = (value: string | null | undefined): value is string => typeof value === "string" && pattern.test(value);
export const hashGuestWishlistToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const guestWishlistExpiresAt = (now = new Date()) => new Date(now.getTime() + GUEST_WISHLIST_TTL_DAYS * 86400000);
export const buildGuestWishlistCookie = (token: string, expires: Date): GuestWishlistCookieDescriptor => ({ name: GUEST_WISHLIST_COOKIE_NAME, value: token, options: { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", expires } });
export const buildExpiredGuestWishlistCookie = (): GuestWishlistCookieDescriptor => buildGuestWishlistCookie("", new Date(0));
