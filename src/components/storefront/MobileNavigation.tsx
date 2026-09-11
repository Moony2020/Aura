"use client";

import Link from "next/link";
import { Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fragranceAudienceNavigation, fragranceMegaMenuGroups, storefrontNavigation } from "@/config/storefront-navigation";

type CollectionSummary = { slug: string; name: string };

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
}

export function MobileNavigation({ collections }: { collections: CollectionSummary[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const drawerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    const previousScrollY = window.scrollY;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusableElements(document.getElementById(drawerId));
      if (!elements.length) return;
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    function onResize() {
      if (window.innerWidth > 1100) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    const timer = window.setTimeout(() => focusableElements(document.getElementById(drawerId))[0]?.focus(), 0);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.scrollTo(0, previousScrollY);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      trigger?.focus();
    };
  }, [open, drawerId]);

  function closeMenu() {
    setOpen(false);
  }

  function toggleSection(section: string) {
    setExpanded((current) => current.includes(section) ? current.filter((item) => item !== section) : [...current, section]);
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="storefront-mobile-trigger lg:hidden text-[#e5c982] p-2 hover:opacity-80 transition-opacity"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls={drawerId}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
      </button>

      {open && mounted && createPortal(
        <div id={drawerId} role="dialog" aria-modal="true" aria-label="Mobile storefront navigation" className="fixed inset-0 z-[99999] flex flex-col bg-[#080809] text-[#f3ebdb]">
          {/* Top Bar inside Fullscreen Overlay */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#3a3528]/50 bg-[#0c0a0e]">
            <Link href="/" className="flex flex-col items-start leading-none" onClick={closeMenu}>
              <span className="text-xl font-brand tracking-[0.35em] gold-gradient-text font-bold">
                AURA
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-[#FFDF78] font-bold mt-1">
                HAUTE PARFUMERIE
              </span>
            </Link>
            <button
              type="button"
              onClick={closeMenu}
              className="p-2 rounded-full text-[#e5c982] hover:bg-[#e5c982]/10 transition-colors"
              aria-label="Close navigation"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation Links Area */}
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
            <nav aria-label="Mobile storefront navigation" className="space-y-5">
              {/* Fragrances Section */}
              <div className="border-b border-[#3a3528]/30 pb-4">
                <button
                  type="button"
                  className={`w-full flex items-center justify-between text-base uppercase tracking-[0.25em] font-medium py-1 transition-colors ${
                    isActive("/fragrances") ? "text-[#e5c982]" : "text-[#f3ebdb] hover:text-[#e5c982]"
                  }`}
                  onClick={() => toggleSection("fragrances")}
                >
                  <span>Fragrances</span>
                  {expanded.includes("fragrances") ? (
                    <ChevronUp className="w-5 h-5 text-[#e5c982]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#e5c982]" />
                  )}
                </button>
                {expanded.includes("fragrances") && (
                  <div className="pl-4 pt-3 pb-1 space-y-4 border-l border-[#e5c982]/30 mt-2">
                    {fragranceMegaMenuGroups.map((group) => (
                      <div key={group.heading} className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#e5c982] font-semibold">{group.heading}</p>
                        {group.items.map((item) => {
                          const live = fragranceAudienceNavigation.find((entry) => entry.label === item);
                          return live ? (
                            <Link
                              key={item}
                              href={live.href}
                              className={`block text-xs tracking-wider py-1 ${
                                isActive(live.href) ? "text-[#e5c982]" : "text-[#c2b8a3] hover:text-[#f3ebdb]"
                              }`}
                              onClick={closeMenu}
                            >
                              {item}
                            </Link>
                          ) : (
                            <span key={item} className="block text-xs tracking-wider py-1 transition-colors text-[#c2b8a3] hover:text-[#f3ebdb] cursor-default">
                              {item}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                    <Link
                      className="inline-block text-xs uppercase tracking-widest text-[#e5c982] hover:underline pt-2 font-medium"
                      href="/fragrances"
                      onClick={closeMenu}
                    >
                      View all fragrances →
                    </Link>
                  </div>
                )}
              </div>

              {/* Collections Section */}
              <div className="border-b border-[#3a3528]/30 pb-4">
                <button
                  type="button"
                  className={`w-full flex items-center justify-between text-base uppercase tracking-[0.25em] font-medium py-1 transition-colors ${
                    isActive("/collections") ? "text-[#e5c982]" : "text-[#f3ebdb] hover:text-[#e5c982]"
                  }`}
                  onClick={() => toggleSection("collections")}
                >
                  <span>Collections</span>
                  {expanded.includes("collections") ? (
                    <ChevronUp className="w-5 h-5 text-[#e5c982]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#e5c982]" />
                  )}
                </button>
                {expanded.includes("collections") && (
                  <div className="pl-4 pt-3 pb-1 space-y-2 border-l border-[#e5c982]/30 mt-2">
                    {collections.length ? (
                      collections.map((collection) => {
                        const href = `/collections/${collection.slug}`;
                        return (
                          <Link
                            key={collection.slug}
                            href={href}
                            className={`block text-xs tracking-wider py-1 ${
                              isActive(href) ? "text-[#e5c982]" : "text-[#c2b8a3] hover:text-[#f3ebdb]"
                            }`}
                            onClick={closeMenu}
                          >
                            {collection.name}
                          </Link>
                        );
                      })
                    ) : (
                      <span className="block text-xs text-[#c2b8a3]/60 italic py-1">Collections will appear here as they are published.</span>
                    )}
                    <Link
                      className="inline-block text-xs uppercase tracking-widest text-[#e5c982] hover:underline pt-2 font-medium"
                      href="/collections"
                      onClick={closeMenu}
                    >
                      View all collections →
                    </Link>
                  </div>
                )}
              </div>

              {/* Other Navigation Links */}
              <Link
                href="/wishlist"
                className={`block text-base uppercase tracking-[0.25em] font-medium py-1 transition-colors ${isActive("/wishlist") ? "text-[#e5c982]" : "text-[#f3ebdb] hover:text-[#e5c982]"}`}
                onClick={closeMenu}
              >
                Wishlist
              </Link>
              {storefrontNavigation
                .filter((item) => !["Maison", "Fragrances", "Collections"].includes(item.label))
                .map((item) =>
                  item.status === "available" && item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`block text-base uppercase tracking-[0.25em] font-medium py-1 transition-colors ${
                        isActive(item.href) ? "text-[#e5c982]" : "text-[#f3ebdb] hover:text-[#e5c982]"
                      }`}
                      onClick={closeMenu}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span key={item.label} className="block text-base uppercase tracking-[0.25em] font-medium py-1 transition-colors text-[#f3ebdb] hover:text-[#e5c982] cursor-default">
                      {item.label}
                    </span>
                  ),
                )}
            </nav>
          </div>

          {/* Footer Note at Bottom */}
          <div className="p-6 border-t border-[#3a3528]/40 bg-[#0c0a0e] text-center">
            <p className="text-xs text-[#e5c982]/70 uppercase tracking-[0.25em]">
              Maison AURA — Luxury Fragrance
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
