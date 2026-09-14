"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { maisonReviews } from "./maison-reviews-data";

export function MaisonReviewsCarousel() {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const totalReviews = maisonReviews.length;

  const scrollToIndex = (index: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const targetCard = rail.children[index] as HTMLElement | undefined;
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      setActiveIndex(index);
    }
  };

  const scrollReviews = (direction: 1 | -1) => {
    const nextIndex = Math.max(0, Math.min(totalReviews - 1, activeIndex + direction));
    scrollToIndex(nextIndex);
  };

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const handleScroll = () => {
      const scrollLeft = rail.scrollLeft;
      const cardWidth = (rail.children[0] as HTMLElement)?.offsetWidth || 300;
      const index = Math.round(scrollLeft / (cardWidth + 16));
      setActiveIndex(Math.max(0, Math.min(totalReviews - 1, index)));
    };

    rail.addEventListener("scroll", handleScroll, { passive: true });
    return () => rail.removeEventListener("scroll", handleScroll);
  }, [totalReviews]);

  return (
    <section id="reviews" aria-labelledby="maison-reviews-title" className="relative overflow-hidden border-y border-[#e5c982]/15 bg-[#0b090a]">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_0%,rgba(160,109,48,0.18),transparent_45%),radial-gradient(ellipse_at_82%_100%,rgba(229,201,130,0.09),transparent_38%)]" />
      <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-18 lg:px-12">
        {/* Header */}
        <div className="flex flex-col items-center border-b border-[#e5c982]/20 pb-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#e5c982]">The AURA experience</p>
          <h2 id="maison-reviews-title" className="mt-3 font-serif-luxury text-4xl font-light tracking-wide text-[#fff5e8] sm:text-5xl">What our clients say</h2>
          <div className="mt-4 flex items-center gap-2 text-[#e5c982]" aria-label="4.9 out of 5 stars">
            <div className="flex gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-3.5 w-3.5 fill-current" />)}
            </div>
            <span className="text-xs font-semibold text-[#f3ebdb]">4.9</span>
            <span className="text-xs text-[#a99b86]">· Based on 2,731 verified reviews</span>
          </div>
          <Link href="/reviews" className="group mt-4 inline-flex w-fit items-center gap-2 border-b border-[#e5c982]/60 pb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f2dfaa] transition-colors hover:border-[#fff2cf] hover:text-[#fff2cf]">
            Read all reviews
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        {/* Cards Rail */}
        <div ref={railRef} className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Client reviews">
          {maisonReviews.map((review) => (
            <article
              key={review.id}
              className="shrink-0 snap-start basis-[86%] border border-[#e5c982]/20 bg-[#14100f]/90 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.2)] transition-colors hover:border-[#e5c982]/55 sm:basis-[calc(50%-0.5rem)] lg:basis-[calc((100%-2rem)/3)]"
            >
              {/* Quote icon + stars in one row */}
              <div className="flex items-center justify-between">
                <Quote className="h-5 w-5 text-[#e5c982]/80" aria-hidden="true" />
                <div className="flex gap-0.5 text-[#e5c982]" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <Star key={index} className="h-3 w-3 fill-current" aria-hidden="true" />
                  ))}
                </div>
              </div>

              <h3 className="mt-3 font-serif-luxury text-lg leading-snug text-[#fff5e8]">{review.title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#c8bca8] line-clamp-3">{review.body}</p>

              <div className="mt-4 border-t border-[#e5c982]/15 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e5c982]">{review.fragrance}</p>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#a99b86]">
                  <div className="flex items-center gap-1.5">
                    <span>{review.author} · {review.location}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#7ad4a0]">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    Verified
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Centered navigation arrows only — no dots */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollReviews(-1)}
            disabled={activeIndex === 0}
            aria-label="Show previous reviews"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#e5c982]/35 text-[#f2dfaa] transition-colors hover:border-[#e5c982] hover:bg-[#e5c982] hover:text-[#0b090a] disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollReviews(1)}
            disabled={activeIndex >= totalReviews - 1}
            aria-label="Show next reviews"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#e5c982]/35 text-[#f2dfaa] transition-colors hover:border-[#e5c982] hover:bg-[#e5c982] hover:text-[#0b090a] disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
