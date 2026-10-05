/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Sparkles, ArrowDown, ChevronRight, ArrowRight, Compass } from "lucide-react";
import { publicEnv } from "@/config/env.public";
import CinematicAcquireButton from "./CinematicAcquireButton";

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

      // 4. SOFT CHAMPAGNE / GOLDEN EXPOSURE BLOOM
      masterTl.to(
        bloomOverlayRef.current,
        {
          opacity: 0.95,
          duration: 0.45,
          ease: "power2.in",
        },
        1.0
      );

      // 5. REVEAL FRAGRANCE WORLD 1
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

      // Fade out the golden bloom
      masterTl.to(
        bloomOverlayRef.current,
        {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        1.35
      );

      // Reveal World 1 editorial HTML content
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

        {/* Subtle cinematic vignette for atmosphere (bottom only, top clear for header blur) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080809]/75 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* LAYER 2 (MIDDLE): HIGH-RES TRANSPARENT PERFUME BOTTLE (CENTRAL HERO)     */}
      {/* Placed precisely in front of the illuminated archway portal               */}
      {/* ========================================================================= */}
      <div
        ref={perfumeRef}
        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none will-change-[transform,opacity,filter]"
      >
        <div className="relative w-[140px] sm:w-[150px] md:w-[160px] lg:w-[152px] xl:w-[158px] h-[280px] sm:h-[300px] md:h-[320px] lg:h-[304px] xl:h-[316px] translate-y-[61px] sm:translate-y-[57px] md:translate-y-[51px] min-[992px]:translate-y-[54px] lg:translate-y-[43px] xl:translate-y-[47px] min-[1200px]:translate-y-[47px] translate-x-[5px] flex items-center justify-center">
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
        className="absolute inset-0 z-30 flex flex-col justify-between pt-[74px] sm:pt-20 pb-4 sm:pb-6 px-6 sm:px-12 md:px-16 lg:px-20 pointer-events-none will-change-[transform,opacity]"
      >
        <div className="w-full max-w-7xl mx-auto flex flex-col items-start justify-start pt-2 sm:pt-4 flex-1">
          {/* Top Tagline */}
          <div className="mb-4 sm:mb-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#080809]/50 border border-[#D4AF37]/30 backdrop-blur-md">
              <Sparkles size={12} className="text-[#E5C158]" />
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.35em] text-[#F5E4B5] font-light">
                Haute Parfumerie Experience
              </span>
            </div>
          </div>

          {/* Left-aligned Copy */}
          <div className="max-w-xl text-left flex flex-col items-start relative">
            {/* Subtle dark aura behind text for readability against bright background */}
            <div className="absolute -inset-12 bg-black/40 blur-3xl pointer-events-none -z-10 rounded-full" />
            
            <h1 className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-light tracking-[0.06em] text-[#FFF7E6] uppercase leading-[1.08] drop-shadow-[0_4px_25px_rgba(0,0,0,1)]">
              Enter the <br />
              <span className="italic font-normal gold-gradient-text drop-shadow-[0_4px_25px_rgba(0,0,0,0.85)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                World of Fragrance
              </span>
            </h1>

            <p className="mt-4 sm:mt-5 text-xs sm:text-sm lg:text-lg text-[#FFF9F2] font-light tracking-[0.08em] max-w-md drop-shadow-[0_4px_16px_rgba(0,0,0,1)] leading-relaxed">
              Discover scents that leave an unforgettable impression, crafted with the rarest essences by master perfumers.
            </p>
          </div>
        </div>

        {/* Right: Fragrance Preview Cards (01 Velvet Rose & 02 Oud) */}
        <div className="hidden lg:flex flex-col gap-4 absolute right-6 sm:right-10 lg:right-12 xl:right-16 top-[48%] -translate-y-1/2 z-30 pointer-events-auto">
          {/* Card 01: Velvet Rose */}
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 1050, behavior: "smooth" });
            }}
            className="group relative w-[275px] xl:w-[295px] h-[175px] xl:h-[188px] rounded-2xl overflow-hidden border border-[#E11D48]/35 hover:border-[#E11D48] shadow-[0_12px_35px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_rgba(225,29,72,0.45)] transition-all duration-500 text-left cursor-pointer"
            aria-label="Experience Fragrance 01: Velvet Rose"
          >
            {/* Full Background Image */}
            <img
              src="/assets/rose-hero.jpeg"
              alt="Velvet Rose"
              className="absolute inset-0 w-full h-full object-cover object-right transition-transform duration-700 ease-out group-hover:scale-110"
            />
            {/* Cinematic Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#080809]/95 via-[#080809]/55 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080809]/70 via-transparent to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 h-full p-4 xl:p-5 flex flex-col justify-between items-start">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.25em] text-[#FFF3D1]/80">
                  01
                </span>
                <h3 className="font-serif-luxury text-lg xl:text-xl font-normal tracking-[0.06em] text-[#FFF7E6] uppercase leading-snug mt-0.5">
                  Velvet Rose
                </h3>
                <p className="font-serif italic text-xs text-[#FFF9F2]/75 mt-1 tracking-wide">
                  A blooming soul.
                </p>
              </div>

              <div className="w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] rounded-full shrink-0 flex items-center justify-center border border-white/30 bg-black/40 backdrop-blur-md text-white transition-all duration-300 group-hover:bg-white/20 group-hover:border-white/70 group-hover:text-white group-hover:shadow-[0_0_16px_rgba(255,255,255,0.35)]">
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* Card 02: Oud */}
          <button
            type="button"
            onClick={() => {
              document.getElementById("world-2")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group relative w-[275px] xl:w-[295px] h-[175px] xl:h-[188px] rounded-2xl overflow-hidden border border-[#D4AF37]/35 hover:border-[#E5C158] shadow-[0_12px_35px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_rgba(229,193,88,0.45)] transition-all duration-500 text-left cursor-pointer"
            aria-label="Experience Fragrance 02: Oud"
          >
            {/* Full Background Image */}
            <img
              src="/assets/oud-hero.jpeg"
              alt="Oud"
              className="absolute inset-0 w-full h-full object-cover object-right transition-transform duration-700 ease-out group-hover:scale-110"
            />
            {/* Cinematic Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#080809]/95 via-[#080809]/55 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080809]/70 via-transparent to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 h-full p-4 xl:p-5 flex flex-col justify-between items-start">
              <div>
                <span className="text-[10px] font-semibold tracking-[0.25em] text-[#E5C158]">
                  02
                </span>
                <h3 className="font-serif-luxury text-lg xl:text-xl font-normal tracking-[0.06em] text-[#FFF7E6] uppercase leading-snug mt-0.5">
                  Oud
                </h3>
                <p className="font-serif italic text-xs text-[#FFF9F2]/75 mt-1 tracking-wide">
                  A timeless depth.
                </p>
              </div>

              <div className="w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] rounded-full shrink-0 flex items-center justify-center border border-white/30 bg-black/40 backdrop-blur-md text-white transition-all duration-300 group-hover:bg-white/20 group-hover:border-white/70 group-hover:text-white group-hover:shadow-[0_0_16px_rgba(255,255,255,0.35)]">
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Bottom Interactive Bar: Left Explore Button | Center Scroll to Enter */}
        <div className="relative w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center lg:items-end justify-between gap-4 pb-4 md:pb-6 pointer-events-auto">
          {/* Left Container: Explore Button + Scroll To Enter */}
          <div className="flex flex-col items-center lg:items-start space-y-2.5 sm:space-y-3 -translate-y-1 sm:-translate-y-2 md:-translate-y-3">
            <div className="p-[1.5px] rounded-full gold-fire-container shadow-[0_0_25px_rgba(229,193,88,0.4)] group cursor-pointer">
              <Link
                href="/fragrances"
                className="px-4 sm:px-6 md:px-9 py-2 sm:py-2.5 md:py-3.5 rounded-full bg-[#0D0D0E]/90 hover:bg-[#0D0D0E]/75 transition-all duration-300 flex items-center space-x-2 sm:space-x-2.5 backdrop-blur-xl"
              >
                <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-[13px] uppercase tracking-[0.18em] sm:tracking-[0.22em] lg:tracking-[0.25em] font-bold gold-gradient-text">
                  Explore Fragrances
                </span>
                <ChevronRight size={13} className="text-[#E5C158] sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Scroll to Enter when < 1024px */}
            <div
              onClick={() => {
                window.scrollTo({ top: 1050, behavior: "smooth" });
              }}
              className="flex lg:hidden flex-col items-center space-y-1 text-[#FFDF78] cursor-pointer group hover:scale-105 transition-transform duration-300 pt-1"
            >
              <span className="font-serif-luxury italic text-[10px] sm:text-xs tracking-[0.3em] font-normal text-[#FFDF78] group-hover:text-[#FFF3D1] drop-shadow-[0_2px_10px_rgba(0,0,0,1)] transition-colors">
                SCROLL TO ENTER
              </span>
              <ArrowDown size={13} className="text-[#FFDF78] group-hover:text-[#FFF3D1] animate-bounce drop-shadow-[0_2px_8px_rgba(0,0,0,1)] transition-colors" />
            </div>
          </div>

          {/* Desktop Center: Scroll to Enter */}
          <div
            onClick={() => {
              window.scrollTo({ top: 1050, behavior: "smooth" });
            }}
            className="hidden lg:flex absolute left-1/2 -translate-x-1/2 bottom-4 flex-col items-center space-y-1 text-[#FFDF78] cursor-pointer group hover:scale-105 transition-transform duration-300"
          >
            <span className="font-serif-luxury italic text-xs tracking-[0.3em] font-normal text-[#FFDF78] group-hover:text-[#FFF3D1] drop-shadow-[0_2px_10px_rgba(0,0,0,1)] transition-colors">
              SCROLL TO ENTER
            </span>
            <ArrowDown size={14} className="text-[#FFDF78] group-hover:text-[#FFF3D1] animate-bounce drop-shadow-[0_2px_8px_rgba(0,0,0,1)] transition-colors" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SOFT CHAMPAGNE / GOLDEN EXPOSURE BLOOM TRANSITION LAYER                   */}
      {/* ========================================================================= */}
      <div
        ref={bloomOverlayRef}
        className="absolute inset-0 z-40 opacity-0 pointer-events-none will-change-opacity bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FFF5D6] via-[#E5C158]/70 to-[#080809]/90 mix-blend-screen"
      />

      {/* ========================================================================= */}
      {/* FRAGRANCE WORLD 1 (REVEALED THROUGH PORTAL)                               */}
      {/* ========================================================================= */}
      <div
        ref={world1OverlayRef}
        id="world-1"
        className="absolute inset-0 z-40 w-full h-full opacity-0 pointer-events-none will-change-opacity bg-[#080809]"
      >
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#080809]/85 via-[#080809]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080809]/80 via-transparent to-[#080809]/40" />
        </div>

        <div
          ref={world1ContentRef}
          className="relative z-10 w-full h-full flex items-center justify-start max-w-7xl mx-auto px-6 sm:px-12 md:px-16 pt-24 sm:pt-28 pb-10 opacity-0 translate-y-10"
        >
          <div className="max-w-xl text-left space-y-5">
            <div className="flex items-center space-x-3">
              <span className="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.32em] text-[#E5C158] font-semibold">
                Fragrance World 01
              </span>
              <span className="w-8 h-[1px] bg-[#E5C158]/40" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#D8A48F]">
                Collection Privée
              </span>
            </div>

            <h2 className="font-serif-luxury text-5xl sm:text-7xl md:text-8xl text-[#FFF7E6] tracking-wide uppercase font-light leading-[1.05] drop-shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
              Élixir <br />
              <span className="italic font-normal gold-gradient-text">de Rose</span>
            </h2>

            <div className="space-y-3 border-l border-[#D4AF37]/30 pl-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[#E5D7C0]/80">
                Eau de Parfum Intense • 100ml
              </p>
              <p className="text-sm sm:text-base text-[#FDF2EC]/90 font-light leading-relaxed max-w-md drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                An intoxicating voyage through blooming royal gardens at dawn. Radiant Damask rose petals intertwined with pink peppercorn and warm golden amber.
              </p>
            </div>

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

            <div className="flex items-center gap-2.5 sm:gap-3.5 md:gap-4 pt-3 sm:pt-4">
              <CinematicAcquireButton
                worldNumber={1}
                className="inline-flex items-center justify-center px-5 py-2.5 sm:px-7 sm:py-3 md:px-8 md:py-3.5 rounded-full bg-[#D4AF37] border border-[#D4AF37] text-[#080809] text-[10px] sm:text-[11px] md:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] md:tracking-[0.25em] font-semibold leading-none whitespace-nowrap hover:bg-[#E5C158] hover:border-[#E5C158] transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:shadow-[0_0_35px_rgba(229,193,88,0.55)]"
              />
              <Link
                href="/fragrances"
                className="inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 md:px-7 md:py-3.5 rounded-full border border-[#E5C158]/40 text-[#FFF3D1] text-[10px] sm:text-[11px] md:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] md:tracking-[0.25em] leading-none whitespace-nowrap hover:border-[#E5C158] hover:bg-[#121215]/50 transition-all duration-300"
              >
                Explore Notes
              </Link>
            </div>
          </div>

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
