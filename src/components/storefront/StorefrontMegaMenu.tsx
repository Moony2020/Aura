"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import {
  collectionsMegaMenuEditorial,
  fragranceAudienceNavigation,
  fragranceMegaMenuGroups,
} from "@/config/storefront-navigation";

type MenuKey = "fragrances" | "collections";
type CollectionSummary = { slug: string; name: string };

function PlannedItem({ children }: { children: string }) {
  return (
    <span className="storefront-mega-item storefront-mega-item--planned" aria-disabled="true">
      {children}
    </span>
  );
}

function generateMegaMenuPath(W: number, H: number, x: number, w: number) {
  const R = 20; // Card corner radius
  const h = 34; // Notch height
  const rf = 12; // Concave fillet radius
  const rt = 10; // Convex tab top corner radius

  const tabPaddingX = 16;
  const tabLeft = Math.max(R + rf, x - tabPaddingX);
  const tabRight = Math.min(W - R - rf, x + w + tabPaddingX);

  return [
    `M ${R} 0`,
    `L ${tabLeft - rf} 0`,
    `A ${rf} ${rf} 0 0 0 ${tabLeft} ${-rf}`,
    `L ${tabLeft} ${-h + rt}`,
    `A ${rt} ${rt} 0 0 1 ${tabLeft + rt} ${-h}`,
    `L ${tabRight - rt} ${-h}`,
    `A ${rt} ${rt} 0 0 1 ${tabRight} ${-h + rt}`,
    `L ${tabRight} ${-rf}`,
    `A ${rf} ${rf} 0 0 0 ${tabRight + rf} 0`,
    `L ${W - R} 0`,
    `A ${R} ${R} 0 0 1 ${W} ${R}`,
    `L ${W} ${H - R}`,
    `A ${R} ${R} 0 0 1 ${W - R} ${H}`,
    `L ${R} ${H}`,
    `A ${R} ${R} 0 0 1 0 ${H - R}`,
    `L 0 ${R}`,
    `A ${R} ${R} 0 0 1 ${R} 0`,
    `Z`
  ].join(" ");
}

