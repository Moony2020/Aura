"use client";

import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isScrolled
          ? "bg-[#080809]/45 backdrop-blur-xl py-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.35)]"
          : "bg-gradient-to-b from-[#080809]/60 via-[#080809]/20 to-transparent backdrop-blur-[4px] py-5"
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
          {/* Flame / Perfume-Drop Emblem SVG */}
          <svg
            width="22"
            height="22"
            className="w-5 h-5 sm:w-[22px] sm:h-[22px] opacity-90 group-hover:scale-105 transition-transform duration-500 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF3D1" />
                <stop offset="50%" stopColor="#E5C158" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
            </defs>
            {/* Curling wisp at the top */}
            <path
              d="M12.8 2.2c.9.9 1.2 2 .5 2.7-.6.6-1.5.4-1.7-.3-.2-.6.3-1 .8-.7"
              stroke="url(#goldGrad)"
              strokeWidth="1.1"
              strokeLinecap="round"
              fill="none"
            />
            {/* Outer teardrop flame contour */}
            <path
              d="M12 2C7.5 7.5 4 11.5 4 16a8 8 0 0 0 16 0c0-4.5-3.5-8.5-8-14Z"
              stroke="url(#goldGrad)"
              strokeWidth="1.7"
              fill="none"
            />
            {/* Inner S-curve flame detail */}
            <path
              d="M13.4 10.2c.9.8 1.4 1.8 1.4 2.8a2.8 2.8 0 0 1-2.8 2.8c-.9 0-1.5-.5-1.5-1.1 0-.5.4-.8.9-.7"
              stroke="url(#goldGrad)"
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
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
          <nav className="hidden lg:flex items-center space-x-7 xl:space-x-9 text-[11px] xl:text-[12px] uppercase tracking-[0.25em] text-[#E5D7C0]/90 font-light">
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hover:text-[#E5C158] transition-colors duration-300 relative group py-1"
            >
              Maison
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#E5C158] transition-all duration-300 group-hover:w-full" />
            </a>
            <a
              href="#world-1"
              className="hover:text-[#E5C158] transition-colors duration-300 relative group py-1"
            >
              Fragrances
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#E5C158] transition-all duration-300 group-hover:w-full" />
            </a>
            <a
              href="#collections"
              className="hover:text-[#E5C158] transition-colors duration-300 relative group py-1"
            >
              Collections
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#E5C158] transition-all duration-300 group-hover:w-full" />
            </a>
            <a
              href="#about"
              className="hover:text-[#E5C158] transition-colors duration-300 relative group py-1"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#E5C158] transition-all duration-300 group-hover:w-full" />
            </a>
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
            <a
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#E5C158] transition-colors"
            >
              Maison
            </a>
            <a
              href="#world-1"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#E5C158] transition-colors"
            >
              Fragrances
            </a>
            <a
              href="#collections"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#E5C158] transition-colors"
            >
              Collections
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-[#E5C158] transition-colors"
            >
              About
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
