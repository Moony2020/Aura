"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductDetailMedia } from "@/server/queries/get-published-product-detail";

interface GalleryItem {
  id: string;
  kind: "IMAGE" | "VIDEO";
  url: string;
  posterUrl?: string;
  alt: string;
  label?: string;
}

function buildGalleryPerspectives(media: ProductDetailMedia[], productName: string): GalleryItem[] {
  if (!media.length) {
    return [
      {
        id: "default-1",
        kind: "IMAGE",
        url: "/assets/prod-bleu-chanel.jpg",
        alt: productName,
        label: "Signature Flacon",
      },
    ];
  }

  const primary = media[0];
  const primaryUrl = (primary.kind === "VIDEO" ? primary.posterUrl : primary.url) || primary.url;

  if (media.length >= 3) {
    return media.map((item, idx) => ({
      id: item.id || `media-${idx}`,
      kind: item.kind,
      url: item.url,
      posterUrl: item.posterUrl,
      alt: item.alt || `${productName} — View ${idx + 1}`,
      label: idx === 0 ? "Full Bottle" : idx === 1 ? "Presentation Box" : idx === 2 ? "Detail" : "Olfactory",
    }));
  }

  return [
    {
      id: "view-1-bottle",
      kind: primary.kind,
      url: primary.url,
      posterUrl: primary.posterUrl,
      alt: `${productName} — Bottle`,
      label: "Bottle",
    },
    {
      id: "view-2-packaging",
      kind: "IMAGE",
      url: primaryUrl,
      alt: `${productName} — Presentation Box`,
      label: "Box",
    },
    {
      id: "view-3-detail",
      kind: "IMAGE",
      url: primaryUrl,
      alt: `${productName} — Craftsmanship Detail`,
      label: "Detail",
    },
    {
      id: "view-4-notes",
      kind: "IMAGE",
      url: primaryUrl,
      alt: `${productName} — Olfactory Mood`,
      label: "Atmosphere",
    },
  ];
}

export function ProductGallery({
  media,
  name,
}: {
  media: ProductDetailMedia[];
  name: string;
}) {
  const items = buildGalleryPerspectives(media, name);
  const [selected, setSelected] = useState(0);

  const prev = useCallback(() => {
    setSelected((curr) => (curr > 0 ? curr - 1 : items.length - 1));
  }, [items.length]);

  const next = useCallback(() => {
    setSelected((curr) => (curr < items.length - 1 ? curr + 1 : 0));
  }, [items.length]);

  const activeAsset = items[selected] ?? items[0];

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full items-start">
      {/* Left Vertical Thumbnails Column */}
      {items.length > 1 && (
        <div className="flex sm:flex-col gap-3 order-2 sm:order-1 overflow-x-auto sm:overflow-y-auto max-h-[600px] shrink-0 pb-2 sm:pb-0">
          {items.map((item, idx) => {
            const isSelected = selected === idx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(idx)}
                aria-pressed={isSelected}
                aria-label={`View ${item.label ?? `image ${idx + 1}`}`}
                className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border transition-all shrink-0 cursor-pointer bg-[#141217] ${
                  isSelected
                    ? "border-[#c5a869] ring-2 ring-[#c5a869]/30"
                    : "border-[#3a3528]/60 hover:border-[#c5a869]/50 opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={item.url}
                  alt={item.alt}
                  fill
                  sizes="100px"
                  className="object-cover"
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Center Large Full-Width Main Display Stage */}
      <div className="relative flex-1 order-1 sm:order-2 w-full flex flex-col items-center">
        <div className="relative w-full aspect-[4/4.8] sm:aspect-[4/4.5] bg-[#0c0a0e] rounded-2xl border border-[#3a3528]/60 flex items-center justify-center overflow-hidden shadow-2xl">
          <Image
            src={activeAsset.url}
            alt={activeAsset.alt || name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-cover transition-all duration-300"
            unoptimized
          />

          {/* Left Chevron Button */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-[#3a3528] text-[#f3ebdb] hover:text-[#e5c982] hover:border-[#c5a869] flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right Chevron Button */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-[#3a3528] text-[#f3ebdb] hover:text-[#e5c982] hover:border-[#c5a869] flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Pagination Dots */}
        {items.length > 1 && (
          <div className="flex items-center gap-2 mt-4">
            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  selected === idx ? "w-6 bg-[#c5a869]" : "w-1.5 bg-[#3a3528] hover:bg-[#a99e8a]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
