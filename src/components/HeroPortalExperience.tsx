"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Sparkles, ArrowDown, ChevronRight, Compass } from "lucide-react";
import { publicEnv } from "@/config/env.public";

const HERO_VIDEO_URL =
  publicEnv.NEXT_PUBLIC_CLOUDINARY_HERO_VIDEO_URL ||
  "https://res.cloudinary.com/dcru4if6j/video/upload/v1786968029/hero-video_asvbmt.mp4";

const WORLD_1_VIDEO_URL =
  publicEnv.NEXT_PUBLIC_CLOUDINARY_WORLD_1_VIDEO_URL ||
  "https://res.cloudinary.com/dcru4if6j/video/upload/v1786968075/1_fdsdh4.mp4";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function HeroPortalExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const world1VideoRef = useRef<HTMLVideoElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const perfumeRef = useRef<HTMLDivElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const bloomOverlayRef = useRef<HTMLDivElement>(null);
  const world1OverlayRef = useRef<HTMLDivElement>(null);
  const world1ContentRef = useRef<HTMLDivElement>(null);
  const world1VisibleRef = useRef(false);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      // Ensure initial states
      gsap.set(heroCopyRef.current, { opacity: 1, y: 0, scale: 1 });
      gsap.set(perfumeRef.current, { opacity: 1, scale: 1, filter: "blur(0px)" });
      gsap.set(videoWrapperRef.current, {
        scale: 1,
        transformOrigin: "50% 53%", // Calibrated to the center of the illuminated stone archway opening
      });
      gsap.set(bloomOverlayRef.current, { opacity: 0 });
      gsap.set(world1OverlayRef.current, { opacity: 0, pointerEvents: "none" });
      gsap.set(world1ContentRef.current, { opacity: 0, y: 40 });

      // Master ScrollTrigger Timeline - Cinematic Smooth Inertia
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=1050", // Shorter, snappier scroll distance through the portal
          pin: true,
          scrub: 0.6, // Tighter response, less lag between scroll and motion
          anticipatePin: 1,
          onUpdate: (self) => {
            // Control hero video playback during portal transition
            if (heroVideoRef.current) {
              if (self.progress > 0.45 && !heroVideoRef.current.paused) {
                heroVideoRef.current.pause();
              } else if (self.progress <= 0.45 && heroVideoRef.current.paused) {
                heroVideoRef.current.play().catch(() => {});
              }
            }

            // Play World 1 video smoothly when entering
            if (world1VideoRef.current) {
              if (self.progress > 0.55 && world1VideoRef.current.paused) {
                world1VideoRef.current.play().catch(() => {});
              } else if (self.progress <= 0.55 && !world1VideoRef.current.paused) {
                world1VideoRef.current.pause();
              }
            }

            // Let the progress rail know World 1 is actually revealed (not just
            // present in the DOM at opacity 0) — matches the point where its
            // overlay starts fading in above.
            const world1Visible = self.progress > 0.55;
            if (world1VisibleRef.current !== world1Visible) {
              world1VisibleRef.current = world1Visible;
              window.dispatchEvent(
                new CustomEvent("aura:world1-visibility", { detail: { visible: world1Visible } })
              );
            }
          },
        },
      });

      // 1. EARLY SCROLL: Smoothly fade out Hero copy & CTA
      masterTl.to(
        heroCopyRef.current,
        {
          opacity: 0,
          y: -30,
          duration: 0.6,
          ease: "power2.out",
        },
        0
      );

      // 2. PERFUME BYPASS: Elegantly scale up, blur and dissolve
      masterTl.to(
        perfumeRef.current,
        {
          scale: 1.15,
          opacity: 0,
          filter: "blur(8px)",
          duration: 0.8,
          ease: "power2.inOut",
        },
        0.1
      );

      // 3. PORTAL ZOOM: Quick cinematic camera dolly into the illuminated archway
      masterTl.to(
        videoWrapperRef.current,
        {
          scale: 3.2,
          duration: 1.3,
          ease: "power1.inOut",
        },
        0.15
      );

      // 4. SOFT CHAMPAGNE / GOLDEN EXPOSURE BLOOM: Brief warm bridge (not a long blank hold)
      masterTl.to(
        bloomOverlayRef.current,
        {
          opacity: 0.95,
          duration: 0.45,
          ease: "power2.in",
        },
        1.0
      );

      // 5. REVEAL FRAGRANCE WORLD 1: Fade in the world video layer immediately under the bloom
      masterTl.to(
        world1OverlayRef.current,
        {
          opacity: 1,
          pointerEvents: "auto",
          duration: 0.6,
          ease: "power2.out",
        },
        1.15
      );

      // Fade out the golden bloom — reveals World 1 already in place, no empty hold
      masterTl.to(
        bloomOverlayRef.current,
        {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        1.35
      );

      // Reveal World 1 editorial HTML content with a luxurious glide
      masterTl.to(
        world1ContentRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
        },
        1.45
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      id="hero"
      className="relative w-full h-[100vh] overflow-hidden bg-[#080809] select-none"
    >
      {/* ========================================================================= */}
      {/* LAYER 3 (BOTTOM): LIVING GARDEN + PORTAL BACKGROUND VIDEO                 */}
      {/* ========================================================================= */}
      <div
        ref={videoWrapperRef}
        className="absolute inset-0 w-full h-full will-change-transform origin-[50%_53%]"
      >
        <video
          ref={heroVideoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-[50%_50%]"
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>

        {/* Subtle cinematic vignette for atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080809]/60 via-transparent to-[#080809]/40 pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* LAYER 2 (MIDDLE): HIGH-RES TRANSPARENT PERFUME BOTTLE (CENTRAL HERO)     */}
      {/* Placed precisely in front of the illuminated archway portal               */}
      {/* ========================================================================= */}
      <div
        ref={perfumeRef}
        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none will-change-[transform,opacity,filter]"
      >
        <div className="relative w-[130px] sm:w-[145px] md:w-[155px] lg:w-[168px] xl:w-[180px] h-[260px] sm:h-[290px] md:h-[310px] lg:h-[336px] xl:h-[360px] translate-y-12 sm:translate-y-14 md:translate-y-10 lg:translate-y-12 flex items-center justify-center">
          {/* Subtle luminous ambient aura behind bottle */}
          <div className="absolute inset-0 bg-radial-gold w-3/4 h-3/4 mx-auto my-auto rounded-full filter blur-2xl opacity-40 bg-[#E5C158]/30 pointer-events-none" />

          <img
            src="/assets/hero-perfum-image.png"
            alt="AURA Velvet Rose Signature Fragrance"
            className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] drop-shadow-[0_0_50px_rgba(212,175,55,0.25)] relative z-10"
            loading="eager"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYER 1 (TOP): HTML HERO EDITORIAL COPY & CTA                             */}
      {/* ========================================================================= */}
      <div
        ref={heroCopyRef}
        className="absolute inset-0 z-30 flex flex-col justify-between pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-8 px-6 sm:px-12 md:px-16 lg:px-20 pointer-events-none will-change-[transform,opacity]"
      >
        <div className="w-full max-w-7xl mx-auto flex flex-col items-start justify-start md:justify-center flex-1 pt-2 sm:pt-4 md:pt-0">
          {/* Top Tagline */}
          <div className="mb-3 sm:mb-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#080809]/60 border border-[#D4AF37]/40 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
              <Sparkles size={12} className="text-[#E5C158]" />
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.35em] text-[#F5E4B5] font-light">
                Haute Parfumerie Experience
              </span>
            </div>
          </div>

          {/* Left-aligned Copy */}
          <div className="max-w-xl text-left flex flex-col items-start">
            <h1 className="font-serif-luxury text-3xl sm:text-4xl md:text-6xl lg:text-[4.25rem] font-light tracking-[0.06em] text-[#FFF7E6] uppercase leading-[1.08] drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)]">
              Enter the <br />
              <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#FFF5D6] via-[#F4D068] to-[#E5B53B] drop-shadow-[0_2px_24px_rgba(229,193,88,0.5)]">
                World of Fragrance
              </span>
            </h1>

            <p className="mt-3 sm:mt-5 text-xs sm:text-sm lg:text-lg text-[#FFF9F2] font-light tracking-[0.08em] max-w-xs sm:max-w-md drop-shadow-[0_2px_16px_rgba(0,0,0,1)] leading-relaxed">
              Discover scents that leave an unforgettable impression, crafted with the rarest essences by master perfumers.
            </p>
          </div>
        </div>

        {/* Ethereal Golden Scent Frequency Graphic (Right background) */}
        <div className="absolute right-4 sm:right-10 lg:right-16 top-[38%] -translate-y-1/2 w-60 sm:w-80 md:w-96 pointer-events-none opacity-65 hidden md:block">
          <svg viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path
              d="M0 60 Q50 15, 100 60 T200 60 T300 60 T400 60"
              stroke="url(#waveGold)"
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M0 60 Q50 0, 100 60 T200 60 T300 60 T400 60"
              stroke="url(#waveGold)"
              strokeWidth="0.9"
              fill="none"
              opacity="0.7"
            />
            <path
              d="M0 60 Q50 30, 100 60 T200 60 T300 60 T400 60"
              stroke="url(#waveGold)"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M0 60 Q50 85, 100 60 T200 60 T300 60 T400 60"
              stroke="url(#waveGold)"
              strokeWidth="0.8"
              fill="none"
              opacity="0.5"
            />
            <defs>
              <linearGradient id="waveGold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E5C158" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#FFF3D1" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Bottom Interactive Bar: Left Explore Button | Center Scroll to Enter | Right Collections Card */}
        <div className="relative w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-4 pb-2 pointer-events-auto">
          
          {/* Left: Explore Button with Animated Golden Fire Border */}
          <div className="flex flex-col items-start">
            <div className="p-[1.5px] rounded-full gold-fire-container shadow-[0_0_25px_rgba(229,193,88,0.4)] group cursor-pointer">
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 1050, behavior: "smooth" });
                }}
                className="px-8 sm:px-10 py-3 sm:py-3.5 rounded-full bg-[#0D0D0E]/90 hover:bg-[#0D0D0E]/75 transition-all duration-300 flex items-center space-x-2.5 backdrop-blur-xl"
              >
                <span className="text-xs sm:text-[13px] uppercase tracking-[0.25em] font-bold gold-gradient-text">
                  Explore Fragrances
                </span>
                <ChevronRight size={16} className="text-[#E5C158] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Center: Refined Scroll to Enter in Luxury Serif Italic with Subtle Floating Arrow (Centered on screen) */}
          <div
            onClick={() => {
              window.scrollTo({ top: 1050, behavior: "smooth" });
            }}
            className="md:absolute md:left-1/2 md:-translate-x-1/2 md:bottom-2 flex flex-col items-center space-y-1 text-[#FFDF78] cursor-pointer group hover:scale-105 transition-transform duration-300"
          >
            <span className="font-serif-luxury italic text-xs tracking-[0.3em] font-normal text-[#FFDF78] group-hover:text-[#FFF3D1] drop-shadow-[0_2px_10px_rgba(0,0,0,1)] transition-colors">
              SCROLL TO ENTER
            </span>
            <ArrowDown size={14} className="text-[#FFDF78] group-hover:text-[#FFF3D1] animate-bounce drop-shadow-[0_2px_8px_rgba(0,0,0,1)] transition-colors" />
          </div>

          {/* Right: Explore Our Collections — real glass blur. backdrop-filter can't reliably blur
              <video> content in Chromium, so we clip a second copy of the hero video inside this
              card and blur that copy directly with `filter` (which does work on video), then tint
              it. That's a genuine moving blurred backdrop, not a browser-dependent guess. */}
          <div className="relative hidden lg:flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-2xl overflow-hidden border border-[#E5C158]/15 max-w-[340px] sm:max-w-[360px] cursor-default shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
            <video
              aria-hidden="true"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover scale-125 blur-md brightness-95 saturate-75"
            >
              <source src={HERO_VIDEO_URL} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-white/25" />

            {/* 3 Direct Borderless Images */}
            <div className="relative flex items-center gap-2.5">
              <img
                src="/assets/collection-1.jpg"
                alt="La Collection Privée"
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              />
              <img
                src="/assets/collection-2.jpg"
                alt="Miss Dior"
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              />
              <img
                src="/assets/collection-3.jpg"
                alt="Scented Candle"
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="relative flex flex-col text-left">
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#E5C158] font-bold drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                Explore Our Collections:
              </span>
              <span className="text-[10.5px] sm:text-[11px] text-[#FFF9F2] font-light truncate mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                La Collection Privée, Miss Dior, Scented Candle
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SOFT CHAMPAGNE / GOLDEN EXPOSURE BLOOM TRANSITION LAYER                   */}
      {/* Fills viewport as the camera passes through the illuminated portal         */}
      {/* ========================================================================= */}
      <div
        ref={bloomOverlayRef}
        className="absolute inset-0 z-40 opacity-0 pointer-events-none will-change-opacity bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FFF5D6] via-[#E5C158]/70 to-[#080809]/90 mix-blend-screen"
      />

      {/* ========================================================================= */}
      {/* FRAGRANCE WORLD 1 (REVEALED THROUGH PORTAL) — 1.mp4                       */}
      {/* ========================================================================= */}
      <div
        ref={world1OverlayRef}
        id="world-1"
        className="absolute inset-0 z-40 w-full h-full opacity-0 pointer-events-none will-change-opacity bg-[#080809]"
      >
        {/* Background Video: World 1 */}
        <div className="absolute inset-0 w-full h-full">
          <video
            ref={world1VideoRef}
            loop
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover object-center"
          >
            <source src={WORLD_1_VIDEO_URL} type="video/mp4" />
          </video>
          {/* Subtle dark gradient overlay for editorial text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#080809]/85 via-[#080809]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080809]/80 via-transparent to-[#080809]/40" />
        </div>

        {/* World 1 Content - Padded below fixed navbar */}
        <div
          ref={world1ContentRef}
          className="relative z-10 w-full h-full flex items-center justify-start max-w-7xl mx-auto px-6 sm:px-12 md:px-16 pt-24 sm:pt-28 pb-10 opacity-0 translate-y-10"
        >
          {/* World 1 Editorial Copy — plain text over video, no card container */}
          <div className="max-w-xl text-left space-y-5">
            {/* World Counter & Subtitle */}
            <div className="flex items-center space-x-3">
              <span className="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.32em] text-[#E5C158] font-semibold">
                Fragrance World 01
              </span>
              <span className="w-8 h-[1px] bg-[#E5C158]/40" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#D8A48F]">
                Collection Privée
              </span>
            </div>

            {/* Fragrance Title */}
            <h2 className="font-serif-luxury text-5xl sm:text-7xl md:text-8xl text-[#FFF7E6] tracking-wide uppercase font-light leading-[1.05] drop-shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
              Élixir <br />
              <span className="italic font-normal gold-gradient-text">de Rose</span>
            </h2>

            {/* Fragrance Classification & Notes */}
            <div className="space-y-3 border-l border-[#D4AF37]/30 pl-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[#E5D7C0]/80">
                Eau de Parfum Intense • 100ml
              </p>
              <p className="text-sm sm:text-base text-[#FDF2EC]/90 font-light leading-relaxed max-w-md drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                An intoxicating voyage through blooming royal gardens at dawn. Radiant Damask rose petals intertwined with pink peppercorn and warm golden amber.
              </p>
            </div>

            {/* Olfactory Notes Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 whitespace-nowrap rounded-full bg-[#0D0D0E]/60 backdrop-blur-md border border-[#D4AF37]/30 text-[#F5E4B5]">
                Top: Pink Peppercorn
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 whitespace-nowrap rounded-full bg-[#0D0D0E]/60 backdrop-blur-md border border-[#D4AF37]/30 text-[#F5E4B5]">
                Heart: Damask Rose
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 whitespace-nowrap rounded-full bg-[#0D0D0E]/60 backdrop-blur-md border border-[#D4AF37]/30 text-[#F5E4B5]">
                Base: Golden Amber & Musk
              </span>
            </div>

            {/* CTA Actions */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="button"
                className="px-9 py-4 rounded-full bg-[#D4AF37] text-[#080809] text-xs uppercase tracking-[0.25em] font-semibold whitespace-nowrap hover:bg-[#FFF3D1] transition-colors duration-300 shadow-[0_0_30px_rgba(212,175,55,0.4)]"
              >
                Acquire — $280
              </button>
              <button
                type="button"
                className="px-7 py-4 rounded-full border border-[#E5C158]/40 text-[#FFF3D1] text-xs uppercase tracking-[0.25em] whitespace-nowrap hover:border-[#E5C158] hover:bg-[#121215]/50 transition-all duration-300"
              >
                Explore Notes
              </button>
            </div>
          </div>

          {/* Floating Glass Info Chip */}
          <div className="hidden lg:flex absolute top-24 right-12 xl:right-20 w-56 flex-col gap-2 p-3.5 rounded-2xl bg-[#0D0D0E]/40 backdrop-blur-xl border border-[#E5C158]/25 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
            <div className="relative w-full h-32 rounded-xl overflow-hidden">
              <video
                src={WORLD_1_VIDEO_URL}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#080809]/20" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#F5E4B5]">Élixir de Rose</p>
            <p className="text-[9px] uppercase tracking-[0.15em] text-[#D8A48F]">Eau de Parfum Intense</p>
          </div>
        </div>

        {/* Portal Breadcrumb / Back to Hero */}
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="absolute bottom-8 right-8 z-20 flex items-center space-x-2 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/70 hover:text-[#E5C158] transition-colors p-2"
        >
          <Compass size={14} />
          <span>Return to Portal</span>
        </button>
      </div>
    </div>
  );
}
