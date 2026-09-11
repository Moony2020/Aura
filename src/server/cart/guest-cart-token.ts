import "server-only";

import { createHash, randomBytes } from "node:crypto";

export const GUEST_CART_COOKIE_NAME = "aura_guest_cart";
export const GUEST_CART_TTL_DAYS = 30;

const guestCartTokenPattern = /^[A-Za-z0-9_-]{43}$/;

export type GuestCartCookieDescriptor = {
  name: typeof GUEST_CART_COOKIE_NAME;
  value: string;
  options: {
    httpOnly: true;
    sameSite: "lax";
    path: "/";
    secure: boolean;
    expires: Date;
  };
};

export function generateGuestCartToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isPlausibleGuestCartToken(value: string | null | undefined): value is string {
  return typeof value === "string" && guestCartTokenPattern.test(value);
}

export function hashGuestCartToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function guestCartExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + GUEST_CART_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function buildGuestCartCookie(token: string, expiresAt: Date): GuestCartCookieDescriptor {
  return {
    name: GUEST_CART_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
    },
  };
}

export function buildExpiredGuestCartCookie(): GuestCartCookieDescriptor {
  return buildGuestCartCookie("", new Date(0));
}
