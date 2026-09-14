"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Heart, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatMinorUnitMoney } from "@/lib/money";
import { addCartItemAction } from "@/server/cart/cart-actions";
import { clearWishlistAction, readCurrentWishlistAction, removeWishlistProductAction } from "@/server/wishlist/wishlist-actions";
import type { WishlistViewItem, WishlistViewModel } from "@/server/wishlist/wishlist-service";
import { publishCartView } from "@/lib/cart-events";

const emptyWishlist: WishlistViewModel = { items: [], itemCount: 0, version: 0 };

function itemKey(item: WishlistViewItem) {
  return item.productSlug ?? item.productName;
}

export function StorefrontWishlistAction() {
  const drawerId = useId();
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [wishlist, setWishlist] = useState(emptyWishlist);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();
  const refresh = () => readCurrentWishlistAction().then((result) => { if (result.ok) setWishlist(result.wishlist); });

  useEffect(() => {
    setMounted(true);
    refresh();
    const sync = () => refresh();
    window.addEventListener("aura:wishlist-sync", sync);
    return () => window.removeEventListener("aura:wishlist-sync", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); trigger?.focus(); };
  }, [open]);

  const remove = (productSlug: string) => startTransition(async () => {
    const result = await removeWishlistProductAction({ productSlug, expectedVersion: wishlist.version });
    if (result.ok) { setWishlist(result.wishlist); window.dispatchEvent(new CustomEvent("aura:wishlist-sync")); }
  });

  const addToBag = (item: WishlistViewItem, closeAfter = true) => {
    if (!item.productSlug || !item.defaultVariantId) return;
    return addCartItemAction({ productSlug: item.productSlug, variantId: item.defaultVariantId, quantity: quantities[itemKey(item)] ?? 1 }).then((result) => {
      if (result.ok) { publishCartView(result.cart); if (closeAfter) setOpen(false); }
      return result;
    });
  };

  const addAll = () => startTransition(async () => {
    let latestCart = null;
    for (const item of wishlist.items) { const result = await addToBag(item, false); if (result?.ok) latestCart = result.cart; }
    if (latestCart) { publishCartView(latestCart); setOpen(false); }
  });

  const clearAll = () => startTransition(async () => {
    const result = await clearWishlistAction(wishlist.version);
    if (result.ok) { setWishlist(result.wishlist); setQuantities({}); window.dispatchEvent(new CustomEvent("aura:wishlist-sync")); }
  });

  const suggestions = wishlist.items.filter((item) => item.availability === "AVAILABLE").slice(0, 2);

  return <>
    <button ref={triggerRef} type="button" onClick={() => { setOpen(true); refresh(); }} aria-label={`Open wishlist (${wishlist.itemCount} items)`} aria-haspopup="dialog" aria-expanded={open} aria-controls={drawerId} className="relative p-2 text-[#c2b8a3] hover:text-[#e5c982]">
      <Heart className="h-5 w-5" strokeWidth={1.5} /><span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d8b93f] px-1 text-[10px] font-bold text-[#17130d]">{wishlist.itemCount}</span>
    </button>
    {open && mounted && createPortal(<div id={drawerId} role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-[9999]">
      <button type="button" aria-label="Close wishlist" onClick={() => setOpen(false)} className="absolute inset-0 h-full w-full bg-black/65" />
      <aside className="relative ml-auto flex h-full w-full max-w-[29rem] flex-col overflow-y-auto border-l border-[#d8b93f]/25 bg-[#0d0b0d] p-5 text-[#f8f0e3] shadow-2xl sm:p-6">
        <header className="flex items-start justify-between border-b border-[#d8b93f]/20 pb-5"><div><h2 id={titleId} className="font-serif text-3xl leading-none sm:text-4xl">Your Wishlist</h2><p className="mt-2 text-xs text-[#a99e8f]">{wishlist.itemCount} {wishlist.itemCount === 1 ? "item" : "items"} saved for later</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close wishlist" className="-mr-2 -mt-2 p-2 text-[#e5c982] hover:text-white"><X className="h-6 w-6" /></button></header>
        {wishlist.items.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center text-center"><Heart className="mb-5 h-12 w-12 text-[#d8b93f]" strokeWidth={1} /><p className="font-serif text-2xl">Your wishlist is empty</p><Link onClick={() => setOpen(false)} href="/fragrances" className="mt-6 border border-[#d8b93f]/50 px-5 py-3 text-xs tracking-widest text-[#e5c982]">EXPLORE FRAGRANCES</Link></div> : <>
          <div className="flex items-center gap-2 border-b border-[#d8b93f]/15 py-4"><button type="button" disabled={isPending} onClick={addAll} className="flex flex-1 items-center justify-center gap-2 rounded border border-[#d8b93f] bg-[#d8b93f] px-3 py-3 text-xs font-semibold tracking-[.08em] text-[#17130d] hover:bg-[#f0d276] disabled:opacity-50"><ShoppingBag className="h-4 w-4" /> ADD ALL TO CART ({wishlist.itemCount})</button><button type="button" disabled={isPending} onClick={clearAll} aria-label="Clear wishlist" title="Clear wishlist" className="rounded border border-[#d8b93f]/60 p-3 text-[#e5c982] hover:bg-[#d8b93f]/10 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></div>
          <ul className="divide-y divide-[#d8b93f]/15">{wishlist.items.map((item) => { const key = itemKey(item); const quantity = quantities[key] ?? 1; return <li key={key} className="relative grid grid-cols-[4.25rem_1fr_2rem] items-start gap-3 py-4">
            <div className="flex flex-col gap-2">{item.media ? <Image src={item.media.url} alt={item.media.alt} width={68} height={82} className="h-[4.5rem] w-[4.25rem] rounded object-cover" unoptimized /> : <div className="h-[4.5rem] rounded bg-[#191519]" />}<div className="flex h-7 items-center justify-between rounded border border-[#d8b93f]/35 px-1 text-xs text-[#f3ebdb]"><button type="button" aria-label={`Decrease ${item.productName} quantity`} onClick={() => setQuantities((current) => ({ ...current, [key]: Math.max(1, quantity - 1) }))}><Minus className="h-3 w-3" /></button><span>{quantity}</span><button type="button" aria-label={`Increase ${item.productName} quantity`} onClick={() => setQuantities((current) => ({ ...current, [key]: Math.min(99, quantity + 1) }))}><Plus className="h-3 w-3" /></button></div></div>
            <div className="min-w-0 pr-1"><p className="text-[10px] tracking-[.18em] text-[#cbb98d]">{item.audience ?? "AURA"}</p><Link onClick={() => setOpen(false)} href={item.productSlug ? `/product/${item.productSlug}` : "/fragrances"} className="mt-1 block truncate font-serif text-lg leading-tight hover:text-[#e5c982]">{item.productName}</Link><p className="mt-1 text-xs text-[#a99e8f]">Eau de Parfum · 100 ml</p><p className="mt-2 text-sm">{item.currentPrice ? formatMinorUnitMoney(item.currentPrice) : "Unavailable"}</p></div>
            <div className="flex h-full min-h-[5.5rem] flex-col items-end justify-between self-stretch">
              <button type="button" disabled={isPending || item.availability !== "AVAILABLE"} onClick={() => addToBag(item)} aria-label={`Add ${item.productName} to cart`} title="Add to cart" className="p-0 text-[#e5c982] transition-colors hover:text-white disabled:opacity-40"><ShoppingBag className="h-5 w-5" /></button>
              <button type="button" disabled={isPending} onClick={() => item.productSlug && remove(item.productSlug)} aria-label={`Remove ${item.productName} from wishlist`} title="Remove from wishlist" className="p-0 text-[#cbb98d] hover:text-white transition-colors"><X className="h-4 w-4" /></button>
            </div>
          </li>; })}</ul>
          {suggestions.length > 0 && <section className="mt-5 border-t border-[#d8b93f]/20 pt-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-serif text-xl">You might also like</h3><Link onClick={() => setOpen(false)} href="/fragrances" className="text-xs text-[#e5c982]">View All →</Link></div><div className="grid grid-cols-2 gap-3">{suggestions.map((item) => <div key={`suggestion-${itemKey(item)}`} className="overflow-hidden rounded border border-[#d8b93f]/20 bg-[#151216] hover:border-[#d8b93f]/60">{item.media && <Link onClick={() => setOpen(false)} href={item.productSlug ? `/product/${item.productSlug}` : "/fragrances"} className="block"><Image src={item.media.url} alt={item.media.alt} width={160} height={120} className="h-24 w-full object-cover" unoptimized /></Link>}<div className="flex items-end justify-between gap-2 p-2"><Link onClick={() => setOpen(false)} href={item.productSlug ? `/product/${item.productSlug}` : "/fragrances"} className="min-w-0"><p className="truncate font-serif text-sm">{item.productName}</p><p className="mt-1 text-xs text-[#a99e8f]">{item.currentPrice ? formatMinorUnitMoney(item.currentPrice) : "Unavailable"}</p></Link><button type="button" disabled={isPending || item.availability !== "AVAILABLE"} onClick={() => addToBag(item)} aria-label={`Add ${item.productName} to cart`} title="Add to cart" className="shrink-0 rounded border border-[#d8b93f]/70 p-2 text-[#e5c982] hover:bg-[#d8b93f] hover:text-[#17130d] disabled:opacity-40"><ShoppingBag className="h-4 w-4" /></button></div></div>)}</div></section>}
        </>}
      </aside>
    </div>, document.body)}
  </>;
}