export function StorefrontMegaMenu({ collections }: { collections: CollectionSummary[] }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [tabMetrics, setTabMetrics] = useState({ x: 44, w: 120 });
  const [panelDims, setPanelDims] = useState({ width: 832, height: 460 });
  const closeTimerRef = useRef<number | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<MenuKey, HTMLButtonElement | null>>({ fragrances: null, collections: null });
  const isFragrancesActive = pathname === "/fragrances" || pathname.startsWith("/fragrances/");
  const isCollectionsActive = pathname === "/collections" || pathname.startsWith("/collections/");

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const updateMetrics = () => {
      const triggerEl = triggerRefs.current[openMenu];
      const panelEl = panelRef.current;
      if (triggerEl && panelEl) {
        const triggerRect = triggerEl.getBoundingClientRect();
        const panelRect = panelEl.getBoundingClientRect();
        const x = Math.round(triggerRect.left - panelRect.left);
        const w = Math.round(triggerRect.width);
        const width = Math.round(panelRect.width);
        const height = Math.round(panelRect.height);
        setTabMetrics({ x, w });
        setPanelDims({ width, height });
      }
    };
    updateMetrics();
    const frame = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(frame);
  }, [openMenu]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && openMenu) {
        event.preventDefault();
        setOpenMenu(null);
        triggerRefs.current[openMenu]?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (openMenu && headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openMenu]);

  function openMenuWithDelay(menu: MenuKey) {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenMenu(menu);
  }

  function closeMenuWithDelay() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setOpenMenu(null);
    }, 180);
  }

  function handleDropdownMouseEnter() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function toggleMenu(menu: MenuKey) {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  return (
    <div className="storefront-mega-nav" ref={headerRef} onMouseLeave={closeMenuWithDelay}>
      <div className="storefront-mega-nav__triggers">
        <button
          type="button"
          className={`storefront-mega-trigger ${openMenu === "fragrances" ? "storefront-mega-trigger--active" : ""}`}
          aria-current={isFragrancesActive ? "page" : undefined}
          aria-expanded={openMenu === "fragrances"}
          aria-controls="storefront-mega-fragrances"
          onClick={() => toggleMenu("fragrances")}
          onMouseEnter={() => openMenuWithDelay("fragrances")}
          onFocus={() => openMenuWithDelay("fragrances")}
          ref={(element) => {
            triggerRefs.current.fragrances = element;
          }}
        >
          <span className="storefront-mega-trigger-pill">
            <span>Fragrances</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                openMenu === "fragrances" ? "rotate-180 text-[#ffd875]" : "text-[#c2b8a3]"
              }`}
            />
          </span>
        </button>

        <button
          type="button"
          className={`storefront-mega-trigger ${openMenu === "collections" ? "storefront-mega-trigger--active" : ""}`}
          aria-current={isCollectionsActive ? "page" : undefined}
          aria-expanded={openMenu === "collections"}
          aria-controls="storefront-mega-collections"
          onClick={() => toggleMenu("collections")}
          onMouseEnter={() => openMenuWithDelay("collections")}
          onFocus={() => openMenuWithDelay("collections")}
          ref={(element) => {
            triggerRefs.current.collections = element;
          }}
        >
          <span className="storefront-mega-trigger-pill">
            <span>Collections</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                openMenu === "collections" ? "rotate-180 text-[#ffd875]" : "text-[#c2b8a3]"
              }`}
            />
          </span>
        </button>
      </div>

      {/* ─── Fragrances Dropdown ─── */}
      {openMenu === "fragrances" && (
        <div
          id="storefront-mega-fragrances"
          className="storefront-mega-panel"
          role="region"
          aria-label="Fragrances menu"
          ref={panelRef}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={closeMenuWithDelay}
        >
          {/* Single Unified Continuous SVG Background & Border */}
          <svg
            className="storefront-mega-backdrop-svg"
            width={panelDims.width}
            height={panelDims.height}
            viewBox={`0 0 ${panelDims.width} ${panelDims.height}`}
            aria-hidden="true"
          >
            <path
              d={generateMegaMenuPath(panelDims.width, panelDims.height, tabMetrics.x, tabMetrics.w)}
              fill="#0e0c10"
              stroke="rgba(229, 193, 88, 0.45)"
              strokeWidth="1"
            />
          </svg>

          {/* Left Columns */}
          <div className="storefront-mega-columns">
            {/* Column 1: By Wearer & Curated */}
            <div className="flex flex-col gap-6">
              <div className="storefront-mega-group">
                <p className="storefront-mega-heading">By Wearer</p>
                <div className="storefront-mega-list">
                  {fragranceMegaMenuGroups[0].items.map((item) => {
                    const live = fragranceAudienceNavigation.find((entry) => entry.label === item);
                    return live ? (
                      <Link
                        className="storefront-mega-link"
                        key={item}
                        href={live.href}
                        onClick={() => setOpenMenu(null)}
                      >
                        {item}
                      </Link>
                    ) : (
                      <PlannedItem key={item}>{item}</PlannedItem>
                    );
                  })}
                </div>
              </div>

              <div className="storefront-mega-group">
                <p className="storefront-mega-heading">Curated</p>
                <div className="storefront-mega-list">
                  {fragranceMegaMenuGroups[2].items.map((item) => {
                    const live = fragranceAudienceNavigation.find((entry) => entry.label === item);
                    return live ? (
                      <Link
                        className="storefront-mega-link"
                        key={item}
                        href={live.href}
                        onClick={() => setOpenMenu(null)}
                      >
                        {item}
                      </Link>
                    ) : (
                      <PlannedItem key={item}>{item}</PlannedItem>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Column 2: By Olfactive Family & View All */}
            <div className="flex flex-col justify-between">
              <div className="storefront-mega-group">
                <p className="storefront-mega-heading">By Olfactive Family</p>
                <div className="storefront-mega-list">
                  {fragranceMegaMenuGroups[1].items.map((item) => {
                    const live = fragranceAudienceNavigation.find((entry) => (entry.label as string) === item);
                    return live ? (
                      <Link
                        className="storefront-mega-link"
                        key={item}
                        href={live.href}
                        onClick={() => setOpenMenu(null)}
                      >
                        {item}
                      </Link>
                    ) : (
                      <PlannedItem key={item}>{item}</PlannedItem>
                    );
                  })}
                </div>
              </div>

              <div className="storefront-mega-footer-link">
                <Link
                  className="storefront-mega-view-all"
                  href="/fragrances"
                  onClick={() => setOpenMenu(null)}
                >
                  View all fragrances <span>→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Featured Card (Academic Work Reference Style) */}
          <Link
            href="/fragrances"
            onClick={() => setOpenMenu(null)}
            className="storefront-mega-card group"
          >
            <div className="storefront-mega-card__body">
              <h3 className="storefront-mega-card__title">
                Find your signature scent today
              </h3>
              <p className="storefront-mega-card__desc">
                Immerse yourself in our collection of rare artisanal perfumes crafted to leave a lasting impression.
              </p>
            </div>
            <div className="storefront-mega-card__image-box">
              <Image
                src="/assets/art-of-fragrance.jpg"
                alt="AURA Signature Fragrance"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="storefront-mega-card__btn">
                <ArrowRight className="w-5 h-5 text-[#12100e]" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ─── Collections Dropdown ─── */}
      {openMenu === "collections" && (
        <div
          id="storefront-mega-collections"
          className="storefront-mega-panel"
          role="region"
          aria-label="Collections menu"
          ref={panelRef}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={closeMenuWithDelay}
        >
          {/* Single Unified Continuous SVG Background & Border */}
          <svg
            className="storefront-mega-backdrop-svg"
            width={panelDims.width}
            height={panelDims.height}
            viewBox={`0 0 ${panelDims.width} ${panelDims.height}`}
            aria-hidden="true"
          >
            <path
              d={generateMegaMenuPath(panelDims.width, panelDims.height, tabMetrics.x, tabMetrics.w)}
              fill="#0e0c10"
              stroke="rgba(229, 193, 88, 0.45)"
              strokeWidth="1"
            />
          </svg>
          {/* Left Columns */}
          <div className="storefront-mega-columns storefront-mega-columns--single">
            <div className="storefront-mega-group">
              <p className="storefront-mega-heading">The Maison Collections</p>
              <div className="storefront-mega-list">
                {collections.length ? (
                  collections.map((collection) => (
                    <Link
                      className="storefront-mega-link"
                      key={collection.slug}
                      href={`/collections/${collection.slug}`}
                      onClick={() => setOpenMenu(null)}
                    >
                      {collection.name}
                    </Link>
                  ))
                ) : (
                  <span className="storefront-mega-item storefront-mega-item--empty">
                    Collections will appear here as they are published.
                  </span>
                )}
              </div>
            </div>
            <div className="storefront-mega-footer-link">
              <Link
                className="storefront-mega-view-all"
                href="/collections"
                onClick={() => setOpenMenu(null)}
              >
                View all collections <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right Featured Card */}
          <Link
            href="/collections"
            onClick={() => setOpenMenu(null)}
            className="storefront-mega-card group"
          >
            <div className="storefront-mega-card__body">
              <h3 className="storefront-mega-card__title">
                {collectionsMegaMenuEditorial.eyebrow}
              </h3>
              <p className="storefront-mega-card__desc">
                {collectionsMegaMenuEditorial.copy}
              </p>
            </div>
            <div className="storefront-mega-card__image-box">
              <Image
                src="/assets/collections-hero.jpg"
                alt="AURA Collections"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="storefront-mega-card__btn">
                <ArrowRight className="w-5 h-5 text-[#12100e]" />
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
