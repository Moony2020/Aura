"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type CollectionItem = {
  id: string;
  number: string;
  name: string;
  category: "her" | "him" | "unisex" | "floral" | "woody" | "oriental" | "fresh";
  description: string;
  image: string;
  href: string;
  tagline: string;
};

const collectionsData: CollectionItem[] = [
  {
    id: "floral-elegance",
    number: "01",
    name: "Floral Elegance",
    category: "floral",
    tagline: "FOR HER & FLORAL AFICIONADOS",
    description: "Timeless florals that celebrate femininity in every bloom, crafted with Grasse jasmine, white gardenia, and Bulgarian rose.",
    image: "/assets/curated-floral.jpg",
    href: "/fragrances?family=floral",
  },
  {
    id: "masculine-essence",
    number: "02",
    name: "Masculine Essence",
    category: "him",
    tagline: "BOLD & SOPHISTICATED",
    description: "Bold, confident & powerful scents for the modern gentleman, featuring smoky vetiver, Tuscan leather, and dark woods.",
    image: "/assets/curated-masculine.jpg",
    href: "/fragrances/men",
  },
  {
    id: "oriental-opulence",
    number: "03",
    name: "Oriental Opulence",
    category: "oriental",
    tagline: "MYSTERIOUS & EXOTIC",
    description: "Rich, mysterious & exotic compositions from the East, anchored by warm Cambodian oud, golden amber, and rare spices.",
    image: "/assets/curated-oriental.jpg",
    href: "/fragrances?family=oriental",
  },
  {
    id: "fresh-horizons",
    number: "04",
    name: "Fresh Horizons",
    category: "fresh",
    tagline: "CLEAN & INVIGORATING",
    description: "Clean, airy & invigorating fragrances inspired by nature, crisp sea minerals, sparkling bergamot, and zesty citrus.",
    image: "/assets/curated-fresh.jpg",
    href: "/fragrances?family=fresh",
  },
];

