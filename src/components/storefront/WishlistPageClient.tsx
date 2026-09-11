"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { WishlistViewModel } from "@/server/wishlist/wishlist-service";
import { removeWishlistProductAction } from "@/server/wishlist/wishlist-actions";
import { formatMinorUnitMoney } from "@/lib/money";

export function WishlistPageClient({ initialWishlist }: { initialWishlist: WishlistViewModel }) {
  const [wishlist, setWishlist] = useState(initialWishlist);
  const [message, setMessage] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("aura:wishlist-sync", { detail: { count: initialWishlist.itemCount } }));
  }, [initialWishlist]);

  function remove(slug: string | null) {
    if (!slug) return;

    const previousWishlist = wishlist;
    const nextItems = wishlist.items.filter((item) => item.productSlug !== slug);
    setWishlist({
      ...wishlist,
      items: nextItems,
      itemCount: nextItems.length,
    });

    window.dispatchEvent(new CustomEvent("aura:wishlist-sync", { detail: { slug, saved: false, count: nextItems.length } }));

    startTransition(async () => {
      try {
        const response = await removeWishlistProductAction({
          productSlug: slug,
          expectedVersion: wishlist.version,
        });

        if (!response.ok) {
          setMessage(response.error.message || "Wishlist could not be updated right now.");
          setWishlist(previousWishlist);
          window.dispatchEvent(new CustomEvent("aura:wishlist-sync", { detail: { slug, saved: true, count: previousWishlist.itemCount } }));
        }
      } catch {
        setMessage("Wishlist could not be updated right now.");
        setWishlist(previousWishlist);
      }
    });
  }

  return (
    <div className="wishlist-page">
      <section className="wishlist-page__hero">
        <p className="fragrance-catalog-eyebrow">The Maison Edit</p>
        <h1>My Wishlist</h1>
        <p>Keep the fragrances that linger in your imagination close.</p>
      </section>

      {message && (
        <p className="wishlist-page__status" aria-live="polite">
          {message}
        </p>
      )}

      {wishlist.items.length === 0 ? (
        <section className="wishlist-page-state">
          <h2>Your wishlist is currently empty.</h2>
          <p>Begin with the fragrances of the Maison.</p>
          <Link href="/fragrances">
            Explore Fragrances <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <ul className="wishlist-grid" aria-label="Wishlist items">
          {wishlist.items.map((item, index) => {
            const imageUrl = item.media?.url
              ? (item.media.url.includes("/video/upload/") || item.media.url.match(/\.(mp4|mov|webm)(\?.*)?$/i))
                ? item.media.url.replace("/video/upload/", "/video/upload/so_0/").replace(/\.(mp4|mov|webm)(\?.*)?$/i, ".jpg$2")
                : item.media.url
              : null;

            return (
              <li
                className="wishlist-card"
                key={`${item.productSlug ?? item.productName}-${index}`}
              >
                <div className="wishlist-card__media">
                  {item.productSlug ? (
                    <Link
                      href={`/product/${item.productSlug}`}
                      className="block w-full h-full relative cursor-pointer"
                      aria-label={`View ${item.productName}`}
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.media?.alt ?? item.productName}
                          fill
                          sizes="(max-width: 680px) 45vw, 260px"
                          unoptimized
                        />
                      ) : (
                        <span aria-hidden="true">AURA</span>
                      )}
                    </Link>
                  ) : imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={item.media?.alt ?? item.productName}
                      fill
                      sizes="(max-width: 680px) 45vw, 260px"
                      unoptimized
                    />
                  ) : (
                    <span aria-hidden="true">AURA</span>
                  )}

                  {/* Direct Remove via Favorite Heart Icon */}
                  {item.productSlug && (
                    <button
                      type="button"
                      onClick={() => remove(item.productSlug)}
                      aria-label={`Remove ${item.productName} from wishlist`}
                      title="Remove from wishlist"
                      className="wishlist-card__heart-btn"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="wishlist-card__body">
                  <p className="fragrance-catalog-eyebrow">{item.audience ?? "AURA fragrance"}</p>
                  <h2>
                    {item.productSlug ? (
                      <Link href={`/product/${item.productSlug}`}>{item.productName}</Link>
                    ) : (
                      item.productName
                    )}
                  </h2>
                  {item.currentPrice && <p>{formatMinorUnitMoney(item.currentPrice)}</p>}
                  {item.availability === "UNAVAILABLE" && (
                    <p>This fragrance is currently unavailable.</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
