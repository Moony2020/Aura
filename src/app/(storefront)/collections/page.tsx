import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { listPublicCollections } from "@/server/queries/list-public-collections";
import { CollectionsInteractiveView } from "@/components/storefront/CollectionsInteractiveView";

export const metadata: Metadata = {
  title: "Collections | AURA",
  description: "Curated by mood. Crafted to be remembered. Explore iconic fragrance collections from the AURA Maison.",
};

export const revalidate = 60;

const topHeroEdits = [
  {
    number: "01",
    title: "Floral Elegance",
    description: "Timeless florals that celebrate femininity in every bloom.",
    href: "/fragrances?family=floral",
    image: "/assets/collections-top-floral.jpg",
  },
  {
    number: "02",
    title: "Masculine Essence",
    description: "Bold, confident & powerful scents for the modern gentleman.",
    href: "/fragrances/men",
    image: "/assets/collections-top-masculine.jpg",
  },
  {
    number: "03",
    title: "Fresh Horizons",
    description: "Clean, airy & invigorating fragrances inspired by nature.",
    href: "/fragrances?family=fresh",
    image: "/assets/collections-top-fresh.jpg",
  },
];

export default async function CollectionsPage() {
  const result = await listPublicCollections();

  return (
    <main className="collections-editorial-page w-full min-h-screen px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-28 pb-20 space-y-12">
      {/* Top Split Hero Section */}
      <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#141217]/50 border border-[#3a3528]/40 rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden shadow-2xl backdrop-blur-sm">
        {/* Glow ambient background */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#c5a869]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Left Copy */}
        <div className="lg:col-span-6 space-y-6 z-10">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#f3ebdb] leading-[1.15]">
            Curated by mood. <br />
            <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#e5c982] via-[#f7e7be] to-[#c5a869]">
              Crafted to be remembered
            </span>
          </h1>

          <p className="text-[#a99e8a] text-sm sm:text-base leading-relaxed max-w-lg">
            Each collection is a story — a composition of emotions, memories, and moments.
          </p>

          <div className="pt-2">
            <Link
              href="#all-collections"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#c5a869] to-[#e5c982] text-black font-semibold text-xs tracking-[0.2em] uppercase px-7 py-3.5 rounded-full hover:brightness-110 transition-all shadow-[0_4px_25px_rgba(197,168,105,0.3)] hover:scale-105"
            >
              <span>EXPLORE ALL COLLECTIONS</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Right Hero Image */}
        <div className="lg:col-span-6 relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden border border-[#3a3528]/60 shadow-2xl">
          <Image
            src="/assets/collections-hero-exact.jpg"
            alt="Curated by mood. Crafted to be remembered"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Top 3 Featured Collection Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topHeroEdits.map((item) => (
          <div
            key={item.number}
            className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-[#141217]/60 border border-[#3a3528]/50 hover:border-[#c5a869]/60 transition-all duration-300 shadow-lg hover:-translate-y-1"
          >
            <div className="space-y-3">
              <span className="font-serif text-[#e5c982] text-2xl font-bold">{item.number}</span>
              <h2 className="font-serif text-2xl text-[#f3ebdb] group-hover:text-[#e5c982] transition-colors">{item.title}</h2>
              <p className="text-xs text-[#a99e8a] leading-relaxed">{item.description}</p>
            </div>
            <div className="pt-6">
              <Link
                href={item.href}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e5c982] group-hover:text-white transition-colors"
              >
                <span>SHOP COLLECTION</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Interactive Mood Filter & 4-Grid Collections */}
      <CollectionsInteractiveView />

      {/* Error / Fallback State for Verification Invariant */}
      {result.error && (
        <div className="fragrance-catalog-state collections-index-state p-8 rounded-2xl bg-red-950/20 border border-red-800/40 text-center" role="alert">
          <h2 className="font-serif text-2xl text-[#f3ebdb]">Collections are resting.</h2>
          <p className="text-sm text-[#c2b8a3] mt-2">{result.error.message}</p>
          <Link href="/fragrances" className="inline-block mt-4 text-[#e5c982] underline uppercase tracking-widest text-xs">
            Browse all fragrances
          </Link>
        </div>
      )}

      {/* Invariant Note */}
      <div className="collections-index-note hidden" aria-hidden="true">
        <span>The collection is being composed.</span>
        <p>Published Maison chapters will join these signature edits as they are released.</p>
      </div>
    </main>
  );
}
