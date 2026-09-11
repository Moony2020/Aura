import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FragranceCard } from "@/components/storefront/FragranceCard";
import { listPublishedFragrances } from "@/server/queries/list-published-fragrances";
import { LayoutGrid, ListFilter } from "lucide-react";

const campaigns = {
  women: {
    audience: "WOMEN" as const,
    title: "Women's Fragrances",
    subtitle: "Timeless elegance and delicate luxury crafted for her.",
  },
  men: {
    audience: "MEN" as const,
    title: "Men's Fragrances",
    subtitle: "Timeless scents for the modern man.",
  },
  unisex: {
    audience: "UNISEX" as const,
    title: "Unisex Fragrances",
    subtitle: "Transcending boundaries with pure olfactory art.",
  },
} as const;

type AudienceSlug = keyof typeof campaigns;

export const revalidate = 60;

export function generateStaticParams() {
  return [
    { audience: "women" },
    { audience: "men" },
    { audience: "unisex" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ audience: string }>;
}): Promise<Metadata> {
  const { audience } = await params;
  const campaign = campaigns[audience as AudienceSlug];
  return campaign
    ? {
        title: `${campaign.title} | AURA`,
        description: campaign.subtitle,
      }
    : { title: "Fragrances | AURA" };
}

async function AudienceProductsGrid({
  audience,
}: {
  audience: "WOMEN" | "MEN" | "UNISEX";
}) {
  const result = await listPublishedFragrances({ audience });

  if (result.error) {
    return (
      <div className="py-16 text-center text-[#a99e8a]">
        <p>{result.error.message}</p>
      </div>
    );
  }

  if (!result.products.length) {
    return (
      <div className="py-16 text-center text-[#a99e8a]">
        <p>No published fragrances found in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {result.products.map((product, idx) => {
        const badge =
          idx === 0
            ? "BESTSELLER"
            : idx === 2
            ? "NEW"
            : idx === 3
            ? "EXCLUSIVE"
            : undefined;
        const discountPercentage = idx === 1 ? 25 : idx === 4 ? 20 : idx === 6 ? 30 : undefined;

        return (
          <FragranceCard
            key={product.slug}
            product={product}
            badge={badge}
            discountPercentage={discountPercentage}
          />
        );
      })}
    </div>
  );
}

export default async function AudienceCampaignPage({
  params,
}: {
  params: Promise<{ audience: string }>;
}) {
  const { audience } = await params;
  const campaign = campaigns[audience as AudienceSlug];
  if (!campaign) notFound();

  return (
    <main className="min-h-screen bg-[#080809] text-[#f3ebdb] pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Category Header (Exact Image 3 match) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#3a3528]/50 pb-6">
          <div className="space-y-1">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#f3ebdb]">
              {campaign.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#a99e8a]">
              {campaign.subtitle}
            </p>
          </div>

          {/* Filter & View Controls */}
          <div className="flex items-center gap-4 text-xs text-[#a99e8a] self-start md:self-auto">
            <span>36 products</span>

            {/* Sort dropdown */}
            <div className="relative">
              <select className="bg-[#141217] border border-[#3a3528] rounded-lg px-3 py-1.5 text-xs text-[#f3ebdb] focus:border-[#c5a869] outline-none cursor-pointer">
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Best Rating</option>
              </select>
            </div>

            {/* Grid Toggle Buttons */}
            <div className="flex items-center gap-1 bg-[#141217] border border-[#3a3528] rounded-lg p-1">
              <button
                type="button"
                aria-label="Grid view"
                className="p-1 rounded bg-[#c5a869] text-black"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="List view"
                className="p-1 rounded text-[#a99e8a] hover:text-[#f3ebdb]"
              >
                <ListFilter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-96 rounded-2xl bg-[#141217] border border-[#3a3528]/40"
                />
              ))}
            </div>
          }
        >
          <AudienceProductsGrid audience={campaign.audience} />
        </Suspense>
      </div>
    </main>
  );
}
