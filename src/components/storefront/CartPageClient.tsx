"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useState, useTransition } from "react";

import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { PublicError } from "@/lib/errors/serialize";
import { formatMinorUnitMoney } from "@/lib/money";
import { publishCartView } from "@/lib/cart-events";
import {
  clearCartAction,
  readCurrentCartAction,
  removeCartItemAction,
  updateCartItemQuantityAction,
  type CartActionResponse,
} from "@/server/cart/cart-actions";
import type { CartViewItem, CartViewModel } from "@/server/cart/cart-service";

type CartPageClientProps = {
  initialCart: CartViewModel;
  initialError?: PublicError | null;
};

function availabilityLabel(item: CartViewItem) {
  if (item.availability === "AVAILABLE" && !item.quantityValid) return "Quantity needs adjustment";
  if (item.availability === "AVAILABLE") return "Available";
  if (item.availability === "OUT_OF_STOCK") return "Out of stock";
  if (item.availability === "UNTRACKED") return "Online availability currently unavailable";
  return "Unavailable";
}

function safeMessage(response: CartActionResponse) {
  return response.ok ? "" : response.error.message || "Your bag could not be updated right now.";
}

function isConflictResponse(response: CartActionResponse) {
  return !response.ok && response.error.code === ERROR_CODES.CONFLICT;
}

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

