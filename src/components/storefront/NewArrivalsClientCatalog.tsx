"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { FragranceCard } from "@/components/storefront/FragranceCard";
import { formatMinorUnitMoney } from "@/lib/money";
import type { FragranceCatalogItem } from "@/server/queries/list-published-fragrances";

export type DesignerProduct = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  gender: "men" | "women" | "unisex";
  concentration: "EDT" | "EDP" | "Parfum";
  priceFormatted: string;
  priceNumeric: number;
  notes: string;
  reviewsCount: number;
  image: string;
  isNew: boolean;
  sizes: string[];
};

const designerCatalog: DesignerProduct[] = [
  {
    id: "1",
    slug: "dior-sauvage-edp",
    brand: "DIOR",
    name: "Sauvage Eau de Parfum",
    gender: "men",
    concentration: "EDP",
    priceFormatted: "$129.00",
    priceNumeric: 129,
    notes: "Woody · Fresh · Spicy",
    reviewsCount: 136,
    image: "/assets/prod-sauvage.jpg",
    isNew: true,
    sizes: ["30ml", "60ml", "100ml", "200ml"],
  },
  {
    id: "2",
    slug: "bleu-de-chanel-edp",
    brand: "CHANEL",
    name: "Bleu de Chanel EDP",
    gender: "men",
    concentration: "EDP",
    priceFormatted: "$129.00",
    priceNumeric: 129,
    notes: "Citrus · Woody · Aromatic",
    reviewsCount: 95,
    image: "/assets/prod-bleu-chanel.jpg",
    isNew: true,
    sizes: ["50ml", "100ml", "150ml"],
  },
  {
    id: "3",
    slug: "armani-my-way-edp",
    brand: "ARMANI",
    name: "My Way EDP",
    gender: "women",
    concentration: "EDP",
    priceFormatted: "$125.00",
    priceNumeric: 125,
    notes: "Floral · Citrus · Vanilla",
    reviewsCount: 76,
    image: "/assets/prod-my-way.jpg",
    isNew: true,
    sizes: ["30ml", "50ml", "90ml"],
  },
  {
    id: "4",
    slug: "paco-rabanne-1-million-edt",
    brand: "PACO RABANNE",
    name: "1 Million EDT",
    gender: "men",
    concentration: "EDT",
    priceFormatted: "$99.00",
    priceNumeric: 99,
    notes: "Warm · Spicy · Leather",
    reviewsCount: 97,
    image: "/assets/prod-million.jpg",
    isNew: true,
    sizes: ["50ml", "100ml", "200ml"],
  },
  {
    id: "5",
    slug: "acqua-di-gio-profondo-edp",
    brand: "GIORGIO ARMANI",
    name: "Acqua di Giò Profondo",
    gender: "men",
    concentration: "EDP",
    priceFormatted: "$113.00",
    priceNumeric: 113,
    notes: "Marine · Aquatic · Woody",
    reviewsCount: 84,
    image: "/assets/prod-acqua-gio.jpg",
    isNew: true,
    sizes: ["50ml", "100ml", "200ml"],
  },
  {
    id: "6",
    slug: "ysl-black-opium-edp",
    brand: "YVES SAINT LAURENT",
    name: "Black Opium EDP",
    gender: "women",
    concentration: "EDP",
    priceFormatted: "$195.00",
    priceNumeric: 195,
    notes: "Coffee · Vanilla · White Floral",
    reviewsCount: 101,
    image: "/assets/prod-black-opium.jpg",
    isNew: true,
    sizes: ["30ml", "50ml", "90ml"],
  },
  {
    id: "7",
    slug: "hugo-boss-boss-bottled-edp",
    brand: "HUGO BOSS",
    name: "Boss Bottled EDP",
    gender: "men",
    concentration: "EDP",
    priceFormatted: "$89.00",
    priceNumeric: 89,
    notes: "Apple · Cinnamon · Woody",
    reviewsCount: 50,
    image: "/assets/prod-boss-bottled.jpg",
    isNew: true,
    sizes: ["50ml", "100ml", "200ml"],
  },
  {
    id: "8",
    slug: "versace-eros-edp",
    brand: "VERSACE",
    name: "Eros Eau de Parfum",
    gender: "men",
    concentration: "EDP",
    priceFormatted: "$118.00",
    priceNumeric: 118,
    notes: "Woody · Mint · Vanilla",
    reviewsCount: 112,
    image: "/assets/prod-sauvage.jpg",
    isNew: true,
    sizes: ["50ml", "100ml"],
  },
];

