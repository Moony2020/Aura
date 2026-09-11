import type { Metadata } from "next";
import { cookies } from "next/headers";

import { CartPageClient } from "@/components/storefront/CartPageClient";
import { serializePublicError } from "@/lib/errors/serialize";
import { createCartService, type CartViewModel } from "@/server/cart/cart-service";
import { GUEST_CART_COOKIE_NAME } from "@/server/cart/guest-cart-token";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Bag",
  description: "Review your current AURA shopping bag.",
  robots: {
    index: false,
    follow: false,
  },
};

const emptyCart: CartViewModel = {
  status: "ACTIVE",
  items: [],
  itemCount: 0,
  subtotal: { amount: 0, currency: "USD" },
  currency: "USD",
  checkoutEligible: false,
  version: 0,
};

export default async function CartPage() {
  try {
    const cookieStore = await cookies();
    const cart = await createCartService().readCurrentCart({
      kind: "GUEST",
      guestToken: cookieStore.get(GUEST_CART_COOKIE_NAME)?.value ?? null,
    });

    return <CartPageClient initialCart={cart} />;
  } catch (error) {
    return <CartPageClient initialCart={emptyCart} initialError={serializePublicError(error)} />;
  }
}
