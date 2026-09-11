"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import { minorUnitToMajorUnit } from "@/lib/money";
import type { CatalogActiveFilter, CatalogFacets, NormalizedCatalogQuery } from "@/server/queries/list-published-fragrances";

type CatalogFilterControlsProps = {
  query: NormalizedCatalogQuery;
  facets: CatalogFacets;
  activeFilters: CatalogActiveFilter[];
  resultCount: number;
};

const sortLabels = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price Low → High" },
  { value: "price-desc", label: "Price High → Low" },
  { value: "name-asc", label: "Name A → Z" },
] as const;

const money = (amount: number | null) => {
  const major = minorUnitToMajorUnit(amount);
  return major === null ? "" : String(major);
};

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
}

function appendIfPresent(params: URLSearchParams, key: string, value: FormDataEntryValue | null) {
  if (typeof value !== "string") return;
  const trimmed = value.trim();
  if (trimmed) params.set(key, trimmed);
}

export function CatalogFilterControls({ query, facets, activeFilters, resultCount }: CatalogFilterControlsProps) {
  const router = useRouter();
  const titleId = useId();
  const drawerTitleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    appendIfPresent(params, "audience", form.get("audience"));
    appendIfPresent(params, "family", form.get("family"));
    appendIfPresent(params, "minPrice", form.get("minPrice"));
    appendIfPresent(params, "maxPrice", form.get("maxPrice"));
    appendIfPresent(params, "availability", form.get("availability"));
    appendIfPresent(params, "concentration", form.get("concentration"));
    const sort = form.get("sort");
    if (typeof sort === "string" && sort && sort !== "featured") params.set("sort", sort);
    closeDrawer();
    router.push(params.toString() ? `/fragrances?${params}` : "/fragrances");
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const trigger = triggerRef.current;
    const previousScrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => focusableElements(drawerRef.current)[0]?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
      }
      if (event.key !== "Tab") return;
      const elements = focusableElements(drawerRef.current);
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.scrollTo(0, previousScrollY);
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [drawerOpen]);

  const formContent = (
    <>
      <fieldset>
        <legend>Audience</legend>
        <select name="audience" defaultValue={query.audienceParam ?? ""}>
          <option value="">All audiences</option>
          {facets.audiences.map((option) => (
            <option value={option.value} key={option.value}>{option.label} ({option.count})</option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend>Family</legend>
        <select name="family" defaultValue={query.family ?? ""}>
          <option value="">All families</option>
          {facets.families.map((option) => (
            <option value={option.value} key={option.value}>{option.label} ({option.count})</option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend>Price</legend>
        <div className="catalog-filter-price">
          <label>
            <span>Min</span>
            <input name="minPrice" type="number" min="0" step="0.01" defaultValue={money(query.minPrice)} placeholder={money(facets.price.min) || "0"} />
          </label>
          <label>
            <span>Max</span>
            <input name="maxPrice" type="number" min="0" step="0.01" defaultValue={money(query.maxPrice)} placeholder={money(facets.price.max) || "500"} />
          </label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Availability</legend>
        <select name="availability" defaultValue={query.availability ?? ""}>
          <option value="">Any availability</option>
          {facets.availability.map((option) => (
            <option value={option.value} key={option.value}>{option.label} ({option.count})</option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend>Concentration</legend>
        <select name="concentration" defaultValue={query.concentration ?? ""}>
          <option value="">Any concentration</option>
          {facets.concentrations.map((option) => (
            <option value={option.value} key={option.value}>{option.label} ({option.count})</option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend>Sort</legend>
        <select name="sort" defaultValue={query.sort}>
          {sortLabels.map((option) => (
            <option value={option.value} key={option.value}>{option.label}</option>
          ))}
        </select>
      </fieldset>
    </>
  );

  return (
    <div className="catalog-filters" aria-labelledby={titleId}>
      <div className="catalog-filters__topline">
        <div>
          <p className="fragrance-catalog-eyebrow">Refine the collection</p>
          <h2 id={titleId}>{resultCount} fragrance{resultCount === 1 ? "" : "s"}</h2>
        </div>
        <button type="button" className="catalog-filters__mobile-trigger" onClick={() => setDrawerOpen(true)} ref={triggerRef}>
          <SlidersHorizontal aria-hidden="true" /> Filter & Sort
        </button>
      </div>

      {activeFilters.length > 0 && (
        <div className="catalog-active-filters" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <Link href={filter.href} key={`${filter.key}-${filter.label}`}>{filter.label} <span aria-hidden="true">×</span></Link>
          ))}
          <Link href="/fragrances" className="catalog-active-filters__clear">Clear all</Link>
        </div>
      )}

      <form className="catalog-filter-bar" action="/fragrances" method="get" onSubmit={submitFilters}>
        {formContent}
        <div className="catalog-filter-bar__actions">
          <button type="submit">Apply</button>
          <Link href="/fragrances">Clear all</Link>
        </div>
      </form>

      {drawerOpen && (
        <div className="catalog-filter-drawer" role="dialog" aria-modal="true" aria-labelledby={drawerTitleId} ref={drawerRef}>
          <button type="button" className="catalog-filter-drawer__backdrop" onClick={closeDrawer} aria-label="Close filters" />
          <form className="catalog-filter-drawer__panel" action="/fragrances" method="get" onSubmit={submitFilters}>
            <div className="catalog-filter-drawer__header">
              <h2 id={drawerTitleId}>Filter & Sort</h2>
              <button type="button" onClick={closeDrawer} aria-label="Close filters"><X aria-hidden="true" /></button>
            </div>
            {formContent}
            <div className="catalog-filter-drawer__actions">
              <Link href="/fragrances" onClick={closeDrawer}>Clear all</Link>
              <button type="submit">Apply</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
