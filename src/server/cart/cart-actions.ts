"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { serializePublicError, type PublicError } from "../../lib/errors/serialize.ts";
import {
  createCartService,
  parseCartLineId,
  type CartViewModel,
} from "./cart-service.ts";
import { GUEST_CART_COOKIE_NAME, type GuestCartCookieDescriptor } from "./guest-cart-token.ts";

const addCartItemActionSchema = z
  .object({
    productSlug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
    variantId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })
  .strict();

const lineMutationActionSchema = z
  .object({
    lineId: z.string().trim().min(1),
    expectedVersion: z.number().int().nonnegative().optional(),
  })
  .strict();

const updateCartItemQuantityActionSchema = lineMutationActionSchema.extend({
  quantity: z.number().int().nonnegative(),
});

const clearCartActionSchema = z
  .object({
    expectedVersion: z.number().int().nonnegative().optional(),
  })
  .strict()
  .optional();

export type CartActionResponse =
  | { ok: true; cart: CartViewModel }
  | { ok: false; error: PublicError };

async function guestContext() {
  const cookieStore = await cookies();
  return {
    kind: "GUEST" as const,
    guestToken: cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null,
  };
}

async function applySetCookie(cookie: GuestCartCookieDescriptor | undefined) {
  if (!cookie) return;
  const cookieStore = await cookies();
  cookieStore.set(cookie.name, cookie.value, cookie.options);
}

function safeError(error: unknown): CartActionResponse {
  return { ok: false, error: serializePublicError(error) };
}

export async function readCurrentCartAction(): Promise<CartActionResponse> {
  try {
    const cart = await createCartService().readCurrentCart(await guestContext());
    return { ok: true, cart };
  } catch (error) {
    return safeError(error);
  }
}

export async function addCartItemAction(input: {
  productSlug: string;
  variantId: string;
  quantity: number;
}): Promise<CartActionResponse> {
  try {
    const parsed = addCartItemActionSchema.parse(input);
    const result = await createCartService().addItemBySlug(await guestContext(), {
      productSlug: parsed.productSlug,
      variantId: parsed.variantId,
      quantity: parsed.quantity,
    });
    await applySetCookie(result.setCookie);
    return { ok: true, cart: result.cart };
  } catch (error) {
    return safeError(error);
  }
}

export async function updateCartItemQuantityAction(input: {
  lineId: string;
  quantity: number;
  expectedVersion?: number;
}): Promise<CartActionResponse> {
  try {
    const parsed = updateCartItemQuantityActionSchema.parse(input);
    const line = parseCartLineId(parsed.lineId);
    const result = await createCartService().updateItemQuantity(await guestContext(), {
      ...line,
      quantity: parsed.quantity,
      expectedVersion: parsed.expectedVersion,
    });
    await applySetCookie(result.setCookie);
    return { ok: true, cart: result.cart };
  } catch (error) {
    return safeError(error);
  }
}

export async function removeCartItemAction(input: {
  lineId: string;
  expectedVersion?: number;
}): Promise<CartActionResponse> {
  try {
    const parsed = lineMutationActionSchema.parse(input);
    const line = parseCartLineId(parsed.lineId);
    const result = await createCartService().removeItem(await guestContext(), {
      ...line,
      expectedVersion: parsed.expectedVersion,
    });
    await applySetCookie(result.setCookie);
    return { ok: true, cart: result.cart };
  } catch (error) {
    return safeError(error);
  }
}

export async function clearCartAction(input?: {
  expectedVersion?: number;
}): Promise<CartActionResponse> {
  try {
    const parsed = clearCartActionSchema.parse(input);
    const result = await createCartService().clearCart(await guestContext(), {
      expectedVersion: parsed?.expectedVersion,
    });
    await applySetCookie(result.setCookie);
    return { ok: true, cart: result.cart };
  } catch (error) {
    return safeError(error);
  }
}
