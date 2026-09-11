"use client";

import { useState, useEffect, useTransition } from "react";
import { Truck, ShieldCheck, Sparkles, Heart } from "lucide-react";
import { publishCartView, requestCartDrawerOpen } from "@/lib/cart-events";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { formatMinorUnitMoney } from "@/lib/money";
import { addCartItemAction, readCurrentCartAction, type CartActionResponse } from "@/server/cart/cart-actions";
import { saveWishlistProductAction, removeWishlistProductAction, readCurrentWishlistAction } from "@/server/wishlist/wishlist-actions";
import type { ProductDetailVariant } from "@/server/queries/get-published-product-detail";

function safeMessage(response: CartActionResponse) {
  return response.ok ? "" : response.error.message || "Your bag could not be updated right now.";
}

export function ProductVariantSelector({
  productSlug,
  variants,
  initialSaved = false,
}: {
  productSlug: string;
  variants: ProductDetailVariant[];
  initialSaved?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [discountApplied, setDiscountApplied] = useState(true);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isWishlistPending, startWishlistTransition] = useTransition();

  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0];

  useEffect(() => {
    readCurrentWishlistAction()
      .then((res) => {
        if (res.ok) {
          setIsSaved(res.wishlist.items.some((item) => item.productSlug === productSlug));
        }
      })
      .catch(() => {});

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ slug?: string; saved?: boolean }>;
      if (customEvent.detail?.slug === productSlug && typeof customEvent.detail?.saved === "boolean") {
        setIsSaved(customEvent.detail.saved);
      }
    };

    window.addEventListener("aura:wishlist-sync", handleSync);
    return () => window.removeEventListener("aura:wishlist-sync", handleSync);
  }, [productSlug]);

  const toggleWishlist = () => {
    if (isWishlistPending) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    startWishlistTransition(async () => {
      const response = nextSaved
        ? await saveWishlistProductAction({ productSlug })
        : await removeWishlistProductAction({ productSlug });

      if (response.ok) {
        window.dispatchEvent(
          new CustomEvent("aura:wishlist-sync", {
            detail: { slug: productSlug, saved: nextSaved, count: response.wishlist.itemCount },
          })
        );
      } else {
        setIsSaved(!nextSaved);
      }
    });
  };

  if (!selected) return <p className="text-sm text-[#a99e8a]">No active variants are available.</p>;

  const canAdd = selected.availability === "AVAILABLE";
  const regularPrice = formatMinorUnitMoney(selected.price);

  // Promotional discounted price calculation
  const discountMultiplier = discountApplied ? 0.75 : 1.0;
  const numericAmount = selected.price.amount / 100;
  const discountedAmount = numericAmount * discountMultiplier;
  const discountedPriceFormatted = `${discountedAmount.toFixed(2)} ${selected.price.currency === "USD" ? "$" : selected.price.currency}`;

  const addToBag = () => {
    if (!canAdd || isPending) return;
    setMessage("");
    startTransition(async () => {
      const response = await addCartItemAction({ productSlug, variantId: selected.id, quantity: 1 });
      if (response.ok) {
        publishCartView(response.cart);
        setMessage(`${selected.name} added to your bag.`);
        requestCartDrawerOpen();
        return;
      }
      if (response.error.code === ERROR_CODES.CONFLICT) {
        const refreshed = await readCurrentCartAction();
        if (refreshed.ok) publishCartView(refreshed.cart);
      }
      setMessage(safeMessage(response));
    });
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Storlek / Size Selector */}
      <fieldset className="space-y-2.5 border-0 p-0 m-0 min-w-0">
        <legend>Choose a size</legend>
        <div className="flex items-center gap-2.5 flex-wrap" role="radiogroup" aria-label="Select size">
          {variants.map((variant) => {
            const isSelected = variant.id === selected.id;
            const isAvailable = variant.availability === "AVAILABLE";

            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  if (isAvailable) {
                    setSelectedId(variant.id);
                    setMessage("");
                  }
                }}
                disabled={!isAvailable}
                className={`min-w-[75px] px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-2 border-[#c5a869] bg-[#c5a869]/15 text-[#f3ebdb] shadow-[0_0_12px_rgba(197,168,105,0.25)]"
                    : isAvailable
                    ? "border border-[#3a3528] bg-[#141217] text-[#a99e8a] hover:border-[#c5a869]/60 hover:text-[#f3ebdb]"
                    : "border border-[#3a3528]/40 bg-[#0f0d12] text-[#6b6255] line-through cursor-not-allowed"
                }`}
              >
                {variant.volumeMl ? `${variant.volumeMl} ml` : variant.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Pricing Section */}
      <div className="space-y-1 pt-1">
        {discountApplied && (
          <p className="text-xs text-[#8e8474]">
            Utan rabatt <span className="line-through">{regularPrice}</span>
          </p>
        )}
        <div className="text-2xl sm:text-3xl font-sans font-bold text-[#e5c982]">
          {discountApplied ? discountedPriceFormatted : regularPrice}
        </div>
      </div>

      {/* Promotional Discount Box */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-[#c5a869]/30 bg-[#16131a] flex items-start justify-between gap-3 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#e5c982] uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aktivera din rabatt</span>
          </div>
          <p className="text-[11px] text-[#c2b8a3] leading-relaxed">
            Just nu får du 25% rabatt på signaturdofter vid köp över $150 / 599 kr.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDiscountApplied(!discountApplied)}
          aria-label="Toggle discount"
          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
            discountApplied ? "bg-[#c5a869]" : "bg-[#3a3528]"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${
              discountApplied ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Add to Bag and Square Wishlist Button Row */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addToBag}
            disabled={!canAdd || isPending}
            className="flex-1 py-3.5 sm:py-4 rounded-xl bg-[#c5a869] hover:bg-[#d8b878] text-black font-bold text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(197,168,105,0.3)] hover:shadow-[0_6px_25px_rgba(197,168,105,0.45)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? <span>Adding to bag...</span> : <span>KÖP · ADD TO BAG</span>}
          </button>

          {/* Clean Square Wishlist Icon Button */}
          <button
            type="button"
            onClick={toggleWishlist}
            disabled={isWishlistPending}
            aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            title="Wishlist"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-[#3a3528] bg-[#141217] hover:border-[#c5a869] flex items-center justify-center text-[#c2b8a3] hover:text-[#e5c982] transition-all cursor-pointer shrink-0 shadow-md active:scale-95"
          >
            <Heart
              className={`w-5 h-5 transition-transform ${isSaved ? "fill-[#e5c982] text-[#e5c982] scale-110" : ""}`}
              strokeWidth={1.75}
            />
          </button>
        </div>

        {message && (
          <p className="text-xs text-center text-[#e5c982] pt-1" aria-live="polite">
            {message}
          </p>
        )}
      </div>

      {/* Assurances */}
      <div className="space-y-2.5 pt-3 border-t border-[#3a3528]/50 text-xs text-[#a99e8a]">
        <div className="flex items-center gap-2.5">
          <Truck className="w-4 h-4 text-[#c5a869] shrink-0" />
          <span>Fri frakt över 599 kr · Snabb leverans 1–3 arbetsdagar</span>
        </div>
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#c5a869] shrink-0" />
          <span>100% äkta vara · Säker betalning med Klarna, Swish, Visa & Mastercard</span>
        </div>
      </div>
    </div>
  );
}
