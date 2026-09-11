import type { CartViewModel } from "../server/cart/cart-service.ts";

export const CART_VIEW_UPDATED_EVENT = "aura:cart-view-updated";
export const CART_DRAWER_OPEN_REQUESTED_EVENT = "aura:cart-drawer-open-requested";

export function publishCartView(cart: CartViewModel) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CartViewModel>(CART_VIEW_UPDATED_EVENT, { detail: cart }));
}

export function subscribeCartView(listener: (cart: CartViewModel) => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    listener((event as CustomEvent<CartViewModel>).detail);
  };
  window.addEventListener(CART_VIEW_UPDATED_EVENT, handler);
  return () => window.removeEventListener(CART_VIEW_UPDATED_EVENT, handler);
}

export function requestCartDrawerOpen() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_DRAWER_OPEN_REQUESTED_EVENT));
}

export function subscribeCartDrawerOpen(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CART_DRAWER_OPEN_REQUESTED_EVENT, listener);
  return () => window.removeEventListener(CART_DRAWER_OPEN_REQUESTED_EVENT, listener);
}
