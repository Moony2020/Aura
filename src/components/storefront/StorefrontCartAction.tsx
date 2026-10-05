"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { formatMinorUnitMoney } from "@/lib/money";
import {
  clearCartAction,
  readCurrentCartAction,
  removeCartItemAction,
  updateCartItemQuantityAction,
  type CartActionResponse,
} from "@/server/cart/cart-actions";
import type { CartViewItem, CartViewModel } from "@/server/cart/cart-service";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { publishCartView, subscribeCartDrawerOpen, subscribeCartView } from "@/lib/cart-events";

const emptyCart: CartViewModel = {
  status: "ACTIVE",
  items: [],
  itemCount: 0,
  subtotal: { amount: 0, currency: "USD" },
  currency: "USD",
  checkoutEligible: false,
  version: 0,
};

const concentrationLabels: Record<string, string> = {
  EAU_DE_TOILETTE: "Eau de Toilette",
  EAU_DE_PARFUM: "Eau de Parfum",
  EAU_DE_PARFUM_INTENSE: "Eau de Parfum Intense",
  EXTRAIT_DE_PARFUM: "Extrait de Parfum",
  PARFUM: "Parfum",
};

function formatConcentration(value: string | null) {
  if (!value) return "Fragrance";
  return concentrationLabels[value] ?? value.replaceAll("_", " ").toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase());
}

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
}

function safeMessage(response: CartActionResponse) {
  return response.ok ? "" : response.error.message || "Your bag could not be updated right now.";
}

function isConflictResponse(response: CartActionResponse) {
  return !response.ok && response.error.code === ERROR_CODES.CONFLICT;
}

