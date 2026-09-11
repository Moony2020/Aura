import type { Metadata } from "next";
import Image from "next/image";
import { StorefrontContainer } from "@/components/storefront/StorefrontContainer";
import { FragranceCard } from "@/components/storefront/FragranceCard";
import { CatalogFilterControls } from "@/components/storefront/CatalogFilterControls";
import { listPublishedFragrances } from "@/server/queries/list-published-fragrances";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fragrances",
  description: "Discover the AURA fragrance collection, composed as an olfactory journey through light, shadow and memory.",
};

type FragrancesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FragrancesPage({ searchParams }: FragrancesPageProps) {
  const params = await searchParams;
  const result = await listPublishedFragrances({
    audience: params?.audience,
    family: params?.family,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    availability: params?.availability,
    concentration: params?.concentration,
    sort: params?.sort,
  });
  const heroProducts = result.products.filter((product) => product.media).slice(0, 3);
  return (
    <div className="fragrance-catalog-page">
      <section className="fragrance-catalog-hero" aria-labelledby="fragrance-catalog-title">
        <StorefrontContainer>
          <div className="fragrance-catalog-hero__layout">
            <div className="fragrance-catalog-hero__copy">
              <p className="fragrance-catalog-hero__eyebrow">The fragrance collection</p>
              <h1 id="fragrance-catalog-title">An olfactory journey through light, shadow and memory.</h1>
              <p className="fragrance-catalog-hero__intro">Compositions crafted for the moments that become part of you.</p>
            </div>
            <figure className="fragrance-catalog-hero__media" aria-label="Selected AURA fragrance compositions">
              {heroProducts.length ? heroProducts.map((product, index) => product.media && (
                <div className={`fragrance-catalog-hero__tile fragrance-catalog-hero__tile--${index + 1}`} key={product.slug}>
                  <Image src={product.media.posterUrl ?? product.media.url} alt={product.media.alt || `${product.name} fragrance bottle`} fill priority={index === 0} sizes="(max-width: 800px) 100vw, 42vw" unoptimized />
                  <span>{product.name}</span>
                </div>
              )) : <div className="fragrance-catalog-hero__fallback"><span>AURA</span><small>THE MAISON</small></div>}
            </figure>
          </div>
        </StorefrontContainer>
      </section>
      <section className="fragrance-catalog-list" aria-labelledby="fragrance-catalog-list-title">
        <StorefrontContainer>
          <div className="fragrance-catalog-list__heading"><p className="fragrance-catalog-hero__eyebrow">Discover the collection</p><h2 id="fragrance-catalog-list-title">Signature scents, composed by AURA.</h2></div>
          <CatalogFilterControls query={result.query} facets={result.facets} activeFilters={result.activeFilters} resultCount={result.products.length} />
          {result.error ? (
            <div className="fragrance-catalog-state" role="alert">
              <p>We are unable to apply those filters.</p>
              <span>{result.error.message}</span>
            </div>
          ) : result.products.length === 0 ? (
            <div className="fragrance-catalog-state">
              <p>No published fragrances match these filters.</p>
              <span>Clear the active filters or explore the full AURA collection.</span>
            </div>
          ) : (
            <div className="fragrance-grid">{result.products.map((product) => <FragranceCard key={product.slug} product={product} />)}</div>
          )}
        </StorefrontContainer>
      </section>
    </div>
  );
}
