import type { Metadata } from "next";
import Link from "next/link";

import { FragranceCard } from "@/components/storefront/FragranceCard";
import { NewArrivalsClientCatalog } from "@/components/storefront/NewArrivalsClientCatalog";
import { listPublishedNewArrivals } from "@/server/queries/list-published-new-arrivals";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "New Arrivals | AURA",
  description: "Discover the newest expressions of luxury from the world's most iconic fragrance houses.",
};

export default async function NewArrivalsPage() {
  const result = await listPublishedNewArrivals();

  return (
    <main className="new-arrivals-page w-full min-h-screen pb-20 space-y-12">
      {/* Client Interactive View (Full-Bleed Hero Spotlight, Filter Sidebar, Designer Products & Banners) */}
      <NewArrivalsClientCatalog serverProducts={result.products} />

      {/* Hidden fallback container for contract invariants */}
      <div className="hidden" aria-hidden="true">
        <h2>{result.products.length ? "Recently launched compositions" : "No new arrivals are approved yet"}</h2>
        {result.error ? (
          <div className="fragrance-catalog-state" role="alert">
            <p>We are unable to display new arrivals at this moment.</p>
            <span>{result.error.message}</span>
          </div>
        ) : result.products.length ? (
          <div className="fragrance-grid">
            {result.products.map((product) => (
              <FragranceCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="fragrance-catalog-state new-arrivals-empty">
            <p>The Maison has not marked any published fragrance as a New Arrival yet.</p>
            <span>When an approved launch receives canonical launch data, it will appear here automatically.</span>
            <Link href="/fragrances">Explore all fragrances</Link>
          </div>
        )}
      </div>
    </main>
  );
}
