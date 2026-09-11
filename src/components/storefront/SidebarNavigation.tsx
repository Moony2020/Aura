"use client";

import Link from "next/link";
import { X, AlignLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type CollectionSummary = { slug: string; name: string };

const sidebarNav = [
  { label: "Fragrances", href: "/fragrances", sub: [
    { label: "Women", href: "/fragrances/women" },
    { label: "Men", href: "/fragrances/men" },
    { label: "Unisex", href: "/fragrances/unisex" },
  ]},
  { label: "Collections", href: "/collections", sub: [] },
  { label: "New Arrivals", href: "/new-arrivals", sub: [] },
  { label: "Gifts", href: null, sub: [], planned: true },
  { label: "About", href: "/about", sub: [] },
  { label: "Inspiration", href: null, sub: [], planned: true },
];

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
}

export function SidebarNavigation({ collections }: { collections: CollectionSummary[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const drawerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab") return;
      const els = focusableElements(document.getElementById(drawerId));
      if (!els.length) return;
      const first = els[0]; const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    document.addEventListener("keydown", onKeyDown);
    const t = window.setTimeout(() => focusableElements(document.getElementById(drawerId))[0]?.focus(), 50);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open, drawerId]);

  function close() { setOpen(false); setExpanded(null); }
  function isActive(href: string) { return pathname === href || pathname.startsWith(`${href}/`); }

  return (
    <>
      {/* Hamburger trigger */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls={drawerId}
        onClick={() => setOpen((v) => !v)}
        className="p-2 flex flex-col items-center justify-center gap-[5px] text-[#c2b8a3] hover:text-[#e5c982] transition-colors group"
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <span className="block h-px w-5 bg-current transition-all group-hover:w-4" />
            <span className="block h-px w-5 bg-current" />
            <span className="block h-px w-3 bg-current transition-all group-hover:w-5" />
          </>
        )}
      </button>

      {/* Sidebar Drawer */}
      {open && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
            onClick={close}
          />

          {/* Sidebar Panel */}
          <div
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="fixed left-0 top-0 bottom-0 z-[9999] flex w-[320px] max-w-[88vw] bg-[#0c0a0f] shadow-[4px_0_60px_rgba(0,0,0,0.7)]"
          >
            {/* Left edge: vertical AURA brand */}
            <div className="flex w-10 shrink-0 flex-col items-center justify-center border-r border-[#e5c982]/10 bg-[#09070c]">
              <Link
                href="/"
                onClick={close}
                aria-label="AURA home"
                className="flex h-full items-center justify-center py-8"
              >
                <span
                  className="gold-gradient-text font-serif font-bold tracking-[0.28em] select-none"
                  style={{
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    transform: "rotate(180deg)",
                    fontSize: "13px",
                    letterSpacing: "0.3em",
                  }}
                >
                  AURA
                </span>
              </Link>
            </div>

            {/* Main nav content */}
            <div className="flex flex-1 flex-col overflow-y-auto">
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-[#e5c982]/10 px-6 py-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#e5c982]">
                  Haute Parfumerie
                </span>
                <button
                  type="button"
                  onClick={close}
                  className="p-1.5 rounded-full text-[#a99b86] hover:text-[#e5c982] hover:bg-[#e5c982]/10 transition-colors"
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex-1 px-6 py-6" aria-label="Primary navigation">
                <ul className="space-y-1">
                  {sidebarNav.map((item) => {
                    const hasSub = item.sub.length > 0 || item.label === "Collections";
                    const isExpanded = expanded === item.label;
                    const active = item.href ? isActive(item.href) : false;

                    // Build submenu items (Fragrances + dynamic Collections)
                    const subItems = item.label === "Collections"
                      ? collections.map((c) => ({ label: c.name, href: `/collections/${c.slug}` }))
                      : item.sub;

                    return (
                      <li key={item.label}>
                        {item.planned ? (
                          <span className="flex items-center justify-between py-3 text-base font-semibold uppercase tracking-[0.18em] text-[#4a4240] cursor-default select-none">
                            {item.label}
                            <span className="text-[8px] uppercase tracking-widest text-[#4a4240] border border-[#4a4240]/40 px-1.5 py-0.5 rounded-sm">Soon</span>
                          </span>
                        ) : hasSub ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setExpanded(isExpanded ? null : item.label)}
                              className={`flex w-full items-center justify-between py-3 text-base font-semibold uppercase tracking-[0.18em] transition-colors ${
                                active || isExpanded ? "text-[#e5c982]" : "text-[#e8dece] hover:text-[#e5c982]"
                              }`}
                            >
                              {item.label}
                              <ChevronRight
                                className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90 text-[#e5c982]" : "text-[#a99b86]"}`}
                              />
                            </button>
                            {isExpanded && (
                              <ul className="mb-2 space-y-0.5 border-l border-[#e5c982]/20 pl-4 pt-1">
                                {item.href && (
                                  <li>
                                    <Link
                                      href={item.href}
                                      onClick={close}
                                      className="block py-2 text-xs font-semibold uppercase tracking-wider text-[#d8b93f] hover:text-[#fff5e8]"
                                    >
                                      View all {item.label} →
                                    </Link>
                                  </li>
                                )}
                                {subItems.length === 0 && (
                                  <li>
                                    <span className="block py-2 text-xs italic text-[#5a5248]">
                                      Coming soon
                                    </span>
                                  </li>
                                )}
                                {subItems.map((sub) => (
                                  <li key={sub.href}>
                                    <Link
                                      href={sub.href}
                                      onClick={close}
                                      className={`block py-2 text-sm tracking-wide transition-colors ${
                                        isActive(sub.href) ? "text-[#e5c982]" : "text-[#b0a492] hover:text-[#fff5e8]"
                                      }`}
                                    >
                                      {sub.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        ) : (
                          <Link
                            href={item.href!}
                            onClick={close}
                            className={`flex items-center py-3 text-base font-semibold uppercase tracking-[0.18em] transition-colors ${
                              active ? "text-[#e5c982]" : "text-[#e8dece] hover:text-[#e5c982]"
                            }`}
                          >
                            {item.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Bottom: thin gold divider + footer note */}
              <div className="border-t border-[#e5c982]/10 px-6 py-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#4a4240]">
                  AURA — Luxury Fragrance
                </p>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
