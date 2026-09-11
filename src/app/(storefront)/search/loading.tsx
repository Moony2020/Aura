import { StorefrontContainer } from "@/components/storefront/StorefrontContainer";

export default function SearchLoading() {
  return (
    <div className="search-page search-page--loading" aria-busy="true" aria-label="Loading search results">
      <section className="search-page__hero" aria-hidden="true">
        <StorefrontContainer>
          <p className="fragrance-catalog-eyebrow">Search AURA</p>
          <h1>Preparing your results</h1>
          <p className="search-page-loading__line" />
          <div className="search-page-loading__form" />
        </StorefrontContainer>
      </section>
      <section className="search-page__results" aria-hidden="true">
        <StorefrontContainer>
          <div className="fragrance-catalog-list__heading">
            <p className="fragrance-catalog-eyebrow">Published fragrances only</p>
          </div>
          <div className="search-page-loading__grid">
            <div className="search-page-loading__card" />
            <div className="search-page-loading__card" />
          </div>
        </StorefrontContainer>
      </section>
    </div>
  );
}
