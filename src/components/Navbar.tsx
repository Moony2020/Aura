"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ShoppingBag, User, Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fragranceAudienceNavigation, storefrontNavigation } from "@/config/storefront-navigation";

const homeCollectionLinks = [
  { label: "View all collections", href: "/collections" },
  { label: "The feminine edit", href: "/fragrances/women" },
  { label: "The masculine edit", href: "/fragrances/men" },
  { label: "The shared edit", href: "/fragrances/unisex" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"Fragrances" | "Collections" | null>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const closeMenuTimerRef = useRef<number | null>(null);

  const isNavigationItemActive = (item: (typeof storefrontNavigation)[number]) => {
    if (item.label === "Maison") return pathname === "/";
    if (!item.href) return false;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (navigationRef.current && !navigationRef.current.contains(event.target as Node)) setOpenMenu(null);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeMenuTimerRef.current) window.clearTimeout(closeMenuTimerRef.current);
    };
  }, []);

  function openNavigationMenu(menu: "Fragrances" | "Collections") {
    if (closeMenuTimerRef.current) window.clearTimeout(closeMenuTimerRef.current);
    setOpenMenu(menu);
  }

  function closeNavigationMenuSoon() {
    if (closeMenuTimerRef.current) window.clearTimeout(closeMenuTimerRef.current);
    closeMenuTimerRef.current = window.setTimeout(() => setOpenMenu(null), 140);
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isScrolled
          ? "bg-[#080809]/68 backdrop-blur-xl py-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.35)]"
          : "bg-[#080809]/42 backdrop-blur-md py-5 border-b border-[#D4AF37]/15"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
        {/* Left: AURA Branding */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5 group cursor-pointer"
        >

          <div className="flex flex-col items-start leading-none">
            <span className="text-xl sm:text-2xl font-brand tracking-[0.35em] gold-gradient-text font-bold drop-shadow-[0_2px_14px_rgba(229,193,88,0.4)]">
              AURA
            </span>
            <span className="text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.3em] text-[#FFDF78] font-bold mt-1 drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
              LUXURY FRAGRANCE
            </span>
          </div>
        </a>

        {/* Right Side: Navigation Links & Actions */}
        <div className="flex items-center gap-8 lg:gap-12">
          <nav ref={navigationRef} className="hidden lg:flex items-center gap-5 xl:gap-7 text-[11px] xl:text-[12px] uppercase tracking-[0.2em] text-[#E5D7C0]/90 font-light" aria-label="Home navigation">
            {storefrontNavigation.map((item) => {
              const isPlanned = item.status === "planned";
              const hasMenu = item.label === "Fragrances" || item.label === "Collections";
              const isActive = isNavigationItemActive(item);
              const className = `hover:text-[#E5C158] transition-colors duration-300 relative group h-6 inline-flex items-center gap-1 whitespace-nowrap ${isActive ? "text-[#E5C158]" : ""}`;
              const content = (
                <>
                  {item.label}
                  {hasMenu && <ChevronDown size={12} strokeWidth={1.5} aria-hidden="true" />}
                  {!isPlanned && <span className={`absolute bottom-0 left-0 h-[1px] bg-[#E5C158] transition-all duration-300 group-hover:w-full ${isActive ? "w-full" : "w-0"}`} />}
                </>
              );

              if (isPlanned) {
                return (
                  <span key={item.label} className={`${className} cursor-default`} title="Coming soon" aria-disabled="true">
                    {content}
                  </span>
                );
              }

              if (hasMenu) {
                const menuLabel = item.label as "Fragrances" | "Collections";
                const links = item.label === "Fragrances"
                  ? [
                      { label: "View all fragrances", href: "/fragrances" },
                      ...fragranceAudienceNavigation,
                    ]
                  : homeCollectionLinks;
                const isOpen = openMenu === menuLabel;

                return (
                  <div
                    key={item.label}
                    className="home-nav-menu"
                    onMouseEnter={() => openNavigationMenu(menuLabel)}
                    onMouseLeave={closeNavigationMenuSoon}
                    onFocus={() => openNavigationMenu(menuLabel)}
                  >
                    <button
                      type="button"
                      className={className}
                      aria-current={isActive ? "page" : undefined}
                      aria-expanded={isOpen}
                      aria-controls={`home-${item.label.toLowerCase()}-menu`}
                      onClick={() => setOpenMenu((current) => current === menuLabel ? null : menuLabel)}
                    >
                      {content}
                    </button>
                    {isOpen && (
                      <div id={`home-${item.label.toLowerCase()}-menu`} className="home-nav-menu__panel">
                        <p>{item.label === "Fragrances" ? "Discover by wearer" : "The Maison edits"}</p>
                        {links.map((link) => (
                          <Link key={link.href + link.label} href={link.href} onClick={() => setOpenMenu(null)}>
                            {link.label}<span aria-hidden="true">→</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              if (item.label === "Maison") {
                return (
                  <a
                    key={item.label}
                    href="#hero"
                    onClick={(e) => {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={className}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link key={item.label} href={item.href ?? "#"} className={className} aria-current={isActive ? "page" : undefined}>
                  {content}
                </Link>
              );
            })}
          </nav>

          {/* Actions (Search, Account, Bag) */}
          <div className="flex items-center space-x-5 sm:space-x-6 text-[#E5D7C0]">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(!searchOpen)}
              className="hover:text-[#E5C158] transition-colors duration-300 p-1"
            >
              <Search size={18} />
            </button>

            <button
              type="button"
              aria-label="Account"
              className="hover:text-[#E5C158] transition-colors duration-300 p-1 hidden sm:block"
            >
              <User size={18} />
            </button>

            <button
              type="button"
              aria-label="Shopping Bag"
              className="hover:text-[#E5C158] transition-colors duration-300 p-1 relative flex items-center"
            >
              <ShoppingBag size={18} />
              <span className="absolute -top-1 -right-2 bg-[#D4AF37] text-[#080809] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                0
              </span>
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-[#E5C158] p-1 hover:opacity-80 transition-opacity ml-1"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Search Overlay */}
      {searchOpen && (
        <div className="max-w-xl mx-auto px-6 py-3 mt-2 border-t border-[#D4AF37]/20 flex items-center bg-[#0D0D0E]/95 backdrop-blur-lg">
          <input
            type="text"
            placeholder="Search fragrances, notes (Oud, Rose, Amber)..."
            className="w-full bg-transparent text-[#FDF2EC] text-sm focus:outline-none placeholder-[#8A847C] tracking-wide"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="text-xs text-[#E5C158] uppercase tracking-widest ml-4 hover:underline"
          >
            Close
          </button>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0D0D0E]/95 backdrop-blur-xl border-b border-[#D4AF37]/20 px-8 py-8 space-y-6 text-center animate-fadeIn">
          <div className="flex flex-col space-y-5 text-sm uppercase tracking-[0.25em] text-[#E5D7C0]">
            {storefrontNavigation.map((item) => {
              const hasMenu = item.label === "Fragrances" || item.label === "Collections";
              const isActive = isNavigationItemActive(item);
              const content = (
                <span className="inline-flex items-center justify-center gap-1">
                  {item.label}
                  {hasMenu && <ChevronDown size={13} strokeWidth={1.5} aria-hidden="true" />}
                </span>
              );

              if (item.status === "planned") {
                return <span key={item.label} className="text-[#E5D7C0]/70" title="Coming soon">{content}</span>;
              }
              if (item.label === "Maison") {
                return <a key={item.label} href="#hero" onClick={() => setMobileMenuOpen(false)} className={`hover:text-[#E5C158] transition-colors ${isActive ? "text-[#E5C158]" : ""}`} aria-current={isActive ? "page" : undefined}>{content}</a>;
              }
              return <Link key={item.label} href={item.href ?? "#"} onClick={() => setMobileMenuOpen(false)} className={`hover:text-[#E5C158] transition-colors ${isActive ? "text-[#E5C158]" : ""}`} aria-current={isActive ? "page" : undefined}>{content}</Link>;
            })}
          </div>
        </div>
      )}
    </header>
  );
}
