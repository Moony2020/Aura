"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { formatMinorUnitMoney } from "@/lib/money";
import { saveWishlistProductAction, removeWishlistProductAction, readCurrentWishlistAction } from "@/server/wishlist/wishlist-actions";
import { addCartItemAction } from "@/server/cart/cart-actions";
import { publishCartView, requestCartDrawerOpen } from "@/lib/cart-events";
import type { FragranceCatalogItem } from "@/server/queries/list-published-fragrances";

const concentrationLabels: Record<string, string> = {
  EAU_DE_TOILETTE: "Eau de Toilette",
  EAU_DE_PARFUM: "Eau de Parfum",
  EAU_DE_PARFUM_INTENSE: "Eau de Parfum Intense",
  EXTRAIT_DE_PARFUM: "Extrait de Parfum",
  PARFUM: "Parfum",
};

export function FragranceCard({
  product,
  badge,
  discountPercentage,
  originalPrice,
}: {
  product: FragranceCatalogItem;
  badge?: "BESTSELLER" | "NEW" | "EXCLUSIVE" | string;
  discountPercentage?: number;
  originalPrice?: string;
}) {
  const [isSaved, setIsSaved] = useState(false);
  const [isWishlistPending, startWishlistTransition] = useTransition();
  const [isCartPending, startCartTransition] = useTransition();

  const availableVariants = product.variants;
  const [selectedVariantId, setSelectedVariantId] = useState(availableVariants[0]?.id ?? "");
  const selectedVariant = availableVariants.find((variant) => variant.id === selectedVariantId) ?? availableVariants[0];

  const imageUrl = product.media?.posterUrl ?? product.media?.url ?? "/assets/prod-bleu-chanel.jpg";

  useEffect(() => {
    readCurrentWishlistAction()
      .then((res) => {
        if (res.ok) {
          setIsSaved(res.wishlist.items.some((item) => item.productSlug === product.slug));
        }
      })
      .catch(() => {});

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ slug?: string; saved?: boolean }>;
      if (customEvent.detail?.slug === product.slug && typeof customEvent.detail?.saved === "boolean") {
        setIsSaved(customEvent.detail.saved);
      }
    };

    window.addEventListener("aura:wishlist-sync", handleSync);
    return () => window.removeEventListener("aura:wishlist-sync", handleSync);
  }, [product.slug]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlistPending) return;

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    startWishlistTransition(async () => {
      const response = nextSaved
        ? await saveWishlistProductAction({ productSlug: product.slug })
        : await removeWishlistProductAction({ productSlug: product.slug });

      if (response.ok) {
        const count = response.wishlist.itemCount;
        window.dispatchEvent(
          new CustomEvent("aura:wishlist-sync", {
            detail: { slug: product.slug, saved: nextSaved, count },
          })
        );
      } else {
        setIsSaved(!nextSaved);
      }
    });
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCartPending) return;

    if (!selectedVariant || selectedVariant.availability === "OUT_OF_STOCK") return;

    startCartTransition(async () => {
      const response = await addCartItemAction({
        productSlug: product.slug,
        variantId: selectedVariant.id,
        quantity: 1,
      });

      if (response.ok) {
        publishCartView(response.cart);
        requestCartDrawerOpen();
      } else {
        requestCartDrawerOpen();
      }
    });
  };

  const concentrationText = concentrationLabels[product.concentration] ?? product.concentration ?? "Eau de Parfum";
  const formattedPrice = formatMinorUnitMoney(product.price);
  const displayBadge = badge ?? (discountPercentage ? `-${discountPercentage}%` : undefined);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#3a3528]/50 bg-[#110f14]/80 transition-all duration-300 hover:border-[#c5a869]/70 hover:shadow-[0_12px_30px_rgba(0,0,0,0.7)]">
      {/* Media & Badges Container */}
      <div className="relative aspect-[4/3.25] w-full overflow-hidden bg-[#0a080c]">
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="pointer-events-none scale-110 object-cover opacity-35 blur-xl"
          aria-hidden="true"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/25" aria-hidden="true" />
        {/* Top-Left Badges */}
        {displayBadge && (
          <div className="absolute top-2.5 left-2.5 z-10">
            {discountPercentage ? (
              <span className="px-2 py-0.5 rounded-md bg-[#e53935] text-white font-bold text-[10px] tracking-wider uppercase shadow-md">
                -{discountPercentage}%
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-[#c5a869]/90 text-black font-bold text-[9.5px] tracking-wider uppercase shadow-md">
                {displayBadge}
              </span>
            )}
          </div>
        )}

        {/* Top-Right Wishlist Heart Button */}
        <button
          type="button"
          onClick={toggleWishlist}
          disabled={isWishlistPending}
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-1 right-2 z-10 grid h-11 w-11 cursor-pointer place-items-center !rounded-none !border-0 !bg-transparent !shadow-none text-[#c2b8a3] transition-colors hover:!bg-transparent hover:text-[#e5c982]"
        >
          <Heart
            className={`h-6 w-6 transition-transform ${isSaved ? "fill-[#e5c982] text-[#e5c982] scale-110" : ""}`}
            strokeWidth={1.75}
          />
        </button>

        {/* Product Image Link */}
        <Link href={`/product/${product.slug}`} className="relative z-[1] block h-full w-full">
          <Image
            src={imageUrl}
            alt={product.media?.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
        </Link>

        {/* Floating Quick-Add Shopping Bag Button */}
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={isCartPending}
          aria-label={`Quick add ${product.name} to bag`}
          title="Add to bag"
          className="absolute bottom-3 right-3 z-10 grid h-10 w-10 cursor-pointer place-items-center rounded-md border border-[#c5a869]/75 bg-[#110f14]/70 text-[#e5c982] shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-colors hover:bg-[#c5a869] hover:text-[#17130d] active:scale-95"
        >
          <ShoppingBag className="h-5 w-5" strokeWidth={1.65} />
        </button>
      </div>

      {/* Card Body Details */}
      <div className="flex flex-1 flex-col justify-between space-y-2.5 px-3 pb-3 pt-3.5 sm:px-4 sm:pb-4">
        <div className="space-y-1">
          {/* Brand */}
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#a99e8a] font-semibold line-clamp-1">
            {product.brand ?? "AURA FRAGRANCE"}
          </p>

          {/* Product Title */}
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="font-serif text-sm sm:text-base font-medium text-[#f3ebdb] group-hover:text-[#e5c982] transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Concentration & Volume Subtitle */}
          <p className="text-[11px] text-[#8e8474] line-clamp-1">
            {concentrationText} · {selectedVariant ? `${selectedVariant.volumeMl} ml` : "Size unavailable"}
          </p>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-[#e5c982]">★★★★★</span>
          <span className="text-[#8e8474] text-[10px]">(81)</span>
        </div>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="font-sans text-sm sm:text-base font-bold text-[#f3ebdb]">
            {formattedPrice}
          </span>
          {originalPrice && (
            <span className="text-xs text-[#8e8474] line-through font-normal">
              {originalPrice}
            </span>
          )}
        </div>

        {/* Size Selection Pills Row */}
        <div className="flex items-center gap-1.5 pt-1.5 flex-wrap" role="group" aria-label="Available sizes">
          {availableVariants.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id;
            const isOutOfStock = variant.availability === "OUT_OF_STOCK";
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantId(variant.id)}
                disabled={isOutOfStock}
                aria-pressed={isSelected}
                className={`px-2.5 py-1 rounded-md text-[10.5px] tracking-wide transition-all duration-200 ${
                  isSelected
                    ? "bg-[#c5a869] text-black font-bold shadow-[0_2px_8px_rgba(197,168,105,0.4)]"
                    : "bg-[#18151c] border border-[#3a3528]/80 text-[#a99e8a] hover:border-[#c5a869]/60 hover:text-[#f3ebdb]"
                } ${isOutOfStock ? "cursor-not-allowed opacity-45 line-through" : "cursor-pointer"}`}
                title={isOutOfStock ? "Out of stock" : undefined}
              >
                {variant.volumeMl} ml
              </button>
            );
          })}
          {!availableVariants.length && (
            <span className="text-[10.5px] text-[#8e8474]">Size unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
}
