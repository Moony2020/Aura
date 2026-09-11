"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, FlaskConical, ShieldCheck, Star, ThumbsUp } from "lucide-react";
import { maisonReviews } from "./maison-reviews-data";

export function StorefrontReviewsSection() {
  const [activeTab, setActiveTab] = useState<"all" | "product" | "company">("all");
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});

  const filteredReviews = maisonReviews.filter((review) => {
    if (activeTab === "all") return true;
    return review.category === activeTab;
  });

  const handleHelpful = (id: string, currentHelpful: number = 0) => {
    if (votedIds[id]) return;
    setVotedIds((prev) => ({ ...prev, [id]: true }));
    setHelpfulVotes((prev) => ({ ...prev, [id]: (prev[id] ?? currentHelpful) + 1 }));
  };

  const productCount = maisonReviews.filter((r) => r.category === "product").length;
  const companyCount = maisonReviews.filter((r) => r.category === "company").length;

  return (
    <div className="space-y-8">
      {/* Aggregate Rating & Verification Summary */}
      <section aria-label="Rating Overview" className="border border-[#e5c982]/20 bg-[#120f13]/90 p-6 sm:p-8 backdrop-blur-xl">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left: Overall Score */}
          <div className="flex flex-col items-start gap-3 border-b border-[#e5c982]/15 pb-6 lg:col-span-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <div className="flex items-baseline gap-3">
              <span className="font-serif-luxury text-5xl font-light text-[#fff5e8] sm:text-6xl">4.9</span>
              <span className="text-sm font-semibold uppercase tracking-widest text-[#e5c982]">/ 5.0</span>
            </div>
            <div className="flex gap-1 text-[#d8b93f]" aria-label="4.9 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current text-[#d8b93f]" />
              ))}
            </div>
            <p className="text-xs text-[#c8bca8]">Based on 2,731 verified client reviews</p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#7ad4a0]">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified customer satisfaction (Trust-certified)</span>
            </div>
          </div>

          {/* Middle: Star breakdown bars */}
          <div className="space-y-2 lg:col-span-5 lg:px-4">
            {[
              { stars: 5, pct: "94%" },
              { stars: 4, pct: "5%" },
              { stars: 3, pct: "1%" },
              { stars: 2, pct: "0%" },
              { stars: 1, pct: "0%" },
            ].map(({ stars, pct }) => (
              <div key={stars} className="flex items-center gap-3 text-xs text-[#a99b86]">
                <span className="w-8 font-medium text-[#f3ebdb]">{stars} ★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#241f28]">
                  <div className="h-full rounded-full bg-[#d8b93f]" style={{ width: pct }} />
                </div>
                <span className="w-10 text-right">{pct}</span>
              </div>
            ))}
          </div>

          {/* Right: Quick highlight stats */}
          <div className="flex flex-col gap-3 rounded-lg border border-[#e5c982]/15 bg-[#17131b]/70 p-4 text-xs lg:col-span-3">
            <div className="flex items-center justify-between text-[#c8bca8]">
              <span>Longevity:</span>
              <span className="font-semibold text-[#f2dfaa]">98% Excellent</span>
            </div>
            <div className="flex items-center justify-between text-[#c8bca8]">
              <span>Packaging & Delivery:</span>
              <span className="font-semibold text-[#f2dfaa]">99% Luxury</span>
            </div>
            <div className="flex items-center justify-between text-[#c8bca8]">
              <span>Returning Clients:</span>
              <span className="font-semibold text-[#f2dfaa]">91%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5c982]/20 pb-3">
        <div className="flex gap-2">
          {[
            { key: "all" as const, label: `All reviews (${maisonReviews.length})` },
            { key: "product" as const, label: `Fragrances & Products (${productCount})` },
            { key: "company" as const, label: `Experience & Delivery (${companyCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-sm px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === key
                  ? "bg-[#d8b93f] text-[#0b090a]"
                  : "border border-[#e5c982]/20 text-[#c8bca8] hover:border-[#e5c982]/50 hover:text-[#fff5e8]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#a99b86]">Showing {filteredReviews.length} verified reviews</p>
      </div>

      {/* Review Cards List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => {
          const helpfulCount = helpfulVotes[review.id] ?? (review.helpfulCount || 12);
          const isVoted = votedIds[review.id] ?? false;

          return (
            <article
              key={review.id}
              className="rounded-lg border border-[#e5c982]/20 bg-[#120f14]/90 p-5 sm:p-6 transition-colors hover:border-[#e5c982]/45 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* User Info & Avatar */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e5c982]/40 bg-[#1e1823] font-serif-luxury text-sm font-semibold text-[#e5c982]">
                    {review.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#fff5e8]">{review.author}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#18271e] px-2 py-0.5 text-[10px] font-medium text-[#7ad4a0]">
                        <CheckCircle2 className="h-3 w-3 text-[#7ad4a0]" />
                        Verified purchase
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[#a99b86]">
                      <span>{review.location}</span>
                      <span>·</span>
                      <span>{review.date}</span>
                    </div>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-1 text-[#d8b93f]" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current text-[#d8b93f]" />
                  ))}
                </div>
              </div>

              {/* Product Reference Pill */}
              <div className="mt-4 inline-flex items-center gap-2 rounded border border-[#e5c982]/25 bg-[#1b1520]/80 px-3 py-1.5 text-xs text-[#e5c982]">
                <FlaskConical className="h-3.5 w-3.5 text-[#d8b93f]" />
                <span className="font-semibold text-[#fff5e8]">{review.fragrance}</span>
                {review.volumeOrType && <span className="text-[#a99b86]">({review.volumeOrType})</span>}
                {review.fragranceSlug && (
                  <Link
                    href={`/product/${review.fragranceSlug}`}
                    className="ml-2 text-[10px] uppercase tracking-wider text-[#d8b93f] underline hover:text-[#fff5e8]"
                  >
                    View fragrance →
                  </Link>
                )}
              </div>

              {/* Review Headline & Body */}
              <h3 className="mt-3 font-serif-luxury text-xl font-normal leading-snug text-[#fff5e8]">
                {review.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#c8bca8]">
                {review.body}
              </p>

              {/* Footer: Scent Notes & Helpful Action */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5c982]/15 pt-3 text-xs text-[#a99b86]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#d8b93f]">Notes:</span>
                  <span className="text-[#c8bca8]">{review.note}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleHelpful(review.id, review.helpfulCount)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                    isVoted
                      ? "border-[#d8b93f] bg-[#d8b93f]/20 text-[#f2dfaa]"
                      : "border-[#e5c982]/20 text-[#a99b86] hover:border-[#e5c982]/50 hover:text-[#fff5e8]"
                  }`}
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span>Helpful ({helpfulCount})</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
