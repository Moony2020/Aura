import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { formatMinorUnitMoney } from "@/lib/money";
import { StorefrontContainer } from "@/components/storefront/StorefrontContainer";
import { SEARCH_QUERY_MAX_LENGTH, searchPublishedFragrances } from "@/server/queries/search-published-fragrances";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search AURA",
  description: "Search AURA fragrances by name, collection, family, notes, ingredients and accords.",
};

type SearchPageProps = {
  searchParams?: Promise<{ q?: string | string[] }>;
};

function normalizeSearchParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim().slice(0, SEARCH_QUERY_MAX_LENGTH);
}

function formatPrice(price: Awaited<ReturnType<typeof searchPublishedFragrances>>["results"][number]["price"]) {
  const amount = formatMinorUnitMoney(price);
  return `${price.isFrom ? "From " : ""}${amount}`;
}

function audienceLabel(audience: Awaited<ReturnType<typeof searchPublishedFragrances>>["results"][number]["audience"]) {
  if (!audience) return null;
  return audience[0] + audience.slice(1).toLowerCase();
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = normalizeSearchParam(params?.q);
  const result = await searchPublishedFragrances(query);

  return (
    <div className="search-page">
      <section className="search-page__hero" aria-labelledby="search-page-title">
        <StorefrontContainer>
          <p className="fragrance-catalog-eyebrow">Search AURA</p>
          <h1 id="search-page-title">{query ? `Results for “${query}”` : "Search the Maison"}</h1>
          <p>Find fragrances by name, notes, ingredients, accords, audience, family or collection.</p>
          <form className="search-page__form" action="/search">
            <label htmlFor="search-page-query">Search fragrances, notes or collections</label>
            <input id="search-page-query" name="q" defaultValue={query} maxLength={SEARCH_QUERY_MAX_LENGTH} placeholder="Rose, oud, musk, Élixir..." />
            <button type="submit">Search <span aria-hidden="true">→</span></button>
          </form>
          <Link className="search-page__return" href="/">
            Return to Maison <span aria-hidden="true">→</span>
          </Link>
        </StorefrontContainer>
      </section>

      <section className="search-page__results" aria-labelledby="search-results-title">
        <StorefrontContainer>
          <div className="fragrance-catalog-list__heading">
            <p className="fragrance-catalog-eyebrow">Published fragrances only</p>
            <h2 id="search-results-title">{result.results.length ? `${result.results.length} result${result.results.length === 1 ? "" : "s"}` : "No matching published fragrances"}</h2>
          </div>
          {result.error ? (
            <div className="fragrance-catalog-state" role="alert">
              <p>Search is unavailable at this moment.</p>
              <span>{result.error.message}</span>
            </div>
          ) : !query ? (
            <div className="fragrance-catalog-state">
              <p>Enter a fragrance, note or collection to begin.</p>
              <Link href="/fragrances">Browse all fragrances</Link>
            </div>
          ) : result.results.length === 0 ? (
            <div className="fragrance-catalog-state">
              <p>No published fragrances matched “{query}”.</p>
              <Link href="/fragrances">Browse all fragrances</Link>
            </div>
          ) : (
            <div className="search-page-results-grid">
              {result.results.map((item) => (
                <Link className="search-page-result-card" href={`/product/${item.slug}`} key={item.slug}>
                  <span className="search-page-result-card__media">
                    {item.thumbnail ? (
                      <Image src={item.thumbnail.posterUrl ?? item.thumbnail.url} alt={item.thumbnail.alt} fill sizes="(max-width: 760px) 100vw, 28vw" unoptimized />
                    ) : (
                      <span aria-hidden="true">AURA</span>
                    )}
                  </span>
                  <span className="search-page-result-card__body">
                    <span className="fragrance-catalog-eyebrow">{item.collection ?? item.match.label}</span>
                    <strong>{item.name}</strong>
                    <small>{[audienceLabel(item.audience), item.family].filter(Boolean).join(" · ") || "Signature composition"}</small>
                    <span title={item.price.isFrom ? "Starting price across available sizes" : undefined}>
                      {formatPrice(item.price)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </StorefrontContainer>
      </section>
    </div>
  );
}
