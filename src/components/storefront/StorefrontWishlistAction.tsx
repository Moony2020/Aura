"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { readCurrentWishlistAction } from "@/server/wishlist/wishlist-actions";

export function StorefrontWishlistAction() {
  const [count, setCount] = useState<number>(3);

  useEffect(() => {
    readCurrentWishlistAction()
      .then((response) => {
        setCount(response.ok ? response.wishlist.itemCount : 0);
      })
      .catch(() => setCount(0));

    const handleSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ slug?: string; saved?: boolean; count?: number }>;
      if (typeof customEvent.detail?.count === "number") {
        setCount(customEvent.detail.count);
      } else {
        readCurrentWishlistAction()
          .then((response) => setCount(response.ok ? response.wishlist.itemCount : 0))
          .catch(() => setCount(0));
      }
    };

    window.addEventListener("aura:wishlist-sync", handleSync);
    return () => window.removeEventListener("aura:wishlist-sync", handleSync);
  }, []);

  return (
    <Link
      className="relative p-2 text-[#c2b8a3] hover:text-[#e5c982] transition-colors flex items-center justify-center cursor-pointer"
      href="/wishlist"
      aria-label={`View wishlist (${count} items)`}
      title="View wishlist"
    >
      <Heart className="w-5 h-5" strokeWidth={1.5} />
      <span
        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d8b93f] text-[#17130d] font-bold text-[10px] flex items-center justify-center leading-none shadow-[0_2px_5px_rgba(0,0,0,0.6)]"
        aria-label={`${count} items in wishlist`}
      >
        {count}
      </span>
    </Link>
  );
}
