"use client";

import React from "react";
import { Sparkles, ArrowRight, Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer id="footer" className="relative bg-[#050506] border-t border-[#D4AF37]/10 pt-20 pb-10 overflow-hidden select-none">
      {/* Botanical/Floral Accent (Left Side) */}
      <div className="absolute top-0 left-0 w-64 md:w-96 h-full opacity-5 pointer-events-none transform -translate-x-1/4">
        <svg viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#D4AF37]">
          <path d="M50 400C50 300 100 250 150 200C200 150 180 50 180 50C180 50 150 80 120 70C90 60 70 20 70 20C70 20 60 80 20 100C-20 120 10 180 10 180C10 180 50 160 80 180C110 200 120 250 100 300C80 350 50 400 50 400Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M120 230C140 250 180 260 190 300C200 340 170 380 170 380C170 380 150 340 120 330C90 320 80 350 80 350C80 350 100 300 120 230Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 md:px-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand & Newsletter (Left/Center) */}
          <div className="md:col-span-6 lg:col-span-5 space-y-8">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5 group cursor-pointer mb-2 text-left"
            >
              {/* Flame / Perfume-Drop Emblem SVG */}
              <svg
                className="w-5 h-5 sm:w-[22px] sm:h-[22px] opacity-90 group-hover:scale-105 transition-transform duration-500 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="footerGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF3D1" />
                    <stop offset="50%" stopColor="#E5C158" />
                    <stop offset="100%" stopColor="#B8860B" />
                  </linearGradient>
                </defs>
                {/* Curling wisp at the top */}
                <path
                  d="M12.8 2.2c.9.9 1.2 2 .5 2.7-.6.6-1.5.4-1.7-.3-.2-.6.3-1 .8-.7"
                  stroke="url(#footerGoldGrad)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Outer teardrop / flame body */}
                <path
                  d="M12 4.3c2.1 2.9 4.6 6.4 4.6 9.4a4.6 4.6 0 1 1-9.2 0c0-3 2.5-6.5 4.6-9.4Z"
                  stroke="url(#footerGoldGrad)"
                  strokeWidth="1.4"
                  fill="none"
                />
                {/* Inner S-curve flame detail */}
                <path
                  d="M13.4 10.2c.9.8 1.4 1.8 1.4 2.8a2.8 2.8 0 0 1-2.8 2.8c-.9 0-1.5-.5-1.5-1.1 0-.5.4-.8.9-.7"
                  stroke="url(#footerGoldGrad)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="flex flex-col items-start leading-none">
                <span className="text-2xl font-brand tracking-[0.35em] gold-gradient-text font-bold drop-shadow-[0_2px_14px_rgba(229,193,88,0.4)]">
                  AURA
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.3em] text-[#FFDF78] font-bold mt-1 drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                  LUXURY FRAGRANCE
                </span>
              </div>
            </button>
            
            <p className="text-sm text-[#E5D7C0]/70 font-light leading-relaxed max-w-sm">
              Discover the world’s most exquisite fragrances. Crafted with rare essences and timeless passion.
            </p>

            <div className="space-y-4 pt-4">
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#F5E4B5]">
                Subscribe to the Maison
              </h4>
              <div className="flex items-center border-b border-[#D4AF37]/30 pb-2 max-w-sm group">
                <input 
                  type="email" 
                  placeholder="Your Email Address" 
                  className="bg-transparent border-none outline-none w-full text-sm text-[#FFF7E6] placeholder-[#E5D7C0]/30 font-light"
                />
                <button className="text-[#D4AF37] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 lg:col-span-4 grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#F5E4B5]">Discover</h4>
              <ul className="space-y-4 text-xs font-light text-[#E5D7C0]/60">
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Fragrances</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Collections</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">New Arrivals</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Gifts</a></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#F5E4B5]">Maison</h4>
              <ul className="space-y-4 text-xs font-light text-[#E5D7C0]/60">
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Our Story</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Boutiques</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Sustainability</a></li>
                <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Socials & Legal */}
          <div className="md:col-span-3 lg:col-span-3 space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#F5E4B5]">Follow Us</h4>
              <div className="flex items-center space-x-5 text-[#E5D7C0]/60">
                <a href="#" className="hover:text-[#D4AF37] transition-colors"><Instagram size={18} /></a>
                <a href="#" className="hover:text-[#D4AF37] transition-colors"><Twitter size={18} /></a>
                <a href="#" className="hover:text-[#D4AF37] transition-colors"><Facebook size={18} /></a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-[#D4AF37]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-[#E5D7C0]/40 tracking-wider">
            © 2026 AURA LUXURY FRAGRANCE. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center space-x-6 text-[10px] text-[#E5D7C0]/40 tracking-wider">
            <a href="#" className="hover:text-[#D4AF37] transition-colors">PRIVACY POLICY</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors">TERMS OF SERVICE</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
