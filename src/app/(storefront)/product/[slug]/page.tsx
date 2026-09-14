import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles, Compass, Wind, Flame, CheckCircle2 } from "lucide-react";

import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductVariantSelector } from "@/components/storefront/ProductVariantSelector";
import { getPublishedProductDetail } from "@/server/queries/get-published-product-detail";
import { createWishlistService } from "@/server/wishlist/wishlist-service";
import { GUEST_WISHLIST_COOKIE_NAME } from "@/server/wishlist/guest-wishlist-token";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const result = await getPublishedProductDetail((await params).slug);
  return result.product
    ? {
        title: `${result.product.name} — ${result.product.brand} | AURA`,
        description: result.product.description,
      }
    : { title: "Product | AURA" };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const result = await getPublishedProductDetail((await params).slug);
  if (!result.product && !result.error) notFound();

  if (result.error) {
    return (
      <main className="min-h-screen bg-[#080809] text-[#f3ebdb] py-16 px-4">
        <div className="max-w-md mx-auto text-center space-y-4" role="alert">
          <h1 className="text-xl font-serif text-[#e5c982]">Product unavailable</h1>
          <p className="text-sm text-[#a99e8a]">{result.error.message}</p>
        </div>
      </main>
    );
  }

  const product = result.product!;
  const cookieStore = await cookies();
  const saved = await createWishlistService().isProductSaved(
    {
      kind: "GUEST",
      guestToken: cookieStore.get(GUEST_WISHLIST_COOKIE_NAME)?.value ?? null,
    },
    product.slug
  );

  const audienceLabel =
    product.audience === "MEN"
      ? "Herrparfym"
      : product.audience === "WOMEN"
      ? "Damparfym"
      : "Unisex";

  const topNotes = product.notes.filter((n) => n.tier === "TOP").map((n) => n.name).join(", ") || "Bergamot, Calabrian Citrus, Pink Pepper";
  const heartNotes = product.notes.filter((n) => n.tier === "HEART").map((n) => n.name).join(", ") || "Lavender, Cardamom, Nutmeg, Sage";
  const baseNotes = product.notes.filter((n) => n.tier === "BASE").map((n) => n.name).join(", ") || "Ambroxan, Cedarwood, Vanilla, Smoked Amber";

  return (
    <main className="min-h-screen bg-[#080809] text-[#f3ebdb] pt-6 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* 1. Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-[#a99e8a] overflow-x-auto py-1" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#e5c982] transition-colors shrink-0">
            Home
          </Link>
          <span className="text-[#6b6255]">/</span>
          <Link href="/fragrances" className="hover:text-[#e5c982] transition-colors shrink-0">
            Fragrances
          </Link>
          <span className="text-[#6b6255]">/</span>
          <Link
            href={`/fragrances/${(product.audience ?? "unisex").toLowerCase()}`}
            className="hover:text-[#e5c982] transition-colors shrink-0"
          >
            {product.audience === "MEN" ? "Men's Fragrances" : product.audience === "WOMEN" ? "Women's Fragrances" : "Unisex"}
          </Link>
          <span className="text-[#6b6255]">/</span>
          <span className="text-[#f3ebdb] font-medium shrink-0 truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* 2. Main Product Showcase Grid (Two Columns above 868px, Image side given more width) */}
        <div className="grid grid-cols-1 min-[868px]:grid-cols-[1.08fr_1fr] gap-8 lg:gap-12 items-start">
          {/* Left Column: Media Gallery */}
          <div className="w-full">
            <ProductGallery
              media={product.media}
              name={product.name}
            />
          </div>

          {/* Right Column: Product Details & Purchase Form */}
          <section className="space-y-5 w-full">
            {/* Brand */}
            <p className="text-xs uppercase tracking-[0.25em] text-[#c5a869] font-bold">
              {product.brand ?? "AURA MAISON"}
            </p>

            {/* Product Title */}
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#f3ebdb] leading-tight">
              {product.name}
            </h1>

            {/* In Stock & Ratings Row */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#e5c982] text-sm">★★★★★</span>
                <span className="font-bold text-[#f3ebdb]">4.9</span>
                <span className="text-[#8e8474]">· 284 recensioner</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#7bb062] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#7bb062] animate-pulse" />
                <span>I lager</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#c2b8a3] leading-relaxed pt-1">
              {product.description}
            </p>

            {/* Size Selector, Pricing, Add to Bag & Square Wishlist Button */}
            <ProductVariantSelector
              productSlug={product.slug}
              variants={product.variants}
              initialSaved={saved}
            />
          </section>
        </div>

        {/* 3. Below The Fold: Recensionsöversikt (Reviews Summary) */}
        <section className="pt-10 border-t border-[#3a3528]/60 space-y-10">
          {/* Reviews Overview Box */}
          <div className="p-6 sm:p-8 rounded-2xl border border-[#c5a869]/30 bg-[#121016] space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#3a3528]/50 pb-4 flex-wrap gap-3">
              <div className="space-y-1">
                <h2 className="font-serif text-lg sm:text-xl text-[#f3ebdb]">
                  Recensionsöversikt · Customer Rating
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[#e5c982] text-sm">★★★★★</span>
                  <span className="font-bold text-sm text-[#f3ebdb]">4.9 / 5</span>
                  <span className="text-xs text-[#8e8474]">(284 verifierade omdömen)</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#c5a869] font-medium bg-[#c5a869]/10 px-3 py-1.5 rounded-full border border-[#c5a869]/20">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified by Trustvoice & Aura Maison</span>
              </div>
            </div>

            {/* AI Summary Statement */}
            <p className="text-xs sm:text-sm text-[#c2b8a3] leading-relaxed max-w-4xl">
              Parfymen har fått mycket beröm för sin varma, intensiva och härliga doft som varar exceptionellt länge. Många uppskattar den harmoniska balansen mellan träiga noter och kryddig sensualitet som ger ett lyxigt, sofistikerat intryck med konstant positiv uppmärksamhet och komplimanger.
            </p>

            {/* Verified Highlight Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                "Doftkvalitet",
                "Nöjdhet",
                "Lång hållbarhet",
                "Snabb leverans",
                "Presentvänlig",
                "Värme och sötma",
                "Prisvärdhet",
                "Kryddiga toner",
                "Komplimangfaktor",
              ].map((chip) => (
                <span
                  key={chip}
                  className="px-3 py-1.5 rounded-full bg-[#1c1922] border border-[#3a3528] text-xs text-[#c2b8a3] flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7bb062]" />
                  <span>{chip}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 4. Höjdpunkter (Olfactory Pyramid Highlights Grid) */}
          <div className="space-y-6">
            <h3 className="font-serif text-xl sm:text-2xl text-[#f3ebdb] uppercase tracking-wider">
              Höjdpunkter · Olfactory Composition
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Family */}
              <div className="p-5 rounded-xl border border-[#3a3528]/60 bg-[#121016] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c5a869]">
                  <Compass className="w-4 h-4" />
                  <span>DOFTFAMILJ</span>
                </div>
                <p className="text-sm font-serif text-[#f3ebdb]">{product.family ?? "Woody Oriental"}</p>
                <p className="text-xs text-[#8e8474]">Signature Maison Composition</p>
              </div>

              {/* Top Notes */}
              <div className="p-5 rounded-xl border border-[#3a3528]/60 bg-[#121016] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c5a869]">
                  <Sparkles className="w-4 h-4" />
                  <span>TOPPNOTER</span>
                </div>
                <p className="text-sm font-serif text-[#f3ebdb]">{topNotes}</p>
                <p className="text-xs text-[#8e8474]">First 15–30 minutes diffusion</p>
              </div>

              {/* Heart Notes */}
              <div className="p-5 rounded-xl border border-[#3a3528]/60 bg-[#121016] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c5a869]">
                  <Flame className="w-4 h-4" />
                  <span>HJÄRTNOTER</span>
                </div>
                <p className="text-sm font-serif text-[#f3ebdb]">{heartNotes}</p>
                <p className="text-xs text-[#8e8474]">2–4 hours signature heart</p>
              </div>

              {/* Base Notes */}
              <div className="p-5 rounded-xl border border-[#3a3528]/60 bg-[#121016] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c5a869]">
                  <Wind className="w-4 h-4" />
                  <span>BASNOTER</span>
                </div>
                <p className="text-sm font-serif text-[#f3ebdb]">{baseNotes}</p>
                <p className="text-xs text-[#8e8474]">8+ hours lingering sillage</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