export function StorefrontCartAction() {
  const titleId = useId();
  const descriptionId = useId();
  const drawerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasLoadedInitialRef = useRef(false);
  const [cart, setCart] = useState<CartViewModel>(emptyCart);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [pendingLineId, setPendingLineId] = useState<string | null>(null);
  const [pendingQuantityLineId, setPendingQuantityLineId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshCart = useCallback((reason?: string, forceLoading = false) => {
    if (forceLoading || !hasLoadedInitialRef.current) {
      setStatus("loading");
    }
    setMessage(reason ?? "");
    startTransition(async () => {
      const response = await readCurrentCartAction();
      hasLoadedInitialRef.current = true;
      if (response.ok) {
        setCart(response.cart);
        setStatus("ready");
        return;
      }
      setStatus("error");
      setMessage(safeMessage(response));
    });
  }, []);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
    refreshCart();
  }, [refreshCart]);

  const closeDrawer = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    setMounted(true);
    readCurrentCartAction()
      .then((response) => {
        if (response.ok) {
          setCart(response.cart);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => subscribeCartView(setCart), []);

  useEffect(() => subscribeCartDrawerOpen(openDrawer), [openDrawer]);

  useEffect(() => {
    if (!isOpen) return;
    const trigger = triggerRef.current;
    const previousScrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => closeRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
      }
      if (event.key !== "Tab") return;
      const elements = focusableElements(drawerRef.current);
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.scrollTo(0, previousScrollY);
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [isOpen]);

  const removeLine = (lineId: string) => {
    setPendingLineId(lineId);
    setMessage("");
    startTransition(async () => {
      const response = await removeCartItemAction({ lineId, expectedVersion: cart.version });
      setPendingLineId(null);
      if (response.ok) {
        setCart(response.cart);
        publishCartView(response.cart);
        setStatus("ready");
        return;
      }
      if (isConflictResponse(response)) {
        refreshCart("Your bag changed in another tab, so we refreshed it.");
        return;
      }
      setMessage(safeMessage(response));
      setStatus("error");
    });
  };

  const clearBag = () => {
    setMessage("");
    startTransition(async () => {
      const response = await clearCartAction({ expectedVersion: cart.version });
      if (response.ok) {
        setCart(response.cart);
        publishCartView(response.cart);
        setStatus("ready");
        return;
      }
      if (isConflictResponse(response)) {
        refreshCart("Your bag changed in another tab, so we refreshed it.");
        return;
      }
      setMessage(safeMessage(response));
      setStatus("error");
    });
  };

  const updateQuantity = (item: CartViewItem, quantity: number) => {
    setPendingQuantityLineId(item.lineId);
    setMessage("");
    startTransition(async () => {
      const response = await updateCartItemQuantityAction({ lineId: item.lineId, quantity, expectedVersion: cart.version });
      setPendingQuantityLineId(null);
      if (response.ok) {
        setCart(response.cart);
        publishCartView(response.cart);
        setMessage(quantity === 0 ? "Item removed from your bag." : `${item.productName} quantity updated.`);
        setStatus("ready");
        return;
      }
      if (isConflictResponse(response)) {
        refreshCart("Your bag changed in another tab, so we refreshed it.");
        return;
      }
      setMessage(safeMessage(response));
      setStatus("error");
    });
  };

  const hasItems = cart.items.length > 0;

  return (
    <>
      <button
        type="button"
        className="relative p-2 text-[#c2b8a3] hover:text-[#e5c982] transition-colors flex items-center justify-center cursor-pointer"
        aria-label="Open shopping bag"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={drawerId}
        onClick={openDrawer}
        ref={triggerRef}
      >
        <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d8b93f] text-[#17130d] font-bold text-[10px] flex items-center justify-center leading-none shadow-[0_2px_5px_rgba(0,0,0,0.6)]"
          aria-label={`${cart.itemCount} items in bag`}
        >
          {cart.itemCount}
        </span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="storefront-cart-layer" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} id={drawerId} ref={drawerRef}>
          <button type="button" className="storefront-cart-layer__backdrop" aria-label="Close shopping bag" onClick={closeDrawer} />
          <aside className="storefront-cart-drawer">
            <div className="storefront-cart-drawer__header">
              <div>
                <p id={descriptionId}>AURA shopping bag</p>
                <h2 id={titleId}>Your Bag</h2>
              </div>
              <button type="button" className="storefront-cart-drawer__close" onClick={closeDrawer} aria-label="Close shopping bag" ref={closeRef}>
                <X aria-hidden="true" />
              </button>
            </div>

            <div className="storefront-cart-drawer__status" aria-live="polite">
              {message}
            </div>

            {status === "error" && !hasItems && (
              <div className="storefront-cart-state">
                <p>We could not load your bag right now.</p>
                <button type="button" onClick={() => refreshCart(undefined, true)} disabled={isPending}>Try again</button>
              </div>
            )}

            {!hasItems && (
              <div className="storefront-cart-state">
                <p>Your bag is currently empty.</p>
                <Link href="/fragrances" onClick={closeDrawer}>Explore Fragrances <span aria-hidden="true">→</span></Link>
              </div>
            )}

            {hasItems && (
              <>
                <ul className="storefront-cart-lines" aria-label="Shopping bag items">
                  {cart.items.map((item) => (
                    <li className={`storefront-cart-line storefront-cart-line--${item.availability.toLowerCase().replaceAll("_", "-")}`} key={item.lineId}>
                      <div className="storefront-cart-line__media">
                        <div className="storefront-cart-line__thumb">
                          {item.media ? (
                            <Image src={item.media.url} alt={item.media.alt} fill sizes="72px" unoptimized />
                          ) : (
                            <span aria-hidden="true">A</span>
                          )}
                        </div>
                      </div>
                      <div className="storefront-cart-line__body">
                        <span className="storefront-cart-line__audience">{item.audience ?? "FRAGRANCE"}</span>
                        {item.productSlug ? (
                          <Link href={`/product/${item.productSlug}`} onClick={closeDrawer}>{item.productName}</Link>
                        ) : (
                          <strong>{item.productName}</strong>
                        )}
                        <span>{[formatConcentration(item.concentration), item.variantLabel].filter(Boolean).join(" · ")}</span>
                        <div className="cart-quantity-stepper" aria-label={`${item.productName} quantity controls`}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, Math.max(0, item.quantity - 1))}
                            disabled={!item.canDecrement || pendingQuantityLineId === item.lineId || isPending}
                            aria-label={`Decrease ${item.productName} quantity`}
                          >
                            <span aria-hidden="true">−</span>
                          </button>
                          <span aria-live="polite" aria-label={`${item.productName} quantity ${item.quantity}`}>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, item.quantity + 1)}
                            disabled={!item.canIncrement || pendingQuantityLineId === item.lineId || isPending}
                            aria-label={`Increase ${item.productName} quantity`}
                          >
                            <span aria-hidden="true">+</span>
                          </button>
                        </div>
                      </div>
                      <div className="storefront-cart-line__price">
                        <strong>{item.lineTotal ? formatMinorUnitMoney(item.lineTotal) : "—"}</strong>
                        <button
                          type="button"
                          className="storefront-cart-line__remove"
                          onClick={() => removeLine(item.lineId)}
                          disabled={pendingLineId === item.lineId || isPending}
                          aria-label={`Remove ${item.productName} from bag`}
                          title="Remove from bag"
                        >
                          <X aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="storefront-cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatMinorUnitMoney(cart.subtotal)}</strong>
                  </div>
                  <p>{cart.checkoutEligible ? "Ready for checkout." : "Review your bag before checkout."}</p>
                  <div className="storefront-cart-summary__actions">
                    <Link href="/cart" onClick={closeDrawer}>View Bag</Link>
                    <button className="storefront-cart-summary__clear" type="button" onClick={clearBag} disabled={isPending}>Clear Bag</button>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}
