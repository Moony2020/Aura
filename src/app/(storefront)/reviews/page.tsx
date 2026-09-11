import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, Star } from "lucide-react";
import { StorefrontReviewsSection } from "@/components/storefront/StorefrontReviewsSection";

export const metadata: Metadata = {
  title: "Client Reviews | AURA Haute Parfumerie",
  description: "Read verified client reviews, ratings, and scent memories from AURA Haute Parfumerie.",
};

export default function ReviewsPage() {
  return (
    <main className="min-h-screen bg-[#080809] px-5 pb-20 pt-4 sm:pt-6 text-[#f3ebdb] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e5c982] transition-colors hover:text-[#fff2cf]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Return to Maison
          </Link>
        </div>

        {/* Clean Luxury Header (Removed old 'Notes from the Maison' box & tightened spacing) */}
        <header className="mb-8 border-b border-[#e5c982]/20 pb-6">
          <div className="flex items-center gap-2 text-[#d8b93f]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#e5c982]">
              The AURA Experience · Verified Reviews
            </p>
          </div>
          <h1 className="mt-2 font-serif-luxury text-3xl font-light tracking-tight text-[#fff5e8] sm:text-4xl lg:text-5xl">
            What our clients say
          </h1>
          <p className="mt-2 max-w-2xl text-xs text-[#a99b86] sm:text-sm">
            Authentic reviews and testimonials from verified AURA clients.
          </p>
        </header>

        {/* Reviews Section with rating summary & verified review list */}
        <StorefrontReviewsSection />
      </div>
    </main>
  );
}