const availableBrands = [
  "Dior",
  "Chanel",
  "Giorgio Armani",
  "Versace",
  "Yves Saint Laurent",
  "Hugo Boss",
  "Paco Rabanne",
  "Tom Ford",
];

export function NewArrivalsClientCatalog({ serverProducts }: { serverProducts: FragranceCatalogItem[] }) {
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [brandSearch, setBrandSearch] = useState<string>("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMax, setPriceMax] = useState<number>(550);
  const [selectedConcentrations, setSelectedConcentrations] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isListView, setIsListView] = useState<boolean>(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  const catalogProducts = useMemo<DesignerProduct[]>(() => {
    if (!serverProducts.length) return designerCatalog;

    return serverProducts.map((product) => ({
      id: product.slug,
      slug: product.slug,
      brand: product.brand,
      name: product.name,
      gender: product.audience?.toLowerCase() === "men" ? "men" : product.audience?.toLowerCase() === "women" ? "women" : "unisex",
      concentration: product.concentration.includes("TOILETTE") ? "EDT" : product.concentration.includes("PARFUM") ? "EDP" : "Parfum",
      priceFormatted: formatMinorUnitMoney(product.price),
      priceNumeric: product.price.amount / 100,
      notes: product.family ?? product.description,
      reviewsCount: 0,
      image: product.media?.posterUrl ?? product.media?.url ?? "/assets/prod-bleu-chanel.jpg",
      isNew: true,
      sizes: product.variants.map((variant) => `${variant.volumeMl}ml`),
    }));
  }, [serverProducts]);

  const canonicalProductBySlug = useMemo(
    () => new Map(serverProducts.map((product) => [product.slug, product])),
    [serverProducts],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isFilterDrawerOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isFilterDrawerOpen]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const toggleConcentration = (conc: string) => {
    setSelectedConcentrations((prev) =>
      prev.includes(conc) ? prev.filter((c) => c !== conc) : [...prev, conc]
    );
  };

  const handleClearAll = () => {
    setSelectedGender("all");
    setBrandSearch("");
    setSelectedBrands([]);
    setPriceMax(550);
    setSelectedConcentrations([]);
    setSortBy("newest");
  };

  const filteredBrandsList = useMemo(() => {
    return availableBrands.filter((b) =>
      b.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [brandSearch]);

  const filteredProducts = useMemo(() => {
    return catalogProducts.filter((item) => {
      if (selectedGender !== "all" && item.gender !== selectedGender) return false;
      if (
        selectedBrands.length > 0 &&
        !selectedBrands.some((b) => item.brand.toLowerCase().includes(b.toLowerCase()))
      ) {
        return false;
      }
      if (item.priceNumeric > priceMax) return false;
      if (
        selectedConcentrations.length > 0 &&
        !selectedConcentrations.includes(item.concentration)
      ) {
        return false;
      }
      return true;
    });
  }, [catalogProducts, selectedGender, selectedBrands, priceMax, selectedConcentrations]);

  return (
    <div className="new-arrivals-client-root w-full space-y-6 sm:space-y-8">
      {/* 1. TOP 3-CARD HERO SPOTLIGHT SECTION (FULL-BLEED 100% EDGE-TO-EDGE BACKGROUND) */}
      <section className="relative w-full overflow-hidden bg-[#070608] pt-6 sm:pt-8 lg:pt-10 pb-2 sm:pb-3 lg:pb-4 shadow-2xl">
        {/* Full-Bleed Gold Dust Background Image heronewarrivalsimg.jpeg */}
        <Image
          src="/assets/heronewarrivalsimg.jpeg"
          alt="Hero Ambient Gold Dust Stardust"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-95 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          {/* Full-Width Luxury Campaign Hero Banner */}
          <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden border border-[#3a3528]/50 shadow-2xl bg-[#0d0b0f] min-h-[420px] sm:min-h-[420px] lg:min-h-[500px] flex items-center p-6 sm:p-12 lg:p-16 group">
            {/* Background image */}
            <Image
              src="/assets/newarrivalshero.jpeg"
              alt="New Arrivals Luxury Campaign"
              fill
              priority
              sizes="100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-102"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/55 to-transparent" />

            {/* Typography Overlay Content */}
            <div className="relative z-10 max-w-[280px] xs:max-w-xs sm:max-w-md md:max-w-xl space-y-3 sm:space-y-5 text-left">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#e5c982] font-semibold">
                NEW ARRIVALS
              </p>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-[#f3ebdb] leading-[1.05] font-normal">
                The Newest <br />
                <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#e5c982] via-[#f7e7be] to-[#c5a869]">
                  Expressions
                </span> <br />
                of Luxury
              </h1>

              {/* Diamond Hairline Divider */}
              <div className="flex items-center justify-start gap-2 sm:gap-4 py-0.5 sm:py-1">
                <span className="h-[1px] w-[20%] bg-gradient-to-r from-transparent to-[#c5a869]/70" />
                <span className="text-[#e5c982] text-xs">◇</span>
                <span className="h-[1px] w-[20%] bg-gradient-to-l from-transparent to-[#c5a869]/70" />
              </div>

              <p className="text-sm text-[#c2b8a3] leading-relaxed max-w-sm sm:max-w-md">
                Discover the latest arrivals from the world&apos;s most iconic fragrance houses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTAINER FOR FEATURE BAR, SIDEBAR & PRODUCTS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 w-full">

      {/* 2. EXACT FEATURE BADGES BAR (Directly below hero with the 4 exact icons) */}
      <section className="bg-[#120f14]/80 border border-[#3a3528]/50 rounded-2xl p-6 backdrop-blur-md shadow-xl w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#3a3528]/40">
          {/* Badge 1: Latest Releases (100% Scalloped Seal Icon) */}
          <div className="flex items-center gap-4 px-3 pt-3 sm:pt-0">
            <svg
              className="w-10 h-10 sm:w-11 sm:h-11 text-[#e5c982] shrink-0 drop-shadow-[0_2px_8px_rgba(229,201,130,0.3)]"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              <path
                d="M 16 3.5 C 17.5 3.5 18.2 4.8 19.5 5.2 C 20.8 5.6 22.1 4.9 23.2 5.8 C 24.3 6.7 24.5 8.1 25.4 9.2 C 26.3 10.3 27.7 11.0 27.9 12.4 C 28.1 13.8 27.4 15.0 27.4 16.5 C 27.4 18.0 28.1 19.2 27.9 20.6 C 27.7 22.0 26.3 22.7 25.4 23.8 C 24.5 24.9 24.3 26.3 23.2 27.2 C 22.1 28.1 20.8 27.4 19.5 27.8 C 18.2 28.2 17.5 29.5 16 29.5 C 14.5 29.5 13.8 28.2 12.5 27.8 C 11.2 27.4 9.9 28.1 8.8 27.2 C 7.7 26.3 7.5 24.9 6.6 23.8 C 5.7 22.7 4.3 22.0 4.1 20.6 C 3.9 19.2 4.6 18.0 4.6 16.5 C 4.6 15.0 3.9 13.8 4.1 12.4 C 4.3 11.0 5.7 10.3 6.6 9.2 C 7.5 8.1 7.7 6.7 8.8 5.8 C 9.9 4.9 11.2 5.6 12.5 5.2 C 13.8 4.8 14.5 3.5 16 3.5 Z"
                strokeLinejoin="round"
              />
              <text
                x="16"
                y="18.2"
                textAnchor="middle"
                fill="currentColor"
                fontSize="8.5"
                fontWeight="400"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="-0.02em"
                stroke="none"
              >
                100%
              </text>
            </svg>
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold tracking-[0.08em] text-[#f3ebdb]">
                Latest Releases
              </h4>
              <p className="text-[11px] text-[#a99e8a]">Fresh arrivals from top perfume houses.</p>
            </div>
          </div>

          {/* Badge 2: Best Prices (Price Tag) */}
          <div className="flex items-center gap-4 px-3 pt-3 sm:pt-0">
            <svg
              className="w-10 h-10 sm:w-11 sm:h-11 text-[#e5c982] shrink-0 drop-shadow-[0_2px_8px_rgba(229,201,130,0.3)]"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            >
              <path
                d="M7 16.5L16.5 7H25v8.5L15.5 25a2 2 0 0 1-2.8 0l-5.7-5.7a2 2 0 0 1 0-2.8z"
                strokeLinejoin="round"
              />
              <circle cx="20.5" cy="11.5" r="1.6" fill="currentColor" />
            </svg>
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold tracking-[0.08em] text-[#f3ebdb]">
                Best Prices
              </h4>
              <p className="text-[11px] text-[#a99e8a]">Competitive prices on luxury fragrances.</p>
            </div>
          </div>

          {/* Badge 3: 100% Authentic (Shield with Checkmark) */}
          <div className="flex items-center gap-4 px-3 pt-3 sm:pt-0">
            <svg
              className="w-10 h-10 sm:w-11 sm:h-11 text-[#e5c982] shrink-0 drop-shadow-[0_2px_8px_rgba(229,201,130,0.3)]"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            >
              <path
                d="M16 4L6 8.5v7.5c0 6.5 4.3 12.2 10 13.5 5.7-1.3 10-7 10-13.5V8.5L16 4z"
                strokeLinejoin="round"
              />
              <path
                d="M11.5 16l3 3 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold tracking-[0.08em] text-[#f3ebdb]">
                100% Authentic
              </h4>
              <p className="text-[11px] text-[#a99e8a]">Guaranteed original products.</p>
            </div>
          </div>

          {/* Badge 4: Fast Delivery (Truck with Motion Lines) */}
          <div className="flex items-center gap-4 px-3 pt-3 sm:pt-0">
            <svg
              className="w-11 h-11 sm:w-12 sm:h-12 text-[#e5c982] shrink-0 drop-shadow-[0_2px_8px_rgba(229,201,130,0.3)]"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            >
              <path d="M4 11h3M2 15h5M3 19h4" strokeLinecap="round" />
              <path d="M9 9h10v11H9V9z" />
              <path d="M19 12h4l3 3.5V20h-7v-8z" />
              <circle cx="12.5" cy="21.5" r="2" fill="none" stroke="currentColor" />
              <circle cx="22.5" cy="21.5" r="2" fill="none" stroke="currentColor" />
            </svg>
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold tracking-[0.08em] text-[#f3ebdb]">
                Fast Delivery
              </h4>
              <p className="text-[11px] text-[#a99e8a]">Quick &amp; secure delivery to your door.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE CATALOG MAIN SECTION (SIDEBAR + PRODUCT GRID) */}
      <div className="flex flex-col min-[992px]:flex-row gap-6 lg:gap-8 items-stretch min-[992px]:items-start w-full">
        {/* Left Filter Sidebar (Sleek side column on tablet and desktop screens) */}
        <aside className="hidden min-[992px]:block w-60 lg:w-64 shrink-0 bg-[#120f14]/70 border border-[#3a3528]/50 rounded-2xl p-4 sm:p-5 space-y-6 shadow-xl backdrop-blur-md sticky top-28">
          <div className="flex items-center justify-between border-b border-[#3a3528]/50 pb-3">
            <h3 className="flex items-center gap-2 font-serif text-sm uppercase tracking-[0.15em] text-[#f3ebdb] font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#e5c982]" strokeWidth={1.8} />
              FILTER BY
            </h3>
            <button
              onClick={handleClearAll}
              className="text-[11px] uppercase tracking-[0.15em] text-[#e5c982] hover:underline"
            >
              CLEAR ALL
            </button>
          </div>

          {/* GENDER */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-[#c2b8a3] font-semibold">
              GENDER
            </h4>
            <div className="space-y-2">
              {[
                { id: "all", label: "All" },
                { id: "women", label: "For Her" },
                { id: "men", label: "For Him" },
                { id: "unisex", label: "Unisex" },
              ].map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 cursor-pointer group text-xs text-[#a99e8a] hover:text-[#f3ebdb]"
                >
                  <input
                    type="radio"
                    name="genderFilter"
                    checked={selectedGender === item.id}
                    onChange={() => setSelectedGender(item.id)}
                    className="accent-[#c5a869] cursor-pointer"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* BRAND */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-[#c2b8a3] font-semibold">
              BRAND
            </h4>
            <input
              type="text"
              placeholder="Search brand..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full bg-black/40 border border-[#3a3528]/70 rounded-lg px-3 py-1.5 text-xs text-[#f3ebdb] placeholder-[#a99e8a]/50 focus:outline-none focus:border-[#c5a869]"
            />
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {filteredBrandsList.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-3 cursor-pointer group text-xs text-[#a99e8a] hover:text-[#f3ebdb]"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="accent-[#c5a869] rounded cursor-pointer"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* PRICE RANGE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] uppercase tracking-[0.2em] text-[#c2b8a3] font-semibold">
                PRICE RANGE
              </h4>
              <span className="text-xs text-[#e5c982] font-semibold">${priceMax}</span>
            </div>
            <input
              type="range"
              min="25"
              max="550"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[#c5a869] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#a99e8a]">
              <span>$25</span>
              <span>$550+</span>
            </div>
          </div>

          {/* CONCENTRATION */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-[#c2b8a3] font-semibold">
              CONCENTRATION
            </h4>
            <div className="space-y-2">
              {[
                { id: "EDT", label: "Eau de Toilette (EDT)" },
                { id: "EDP", label: "Eau de Parfum (EDP)" },
                { id: "Parfum", label: "Parfum / Extrait" },
              ].map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 cursor-pointer group text-xs text-[#a99e8a] hover:text-[#f3ebdb]"
                >
                  <input
                    type="checkbox"
                    checked={selectedConcentrations.includes(item.id)}
                    onChange={() => toggleConcentration(item.id)}
                    className="accent-[#c5a869] rounded cursor-pointer"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Products Main Area */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Header Toolbar */}
          <div className="flex flex-col gap-3 border-b border-[#3a3528]/50 pb-4 w-full">
            {/* Top Row: Gender Tabs on Left, SORT BY on Top Right */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 w-full flex-wrap">
              {/* Gender Filter Tabs */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {[
                  { id: "all", label: "ALL" },
                  { id: "women", label: "FOR HER" },
                  { id: "men", label: "FOR HIM" },
                  { id: "unisex", label: "UNISEX" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedGender(tab.id)}
                    className={`px-3 sm:px-4 py-1.5 max-[500px]:px-2.5 max-[500px]:py-1 rounded-full text-xs max-[500px]:text-[10px] font-medium tracking-[0.15em] max-[500px]:tracking-[0.08em] uppercase transition-all duration-300 ${
                      selectedGender === tab.id
                        ? "bg-[#e5c982] text-black font-semibold shadow-md"
                        : "bg-[#141217] text-[#c2b8a3] border border-[#3a3528]/60 hover:border-[#c5a869] hover:text-[#f3ebdb]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* SORT BY: Newest First (Upper Right) */}
              <div className="relative shrink-0 ml-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-[#141217] border border-[#3a3528]/60 text-xs max-[500px]:text-[10px] text-[#f3ebdb] rounded-lg pl-3 pr-8 max-[500px]:pl-2.5 max-[500px]:pr-7 py-1.5 max-[500px]:py-1 focus:outline-none focus:border-[#c5a869] cursor-pointer"
                >
                  <option value="newest">SORT BY: Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <svg className="pointer-events-none absolute right-2.5 max-[500px]:right-2 top-1/2 -translate-y-1/2 w-3 h-3 max-[500px]:w-2.5 max-[500px]:h-2.5 text-[#c5a869]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </div>
            </div>

            {/* Bottom Row: FILTER & SORT on Left, Count on Right */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#a99e8a] pt-1 w-full">
              {/* Mobile Filter & Sort Button (Bottom Left under Category Tabs) */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="min-[992px]:hidden flex items-center gap-2 max-[500px]:gap-1.5 px-3.5 sm:px-4 py-1.5 max-[500px]:px-2.5 max-[500px]:py-1 rounded-full bg-[#141217] text-[#e5c982] border border-[#c5a869]/60 text-xs max-[500px]:text-[10px] font-medium tracking-[0.15em] max-[500px]:tracking-[0.08em] uppercase hover:bg-[#c5a869]/10 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 max-[500px]:w-3 max-[500px]:h-3" />
                <span>FILTER &amp; SORT</span>
              </button>

              <span className="ml-auto">
                Showing 1–{filteredProducts.length} of {filteredProducts.length} new arrivals
              </span>
            </div>
          </div>

          {/* Product Grid with Interspersed Editorial Storytelling Banners */}
          <div className="catalog-product-grid gap-3 sm:gap-4 lg:gap-5 w-full">
            {filteredProducts.map((prod, index) => {
              const showAlchemyBanner = index === 4;
              const showConfidenceBanner = index === 8;
              const canonicalProduct = canonicalProductBySlug.get(prod.slug);
              const selectedSize = selectedSizes[prod.id] ?? prod.sizes[0];

              return (
                <React.Fragment key={prod.id}>
                  {/* Banner 1: The Alchemy of Scent (Upper editorial banner position) */}
                  {showAlchemyBanner && (
                    <div className="col-span-1 min-[480px]:col-span-2 relative rounded-2xl overflow-hidden border border-[#3a3528]/60 bg-[#141217] min-h-[240px] sm:min-h-[280px] flex items-center p-5 sm:p-8">
                      <Image
                        src="/assets/alchemy-banner.jpg"
                        alt="The Alchemy of Scent"
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
                      <div className="relative z-10 max-w-md space-y-3">
                        <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#e5c982] leading-snug font-medium drop-shadow-md">
                          THE ALCHEMY OF SCENT:{" "}
                          <span className="text-[#f3ebdb] block sm:inline">Crafting a Modern Masterpiece.</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-[#c2b8a3] leading-relaxed">
                          Sourced from the most precious natural harvests, resins, and botanicals.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Canonical products use the shared card, including real variant sizes and quick add. */}
                  {canonicalProduct ? (
                    <FragranceCard product={canonicalProduct} badge={prod.isNew ? "NEW" : undefined} />
                  ) : (
                  <div className="group relative flex flex-col justify-between bg-[#141217]/70 border border-[#3a3528]/50 hover:border-[#c5a869]/70 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
                    {/* Media Container */}
                    <div className="relative aspect-square w-full bg-[#0c0a0e] overflow-hidden">
                      <Image
                        src={prod.image}
                        alt={`${prod.brand} ${prod.name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141217] via-transparent to-transparent opacity-80" />

                      {/* NEW Badge */}
                      <span className="absolute top-2.5 left-2.5 bg-[#e5c982] text-black font-semibold text-[9.5px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full">
                        NEW
                      </span>

                      {/* Wishlist Icon */}
                      <button
                        type="button"
                        aria-label="Add to wishlist"
                        className="absolute top-2.5 right-2.5 grid h-9 w-9 place-items-center !rounded-none !border-0 !bg-transparent !shadow-none text-[#c2b8a3] transition-colors hover:!bg-transparent hover:text-[#e5c982]"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>

                      <Link
                        href={`/product/${prod.slug}`}
                        aria-label={`Choose a size for ${prod.name}`}
                        className="absolute bottom-2.5 right-2.5 z-10 grid h-9 w-9 place-items-center !rounded-none !border-0 !bg-transparent !shadow-none text-[#e5c982] transition-colors hover:!bg-transparent hover:text-[#fff3d1]"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      </Link>
                    </div>

                    {/* Card Content */}
                    <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between space-y-3">
                      <div className="space-y-1">
                        <p className="text-[9.5px] uppercase tracking-[0.25em] text-[#c5a869] font-medium">
                          {prod.brand}
                        </p>
                        <Link href={`/product/${prod.slug}`}>
                          <h3 className="font-serif text-sm sm:text-base text-[#f3ebdb] group-hover:text-[#e5c982] transition-colors line-clamp-1">
                            {prod.name}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-[#a99e8a] line-clamp-1">{prod.notes}</p>
                      </div>

                      {/* Price & Rating */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#3a3528]/40">
                        <span className="font-serif text-sm sm:text-base font-bold text-[#f3ebdb]">
                          {prod.priceFormatted}
                        </span>
                        <div className="flex items-center gap-1 text-[#e5c982] text-[10px]">
                          <span>★★★★★</span>
                          <span className="text-[#a99e8a] text-[9.5px]">({prod.reviewsCount})</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1" role="group" aria-label={`Available sizes for ${prod.name}`}>
                        {prod.sizes.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSizes((current) => ({ ...current, [prod.id]: size }))}
                            aria-pressed={selectedSize === size}
                            className={`rounded-md border px-2.5 py-1 text-[10.5px] tracking-wide transition-all ${
                              selectedSize === size
                                ? "border-[#c5a869] bg-[#c5a869] font-bold text-black shadow-[0_2px_8px_rgba(197,168,105,0.4)]"
                                : "border-[#3a3528]/80 bg-[#18151c] text-[#a99e8a] hover:border-[#c5a869]/60 hover:text-[#f3ebdb]"
                            }`}
                          >
                            {size.replace(/ml$/i, " ml")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Banner 2: Empowering Confidence (Rendered IMMEDIATELY AFTER Versace Eros so Hugo Boss and Versace sit side-by-side on 2-column grids and Banner 2 fills Cols 2 & 3 on 3-column grids) */}
                  {(prod.slug === "versace-eros-edp" || prod.brand.toUpperCase().includes("VERSACE") || index === 7) && (
                    <div className="col-span-1 min-[480px]:col-span-2 relative rounded-2xl overflow-hidden border border-[#3a3528]/60 bg-[#141217] min-h-[240px] sm:min-h-[260px] flex items-center p-5 sm:p-10">
                      <Image
                        src="/assets/empowering-banner.jpg"
                        alt="Empowering Confidence"
                        fill
                        sizes="(max-width: 1024px) 100vw, 75vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
                      <div className="relative z-10 max-w-md space-y-2">
                        <h3 className="font-serif text-xl sm:text-2xl lg:text-3xl text-[#e5c982] leading-tight">
                          EMPOWERING CONFIDENCE:{" "}
                          <span className="text-[#f3ebdb]">Forging Identity with every spray.</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-[#c2b8a3] leading-relaxed max-w-sm">
                          A signature fragrance crafted for charismatic presence and timeless allure.
                        </p>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ASSURANCE BAR */}
      <section className="border-t border-[#3a3528]/50 pt-8 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#e5c982] uppercase">
              FREE SHIPPING
            </p>
            <p className="text-[11px] text-[#a99e8a]">On all orders over $150</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#e5c982] uppercase">
              LUXURY PACKAGING
            </p>
            <p className="text-[11px] text-[#a99e8a]">Exquisite in every detail</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#e5c982] uppercase">
              AUTHENTICITY GUARANTEED
            </p>
            <p className="text-[11px] text-[#a99e8a]">100% original products</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#e5c982] uppercase">
              NEED HELP?
            </p>
            <p className="text-[11px] text-[#a99e8a]">Our fragrance specialists are here to help you.</p>
          </div>
        </div>
      </section>
      {/* Mobile Filter Drawer Overlay */}
      {mounted && isFilterDrawerOpen && createPortal(
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm touch-none"
            onClick={() => setIsFilterDrawerOpen(false)}
            onTouchMove={(e) => e.preventDefault()}
          />
          {/* Panel */}
          <div className="absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#0d0b0f] border-r border-t border-[#3a3528]/50 p-6 overflow-y-auto overscroll-contain flex flex-col justify-between space-y-6 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#3a3528]/50 pb-3">
                <h3 className="font-serif text-sm uppercase tracking-[0.15em] text-[#f3ebdb] font-medium">
                  FILTER BY
                </h3>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="text-[#a99e8a] hover:text-[#f3ebdb]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* GENDER */}
              <div className="space-y-3">
                <h4 className="text-[11px] uppercase tracking-[0.2em] text-[#c2b8a3] font-semibold">
                  GENDER
                </h4>
                <div className="space-y-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "women", label: "For Her" },
                    { id: "men", label: "For Him" },
                    { id: "unisex", label: "Unisex" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 cursor-pointer group text-xs text-[#a99e8a] hover:text-[#f3ebdb]"
                    >
                      <input
                        type="radio"
                        name="genderFilterMobile"
                        checked={selectedGender === item.id}
                        onChange={() => {
                          setSelectedGender(item.id);
                        }}
                        className="accent-[#c5a869] cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* BRAND */}
              <div className="space-y-3">
                <h4 className="text-[11px] uppercase tracking-[0.2em] text-[#c2b8a3] font-semibold">
                  BRAND
                </h4>
                <input
                  type="text"
                  placeholder="Search brand..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full bg-black/40 border border-[#3a3528]/70 rounded-lg px-3 py-1.5 text-xs text-[#f3ebdb] placeholder-[#a99e8a]/50 focus:outline-none focus:border-[#c5a869]"
                />
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {filteredBrandsList.map((brand) => (
                    <label
                      key={brand}
                      className="flex items-center gap-3 cursor-pointer group text-xs text-[#a99e8a] hover:text-[#f3ebdb]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        className="accent-[#c5a869] rounded cursor-pointer"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* PRICE RANGE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] uppercase tracking-[0.2em] text-[#c2b8a3] font-semibold">
                    PRICE RANGE
                  </h4>
                  <span className="text-xs text-[#e5c982] font-mono">
                    ${priceMax}
                  </span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="550"
                  step="5"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-[#c5a869] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-[#a99e8a]">
                  <span>$25</span>
                  <span>$550+</span>
                </div>
              </div>

              {/* CONCENTRATION */}
              <div className="space-y-3">
                <h4 className="text-[11px] uppercase tracking-[0.2em] text-[#c2b8a3] font-semibold">
                  CONCENTRATION
                </h4>
                <div className="space-y-2">
                  {[
                    { id: "EDT", label: "Eau de Toilette (EDT)" },
                    { id: "EDP", label: "Eau de Parfum (EDP)" },
                    { id: "Parfum", label: "Parfum / Extrait" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 cursor-pointer group text-xs text-[#a99e8a] hover:text-[#f3ebdb]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedConcentrations.includes(item.id)}
                        onChange={() => toggleConcentration(item.id)}
                        className="accent-[#c5a869] rounded cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#3a3528]/50 flex items-center justify-between gap-4">
              <button
                onClick={handleClearAll}
                className="w-1/2 py-2 text-xs uppercase tracking-[0.15em] border border-[#3a3528]/60 rounded-xl text-[#c2b8a3] hover:text-white"
              >
                Clear
              </button>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-1/2 py-2 text-xs uppercase tracking-[0.15em] bg-[#c5a869] text-black font-semibold rounded-xl hover:bg-[#ffdf78]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>
    </div>
  );
}
