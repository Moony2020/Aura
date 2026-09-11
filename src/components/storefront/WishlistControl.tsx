"use client";

import { Heart } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { readCurrentWishlistAction, saveWishlistProductAction, removeWishlistProductAction } from "@/server/wishlist/wishlist-actions";

export function WishlistControl({ productSlug, initialSaved = false }: { productSlug: string; initialSaved?: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    readCurrentWishlistAction()
      .then((response) => setSaved(response.ok ? response.wishlist.items.some((item) => item.productSlug === productSlug) : initialSaved))
      .catch(() => setSaved(initialSaved));

    const handleSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ slug?: string; saved?: boolean }>;
      if (customEvent.detail?.slug === productSlug && typeof customEvent.detail?.saved === "boolean") {
        setSaved(customEvent.detail.saved);
      }
    };

    window.addEventListener("aura:wishlist-sync", handleSync);
    return () => window.removeEventListener("aura:wishlist-sync", handleSync);
  }, [initialSaved, productSlug]);

  function toggle() {
    if (isPending) return;
    const nextSaved = !saved;
    setSaved(nextSaved);

    startTransition(async () => {
      const response = nextSaved
        ? await saveWishlistProductAction({ productSlug })
        : await removeWishlistProductAction({ productSlug });

      if (response.ok) {
        setMessage(nextSaved ? "Saved to your wishlist." : "Removed from your wishlist.");
        try {
          const slugs = response.wishlist.items.map((i) => i.productSlug).filter(Boolean);
          window.dispatchEvent(
            new CustomEvent("aura:wishlist-sync", {
              detail: { slug: productSlug, saved: nextSaved, count: slugs.length },
            })
          );
        } catch {}
      } else {
        setSaved(!nextSaved);
        setMessage(response.error.message || "Wishlist could not be updated right now.");
      }
    });
  }

  return (
    <div className="wishlist-control">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        aria-pressed={saved}
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      >
        <Heart aria-hidden="true" fill={saved ? "currentColor" : "none"} />
        <span>{isPending ? "Updating..." : saved ? "Saved" : "Save to wishlist"}</span>
      </button>
      <p aria-live="polite">{message}</p>
    </div>
  );
}
