"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { collectionsMegaMenuEditorial, fragranceAudienceNavigation, fragranceMegaMenuGroups } from "@/config/storefront-navigation";

type MenuKey = "fragrances" | "collections";
type CollectionSummary = { slug: string; name: string };

function PlannedItem({ children }: { children: string }) {
  return <span className="storefront-mega-menu__planned" aria-disabled="true">{children}</span>;
}

export function StorefrontMegaMenu({ collections }: { collections: CollectionSummary[] }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<MenuKey, HTMLButtonElement | null>>({ fragrances: null, collections: null });
  const isFragrancesActive = pathname === "/fragrances" || pathname.startsWith("/fragrances/");
  const isCollectionsActive = pathname === "/collections" || pathname.startsWith("/collections/");

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && openMenu) {
        event.preventDefault();
        setOpenMenu(null);
        triggerRefs.current[openMenu]?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (openMenu && headerRef.current && !headerRef.current.contains(event.target as Node)) setOpenMenu(null);
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
          className="storefront-mega-trigger"
          aria-current={isFragrancesActive ? "page" : undefined}
          aria-expanded={openMenu === "fragrances"}
          aria-controls="storefront-mega-fragrances"
          onClick={() => toggleMenu("fragrances")}
          onMouseEnter={() => openMenuWithDelay("fragrances")}
          onFocus={() => openMenuWithDelay("fragrances")}
          ref={(element) => { triggerRefs.current.fragrances = element; }}
        >
          Fragrances<svg className="storefront-mega-trigger__chevron" viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" /></svg>
        </button>
        <button
          type="button"
          className="storefront-mega-trigger"
          aria-current={isCollectionsActive ? "page" : undefined}
          aria-expanded={openMenu === "collections"}
          aria-controls="storefront-mega-collections"
          onClick={() => toggleMenu("collections")}
          onMouseEnter={() => openMenuWithDelay("collections")}
          onFocus={() => openMenuWithDelay("collections")}
          ref={(element) => { triggerRefs.current.collections = element; }}
        >
          Collections<svg className="storefront-mega-trigger__chevron" viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" /></svg>
        </button>
      </div>
      {openMenu === "fragrances" && (
        <div
          id="storefront-mega-fragrances"
          className="storefront-mega-menu storefront-mega-menu--fragrances"
          role="region"
          aria-label="Fragrances menu"
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={closeMenuWithDelay}
        >
          {fragranceMegaMenuGroups.map((group) => (
            <div className="storefront-mega-menu__group" key={group.heading}>
              <p className="storefront-mega-menu__heading">{group.heading}</p>
              {group.items.map((item) => {
                const live = fragranceAudienceNavigation.find((entry) => entry.label === item);
                return live ? <Link className="storefront-mega-menu__live-link" key={item} href={live.href} onClick={() => setOpenMenu(null)}>{item}</Link> : <PlannedItem key={item}>{item}</PlannedItem>;
              })}
            </div>
          ))}
          <Link className="storefront-mega-menu__live-link storefront-mega-menu__view-all" href="/fragrances" onClick={() => setOpenMenu(null)}>View all fragrances</Link>
        </div>
      )}
      {openMenu === "collections" && (
        <div
          id="storefront-mega-collections"
          className="storefront-mega-menu storefront-mega-menu--collections"
          role="region"
          aria-label="Collections menu"
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={closeMenuWithDelay}
        >
          <div className="storefront-mega-menu__group">
            <p className="storefront-mega-menu__heading">The Maison collections</p>
            {collections.length ? collections.map((collection) => <Link className="storefront-mega-menu__live-link" key={collection.slug} href={`/collections/${collection.slug}`} onClick={() => setOpenMenu(null)}>{collection.name}</Link>) : <span className="storefront-mega-menu__empty">Collections will appear here as they are published.</span>}
          </div>
          <div className="storefront-mega-menu__editorial">
            <p className="storefront-mega-menu__eyebrow">{collectionsMegaMenuEditorial.eyebrow}</p>
            <p>{collectionsMegaMenuEditorial.copy}</p>
          </div>
          <Link className="storefront-mega-menu__live-link storefront-mega-menu__view-all" href="/collections" onClick={() => setOpenMenu(null)}>View all collections</Link>
        </div>
      )}
    </div>
  );
}
