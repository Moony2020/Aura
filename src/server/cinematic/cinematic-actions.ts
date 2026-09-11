"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { serializePublicError, type PublicError } from "@/lib/errors/serialize";
import { GUEST_CART_COOKIE_NAME } from "@/server/cart/guest-cart-token";
import { createCartService, type CartViewModel } from "@/server/cart/cart-service";
import { resolveCinematicAcquireTarget } from "./cinematic-world-service";

const inputSchema = z.object({ worldNumber: z.number().int().min(1).max(6) }).strict();

export type CinematicAcquireResponse =
  | { ok: true; cart: CartViewModel }
  | { ok: false; error: PublicError };

export async function acquireCinematicWorld(input: {
  worldNumber: number;
}): Promise<CinematicAcquireResponse> {
  try {
    const parsed = inputSchema.parse(input);
    const { product, variant } = await resolveCinematicAcquireTarget(parsed.worldNumber);

    const cookieStore = await cookies();
    const result = await createCartService().addItemBySlug(
      {
        kind: "GUEST",
        guestToken: cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null,
      },
      { productSlug: product.slug, variantId: variant.id, quantity: 1 },
    );

    if (result.setCookie) cookieStore.set(result.setCookie.name, result.setCookie.value, result.setCookie.options);
    return { ok: true, cart: result.cart };
  } catch (error) {
    return { ok: false, error: serializePublicError(error) };
  }
}
