"use client";

import Link from "next/link";
import { X, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type CollectionSummary = { slug: string; name: string };

// Main nav items shown in the body of the sidebar
const sidebarNav = [
  {
    label: "Fragrances",
    href: "/fragrances",
    sub: [
      { label: "Women", href: "/fragrances/women" },
      { label: "Men", href: "/fragrances/men" },
      { label: "Unisex", href: "/fragrances/unisex" },
    ],
  },
  { label: "Collections", href: "/collections", sub: [] },
  { label: "New Arrivals", href: "/new-arrivals", sub: [] },
  { label: "Makeup", href: null, sub: [], planned: true },
  { label: "Inspiration", href: null, sub: [], planned: true },
];

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

export function SidebarNavigation({ collections }: { collections: CollectionSummary[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const drawerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const els = focusableElements(document.getElementById(drawerId));
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const t = window.setTimeout(
      () => focusableElements(document.getElementById(drawerId))[0]?.focus(),
      50
    );
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open, drawerId]);

  function close() {
    setOpen(false);
    setExpanded(null);
  }
  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

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
        className="p-1.5 flex flex-col items-center justify-center gap-[5px] text-[#c2b8a3] hover:text-[#e5c982] transition-colors group"
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
      {open &&
        mounted &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
              aria-hidden="true"
              onClick={close}
            />

            {/* Sidebar Panel */}
            <div
              id={drawerId}
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              className="fixed left-0 top-0 bottom-0 z-[9999] flex w-[390px] max-w-[92vw] overflow-hidden"
              style={{
                background: "#0c0a0e",
                borderRight: "1px solid rgba(229, 193, 88, 0.28)",
                boxShadow: "25px 0 80px rgba(0,0,0,0.95), 4px 0 30px rgba(229,193,88,0.12)",
              }}
            >
              {/* ─── Gold ambient glow ─── */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background: [
                    "radial-gradient(ellipse 80% 55% at 85% 5%, rgba(216,185,63,0.18) 0%, transparent 60%)",
                    "radial-gradient(ellipse 60% 45% at 10% 95%, rgba(160,109,48,0.16) 0%, transparent 55%)",
                    "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(216,185,63,0.05) 0%, transparent 70%)",
                  ].join(", "),
                }}
              />

              {/* ─── Left edge: vertical AURA brand (wider + bigger) ─── */}
              <div
                className="flex w-[64px] shrink-0 flex-col items-center justify-center"
                style={{
                  borderRight: "1px solid rgba(229, 193, 88, 0.18)",
                  background:
                    "linear-gradient(180deg, rgba(216,185,63,0.06) 0%, rgba(0,0,0,0.4) 40%, rgba(160,109,48,0.10) 100%)",
                }}
              >
                <Link
                  href="/"
                  onClick={close}
                  aria-label="AURA home"
                  className="flex h-full w-full items-center justify-center py-10"
                >
                  <span
                    className="gold-gradient-text font-serif font-bold select-none"
                    style={{
                      writingMode: "vertical-rl",
                      textOrientation: "mixed",
                      transform: "rotate(180deg)",
                      fontSize: "28px",
                      letterSpacing: "0.45em",
                      lineHeight: 1,
                      textShadow: "0 0 25px rgba(216,185,63,0.45)",
                    }}
                  >
                    AURA
                  </span>
                </Link>
              </div>

              {/* ─── Main nav content ─── */}
              <div className="relative flex flex-1 flex-col overflow-y-auto">
                {/* Top close button */}
                <div className="flex items-center justify-end px-5 py-4">
                  <button
                    type="button"
                    onClick={close}
                    className="p-1.5 rounded-full text-[#7a6e5e] hover:text-[#e5c982] transition-colors"
                    aria-label="Close navigation"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Nav items */}
                <nav className="flex-1 px-7 pb-4" aria-label="Primary navigation">
                  <ul className="space-y-0">
                    {sidebarNav.map((item) => {
                      const hasSub =
                        item.sub.length > 0 || item.label === "Collections";
                      const isExpanded = expanded === item.label;
                      const active = item.href ? isActive(item.href) : false;

                      const subItems =
                        item.label === "Collections"
                          ? collections.map((c) => ({
                              label: c.name,
                              href: `/collections/${c.slug}`,
                            }))
                          : item.sub;

                      const baseClass =
                        "text-[1.15rem] font-bold uppercase tracking-[0.14em] leading-none";

                      return (
                        <li
                          key={item.label}
                          style={{
                            borderBottom: "1px solid rgba(216,185,63,0.08)",
                          }}
                        >
                          {item.planned ? (
                            <span
                              className={`flex items-center justify-between py-[18px] ${baseClass} text-[#5a524a] cursor-default select-none`}
                            >
                              {item.label}
                              <span className="text-[9px] font-semibold uppercase tracking-widest text-[#8a7c65] border border-[#8a7c65]/40 px-2 py-0.5 rounded-sm">
                                Soon
                              </span>
                            </span>
                          ) : hasSub ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                   setExpanded(isExpanded ? null : item.label)
                                }
                                className={`flex w-full items-center justify-between py-[18px] ${baseClass} transition-colors ${
                                  active || isExpanded
                                    ? "text-[#d8b93f]"
                                    : "text-[#e8dece] hover:text-[#d8b93f]"
                                }`}
                              >
                                {item.label}
                                <ChevronRight
                                  className={`h-4 w-4 transition-transform duration-200 ${
                                    isExpanded
                                      ? "rotate-90 text-[#d8b93f]"
                                      : "text-[#7a6e5e]"
                                  }`}
                                />
                              </button>
                              {isExpanded && (
                                <ul
                                  className="mb-3 space-y-0 pl-4"
                                  style={{
                                    borderLeft: "1px solid rgba(216,185,63,0.25)",
                                  }}
                                >
                                  {item.href && (
                                    <li>
                                      <Link
                                        href={item.href}
                                        onClick={close}
                                        className="block py-2 text-xs font-semibold uppercase tracking-wider text-[#d8b93f] hover:text-[#fff5e8] transition-colors"
                                      >
                                        View all {item.label} →
                                      </Link>
                                    </li>
                                  )}
                                  {subItems.length === 0 && (
                                    <li>
                                      <span className="block py-2 text-xs italic text-[#7a6e5e]">
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
                                          isActive(sub.href)
                                            ? "text-[#d8b93f]"
                                            : "text-[#b0a080] hover:text-[#fff5e8]"
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
                              className={`flex items-center py-[18px] ${baseClass} transition-colors ${
                                active
                                  ? "text-[#d8b93f]"
                                  : "text-[#e8dece] hover:text-[#d8b93f]"
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

                {/* ─── Bottom footer: About link + clear brand tagline ─── */}
                <div
                  className="px-7 py-5 space-y-2.5"
                  style={{ borderTop: "1px solid rgba(216,185,63,0.15)" }}
                >
                  <Link
                    href="/about"
                    onClick={close}
                    className={`block text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                      isActive("/about")
                        ? "text-[#d8b93f]"
                        : "text-[#c2b8a3] hover:text-[#ffd875]"
                    }`}
                  >
                    About
                  </Link>
                  <p className="text-[10px] uppercase font-medium tracking-[0.24em] text-[#948873]">
                    AURA — Luxury Fragrance House
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