export function CartPageClient({ initialCart, initialError = null }: CartPageClientProps) {
  const [cart, setCart] = useState(initialCart);
  const [message, setMessage] = useState(initialError?.message ?? "");
  const [status, setStatus] = useState<"ready" | "error">(initialError ? "error" : "ready");
  const [pendingLineId, setPendingLineId] = useState<string | null>(null);
  const [pendingQuantityLineId, setPendingQuantityLineId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasItems = cart.items.length > 0;

  const applyCart = (nextCart: CartViewModel, nextMessage = "") => {
    setCart(nextCart);
    setStatus("ready");
    setMessage(nextMessage);
    publishCartView(nextCart);
  };

  const refreshAfterConflict = () => {
    startTransition(async () => {
      const response = await readCurrentCartAction();
      if (response.ok) {
        applyCart(response.cart, "Your bag changed in another tab, so we refreshed it.");
        return;
      }
      setStatus("error");
      setMessage(safeMessage(response));
    });
  };

  const removeLine = (lineId: string) => {
    setPendingLineId(lineId);
    setMessage("");
    startTransition(async () => {
      const response = await removeCartItemAction({ lineId, expectedVersion: cart.version });
      setPendingLineId(null);
      if (response.ok) {
        applyCart(response.cart, "Item removed from your bag.");
        return;
      }
      if (isConflictResponse(response)) {
        refreshAfterConflict();
        return;
      }
      setStatus("error");
      setMessage(safeMessage(response));
    });
  };

  const updateQuantity = (item: CartViewItem, quantity: number) => {
    setPendingQuantityLineId(item.lineId);
    setMessage("");
    startTransition(async () => {
      const response = await updateCartItemQuantityAction({ lineId: item.lineId, quantity, expectedVersion: cart.version });
      setPendingQuantityLineId(null);
      if (response.ok) {
        applyCart(response.cart, quantity === 0 ? "Item removed from your bag." : `${item.productName} quantity updated.`);
        return;
      }
      if (isConflictResponse(response)) {
        refreshAfterConflict();
        return;
      }
      setStatus("error");
      setMessage(safeMessage(response));
    });
  };

  const clearBag = () => {
    setMessage("");
    startTransition(async () => {
      const response = await clearCartAction({ expectedVersion: cart.version });
      if (response.ok) {
        applyCart(response.cart, "Your bag has been cleared.");
        return;
      }
      if (isConflictResponse(response)) {
        refreshAfterConflict();
        return;
      }
      setStatus("error");
      setMessage(safeMessage(response));
    });
  };

  return (
    <div className="cart-page" aria-busy={isPending}>
      <section className="cart-page__hero" aria-labelledby="cart-page-title">
        <p className="fragrance-catalog-eyebrow">The Maison Bag</p>
        <h1 id="cart-page-title">Your Bag</h1>
        <p>Review the fragrances currently held in your AURA bag. Prices and availability are refreshed from the Maison before presentation.</p>
      </section>

      <div className="cart-page__status" aria-live="polite">
        {isPending ? "Updating your bag..." : message}
      </div>

      {status === "error" && !hasItems && (
        <section className="cart-page-state" aria-label="Cart error">
          <h2>We could not load your bag.</h2>
          <p>Your bag is still safe. Please try again in a moment.</p>
          <Link href="/fragrances">Explore Fragrances <span aria-hidden="true">→</span></Link>
        </section>
      )}

      {status !== "error" && !hasItems && (
        <section className="cart-page-state" aria-label="Empty cart">
          <h2>Your bag is currently empty.</h2>
          <p>Begin with the collection and choose the scent that feels most like your signature.</p>
          <Link href="/fragrances">Explore Fragrances <span aria-hidden="true">→</span></Link>
        </section>
      )}

      {hasItems && (
        <div className="cart-page__content">
          <section className="cart-page__items" aria-labelledby="cart-items-title">
            <div className="cart-page__section-heading">
              <h2 id="cart-items-title">Selected fragrances</h2>
              <span>{cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}</span>
            </div>
            <ul className="cart-page-lines" aria-label="Cart items">
              {cart.items.map((item) => (
                <li className={`cart-page-line cart-page-line--${item.availability.toLowerCase().replaceAll("_", "-")}`} key={item.lineId}>
                  <div className="cart-page-line__media">
                    {item.media ? (
                      item.productSlug ? (
                        <Link href={`/product/${item.productSlug}`} aria-label={`View ${item.productName}`}>
                          <Image src={item.media.url} alt={item.media.alt} fill sizes="(max-width: 680px) 112px, 160px" unoptimized />
                        </Link>
                      ) : (
                        <Image src={item.media.url} alt={item.media.alt} fill sizes="(max-width: 680px) 112px, 160px" unoptimized />
                      )
                    ) : (
                      <span aria-hidden="true">A</span>
                    )}
                  </div>
                  <div className="cart-page-line__details">
                    <span className="cart-page-line__audience">{item.audience ?? "FRAGRANCE"}</span>
                    {item.productSlug ? (
                      <Link href={`/product/${item.productSlug}`}>{item.productName}</Link>
                    ) : (
                      <strong>{item.productName}</strong>
                    )}
                    <span>{[formatConcentration(item.concentration), item.variantLabel].filter(Boolean).join(" · ")}</span>
                    <span className="sr-only">{availabilityLabel(item)}</span>
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
                  <div className="cart-page-line__money">
                    <strong>{item.lineTotal ? formatMinorUnitMoney(item.lineTotal) : "—"}</strong>
                    <button
                      type="button"
                      className="cart-page-line__remove"
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
          </section>

          <aside className="cart-page-summary" aria-labelledby="cart-summary-title">
            <p className="fragrance-catalog-eyebrow">Bag Summary</p>
            <h2 id="cart-summary-title">Maison summary</h2>
            <div className="cart-page-summary__row">
              <span>Items</span>
              <strong>{cart.itemCount}</strong>
            </div>
            <div className="cart-page-summary__row">
              <span>Subtotal</span>
              <strong>{formatMinorUnitMoney(cart.subtotal)}</strong>
            </div>
            <p>Tax, shipping, discounts, gift cards, and payment are introduced in later commerce stages.</p>
            {!cart.checkoutEligible && <p>Some items may need attention before checkout becomes available.</p>}
            {cart.checkoutEligible && (
              <Link href="/checkout" className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[#c5a869] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#17130d]">
                Continue to checkout
              </Link>
            )}
            <button type="button" onClick={clearBag} disabled={isPending}>Clear Bag</button>
          </aside>
        </div>
      )}
    </div>
  );
}