const filterCategories = [
  {
    id: "all",
    label: "ALL COLLECTIONS",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M12 2a4 4 0 0 0-4 4v1H7a2 2 0 0 0-2 2v10a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V9a2 2 0 0 0-2-2h-1V6a4 4 0 0 0-4-4z" />
        <circle cx="12" cy="14" r="2" fill="none" stroke="currentColor" />
        <path d="M12 2v3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "her",
    label: "FOR HER",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <circle cx="12" cy="8" r="5" />
        <path d="M12 13v9M9 17h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "him",
    label: "FOR HIM",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M12 3l7 7-7 7-7-7 7-7z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    ),
  },
  {
    id: "unisex",
    label: "UNISEX",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <circle cx="9" cy="12" r="5" />
        <circle cx="15" cy="12" r="5" />
      </svg>
    ),
  },
  {
    id: "floral",
    label: "FLORAL",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <circle cx="12" cy="12" r="2.5" />
        <path d="M12 4.5c1.2 0 2.5 1.5 2.5 3.5S13.2 11.5 12 11.5s-2.5-1.5-2.5-3.5S10.8 4.5 12 4.5z" />
        <path d="M12 19.5c1.2 0 2.5-1.5 2.5-3.5s-1.3-3.5-2.5-3.5-2.5 1.5-2.5 3.5 1.3 3.5 2.5 3.5z" />
        <path d="M4.5 12c0-1.2 1.5-2.5 3.5-2.5s3.5 1.3 3.5 2.5-1.5 2.5-3.5 2.5-3.5-1.3-3.5-2.5z" />
        <path d="M19.5 12c0-1.2-1.5-2.5-3.5-2.5s-3.5 1.3-3.5 2.5 1.5 2.5 3.5 2.5 3.5-1.3 3.5-2.5z" />
      </svg>
    ),
  },
  {
    id: "woody",
    label: "WOODY",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M12 21C7 21 4 16 4 11 4 6 12 3 12 3s8 3 8 8c0 5-3 10-8 10z" />
        <path d="M12 3v18" strokeLinecap="round" />
        <path d="M12 9l4 3M12 13l-4 3M12 17l3 2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "oriental",
    label: "ORIENTAL",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "fresh",
    label: "FRESH",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M2 9c3-2 6 2 9 0s6-2 9 0M2 14c3-2 6 2 9 0s6-2 9 0M2 19c3-2 6 2 9 0s6-2 9 0" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function CollectionsInteractiveView() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const filteredCollections = collectionsData.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "her") return item.category === "floral" || item.category === "her";
    if (activeFilter === "him") return item.category === "him" || item.category === "woody";
    if (activeFilter === "unisex") return item.category === "oriental" || item.category === "fresh";
    return item.category === activeFilter;
  });

  return (
    <div className="collections-client-root w-full space-y-16">
      {/* Category / Mood Filter Bar */}
      <section id="all-collections" className="collections-filter-section py-2">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 border-y border-[#3a3528]/40 py-6 bg-[#120f12]/30 backdrop-blur-md px-4 rounded-xl">
          {filterCategories.map((cat) => {
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-[#c5a869]/15 text-[#e5c982] border border-[#c5a869]/60 shadow-[0_0_15px_rgba(197,168,105,0.2)]"
                    : "text-[#c2b8a3]/70 hover:text-[#f3ebdb] hover:border-[#c5a869]/30 border border-transparent"
                }`}
              >
                <span className={`transition-transform duration-300 ${isActive ? "text-[#e5c982] scale-110" : "text-[#c2b8a3]/50 group-hover:text-[#e5c982]"}`}>
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4 Curated Collection Cards Grid */}
      <section className="collections-curated-grid">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCollections.map((col) => (
            <div
              key={col.id}
              className="group relative flex flex-col bg-[#141217]/60 border border-[#3a3528]/50 hover:border-[#c5a869]/60 rounded-2xl overflow-hidden shadow-xl transition-all duration-500 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0c0a0e]">
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141217] via-transparent to-black/30" />
                
                {/* Number Badge */}
                <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-[#c5a869]/40 text-[#e5c982] font-serif text-sm font-semibold px-3 py-1 rounded-full">
                  {col.number}
                </span>
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between bg-gradient-to-b from-[#141217]/90 to-[#120f12]">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#c5a869] font-medium">{col.tagline}</p>
                  <h3 className="font-serif text-xl sm:text-2xl text-[#f3ebdb] group-hover:text-[#e5c982] transition-colors">{col.name}</h3>
                  <p className="text-xs text-[#a99e8a] leading-relaxed line-clamp-3">{col.description}</p>
                </div>

                <div className="pt-6">
                  <Link
                    href={col.href}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e5c982] hover:text-[#fff] transition-all group-hover:translate-x-1"
                  >
                    <span>SHOP COLLECTION</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* House Value Proposition Bar */}
      <section className="collections-value-props bg-[#141217]/80 border border-[#3a3528]/50 rounded-2xl p-8 backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#3a3528]/40">
          <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0 space-y-2">
            <svg className="w-8 h-8 text-[#e5c982] mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M12 2a3 3 0 0 0-3 3v1H8a2 2 0 0 0-2 2v11a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8a2 2 0 0 0-2-2h-1V5a3 3 0 0 0-3-3z" />
              <circle cx="12" cy="13" r="2" />
            </svg>
            <span className="text-[#e5c982] font-serif text-sm tracking-[0.15em] font-semibold uppercase">EXCLUSIVE EDITS</span>
            <p className="text-xs text-[#a99e8a] leading-relaxed">Unique compositions crafted by AURA</p>
          </div>
          <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0 space-y-2">
            <svg className="w-8 h-8 text-[#e5c982] mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <circle cx="12" cy="8" r="5" />
              <path d="M8.21 13.89L7 22l5-3 5 3-1.21-8.11" />
            </svg>
            <span className="text-[#e5c982] font-serif text-sm tracking-[0.15em] font-semibold uppercase">PREMIUM INGREDIENTS</span>
            <p className="text-xs text-[#a99e8a] leading-relaxed">Sourced from the world&apos;s finest fragrance houses</p>
          </div>
          <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0 space-y-2">
            <svg className="w-8 h-8 text-[#e5c982] mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <rect x="3" y="8" width="18" height="13" rx="2" />
              <path d="M12 8v13M3 13h18M8 8a3 3 0 1 1 4-2.83A3 3 0 1 1 16 8" />
            </svg>
            <span className="text-[#e5c982] font-serif text-sm tracking-[0.15em] font-semibold uppercase">LUXURY EXPERIENCE</span>
            <p className="text-xs text-[#a99e8a] leading-relaxed">Elevated packaging for every memorable moment</p>
          </div>
          <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0 space-y-2">
            <svg className="w-8 h-8 text-[#e5c982] mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M12 3l8 3.5v7.5c0 5.5-3.5 10-8 11.5-4.5-1.5-8-6-8-11.5V6.5L12 3z" />
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[#e5c982] font-serif text-sm tracking-[0.15em] font-semibold uppercase">AUTHENTICITY</span>
            <p className="text-xs text-[#a99e8a] leading-relaxed">100% authentic products guaranteed</p>
          </div>
        </div>
      </section>

      {/* Interactive Media: The Art of Fragrance & Fragrance Guide Discovery Box */}
      <section className="collections-dual-editorial grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: The Art of Fragrance */}
        <div className="relative group rounded-2xl overflow-hidden border border-[#3a3528]/60 bg-[#141217] min-h-[340px] flex flex-col justify-end p-8">
          <Image
            src="/assets/art-fragrance-exact.jpg"
            alt="The Art of Fragrance"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <button
            type="button"
            onClick={() => setIsVideoModalOpen(true)}
            aria-label="Play Art of Fragrance film"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#e5c982]/20 backdrop-blur-md border border-[#e5c982]/80 flex items-center justify-center text-[#f3ebdb] hover:bg-[#e5c982] hover:text-black transition-all duration-300 hover:scale-110 shadow-[0_0_30px_rgba(229,201,130,0.3)]"
          >
            <svg className="w-6 h-6 ml-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <div className="relative z-10 space-y-2">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#e5c982] font-semibold">THE ART OF</span>
            <h3 className="font-serif text-3xl text-[#f3ebdb]">Fragrance.</h3>
          </div>
        </div>

        {/* Card 2: Fragrance Guide Discovery Box */}
        <div className="relative group rounded-2xl overflow-hidden border border-[#3a3528]/60 bg-[#141217] min-h-[340px] flex flex-col justify-end p-8">
          <Image
            src="/assets/frag-guide-exact.jpg"
            alt="Fragrance Discovery Box Guide"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          <div className="relative z-10 space-y-4">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#e5c982] font-semibold">FRAGRANCE GUIDE</span>
            <div className="space-y-1">
              <h3 className="font-serif text-2xl sm:text-3xl text-[#f3ebdb]">Not sure where to start?</h3>
              <p className="text-xs text-[#c2b8a3] max-w-md">Let our fragrance finder guide you to the scents that match your mood and style.</p>
            </div>
            <div>
              <Link
                href="/fragrances"
                className="inline-flex items-center gap-3 bg-[#e5c982] text-black font-semibold text-xs tracking-[0.2em] uppercase px-6 py-3 rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(229,201,130,0.3)] hover:scale-105"
              >
                <span>FIND YOUR SCENT</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Assurance Footer Bar */}
      <section className="collections-trust-bar border-t border-[#3a3528]/50 pt-8 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#e5c982] uppercase">FREE SHIPPING</p>
            <p className="text-[11px] text-[#a99e8a]">On all orders over $150</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#e5c982] uppercase">LUXURY PACKAGING</p>
            <p className="text-[11px] text-[#a99e8a]">Exquisite in every detail</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#e5c982] uppercase">AUTHENTICITY GUARANTEED</p>
            <p className="text-[11px] text-[#a99e8a]">100% original products from authorized distributors</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#e5c982] uppercase">NEED HELP?</p>
            <p className="text-[11px] text-[#a99e8a]">Our fragrance specialists are here to help you.</p>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#141217] border border-[#c5a869]/50 rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 z-20 text-white bg-black/60 hover:bg-[#e5c982] hover:text-black w-8 h-8 rounded-full flex items-center justify-center transition-all"
            >
              ✕
            </button>
            <div className="aspect-video w-full relative bg-black flex items-center justify-center">
              <video
                src="https://res.cloudinary.com/dyt4a78qu/video/upload/v1726058694/aura/cinematic-teaser.mp4"
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
