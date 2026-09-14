"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";
import CinematicAcquireButton from "./CinematicAcquireButton";

type Layout = "left" | "right";
type Entrance = "up" | "side" | "scale" | "blur";
type NotesStyle = "pills" | "underline" | "stacked";

interface FragranceWorldSectionProps {
  id: string;
  worldNumber: string;
  videoSrc: string;
  name: string;
  nameAccent: string;
  classification: string;
  description: string;
  notes: { top: string; heart: string; base: string };
  accent: string;
  layout: Layout;
  entrance: Entrance;
  notesStyle: NotesStyle;
}

export default function FragranceWorldSection({
  id,
  worldNumber,
  videoSrc,
  name,
  nameAccent,
  classification,
  description,
  notes,
  accent,
  layout,
  entrance,
  notesStyle,
}: FragranceWorldSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const isRight = layout === "right";

  const wrapperJustify = isRight ? "justify-end" : "justify-start";
  const textAlign = isRight ? "text-right items-end" : "text-left items-start";
  const headerRow = isRight ? "justify-end" : "justify-start";
  const borderSide = isRight ? "border-r pr-4" : "border-l pl-4";
  const notesJustify = isRight ? "justify-end" : "justify-start";
  const ctaJustify = isRight ? "justify-end" : "justify-start";

  // Initial letter for the seal card monogram
  const monogram = name.charAt(0).toUpperCase();

  const entranceHidden =
    entrance === "up"
      ? "opacity-0 translate-y-10"
      : entrance === "side"
        ? isRight
          ? "opacity-0 translate-x-16"
          : "opacity-0 -translate-x-16"
        : entrance === "scale"
          ? "opacity-0 scale-90"
          : "opacity-0 blur-md";
  const entranceShown = "opacity-100 translate-y-0 translate-x-0 scale-100 blur-none";

  return (
    <section
      ref={sectionRef}
      id={id}
      className="relative w-full h-screen overflow-hidden bg-[#080809]"
    >
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full">
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover object-center"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div
          className={`absolute inset-0 ${
            isRight
              ? "bg-gradient-to-l from-[#080809]/85 via-[#080809]/40 to-transparent"
              : "bg-gradient-to-r from-[#080809]/85 via-[#080809]/40 to-transparent"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080809]/80 via-transparent to-[#080809]/40" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 55% 45% at ${isRight ? "80%" : "20%"} 50%, ${accent}20 0%, transparent 70%)`,
          }}
        />

        {/* Drifting accent particles for ambient depth */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="drift-particle absolute rounded-full pointer-events-none"
            style={{
              width: 4 - i,
              height: 4 - i,
              left: isRight ? `${12 + i * 6}%` : `${78 - i * 6}%`,
              bottom: `${15 + i * 12}%`,
              background: accent,
              boxShadow: `0 0 8px ${accent}`,
              animationDelay: `${i * 1.3}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className={`relative z-10 w-full h-full flex items-center ${wrapperJustify} max-w-7xl mx-auto px-6 sm:px-12 md:px-16`}>
        <div
          className={`flex flex-col max-w-xl ${textAlign} space-y-6 transition-all duration-[1100ms] ease-out ${
            isVisible ? entranceShown : entranceHidden
          }`}
        >
          <div className={`flex items-center space-x-3 ${headerRow}`}>
            <span className="text-xs uppercase tracking-[0.35em] font-medium" style={{ color: accent }}>
              Fragrance World {worldNumber}
            </span>
            <span className="w-8 h-[1px]" style={{ background: `${accent}66` }} />
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#D8A48F]">
              Collection Privée
            </span>
          </div>

          <h2 className="font-serif-luxury text-5xl sm:text-7xl md:text-8xl text-[#FFF7E6] tracking-wide uppercase font-light leading-[1.05] drop-shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
            {name} <br />
            <span
              className="italic font-normal"
              style={{
                background: `linear-gradient(135deg, #FFF0CA 0%, ${accent} 55%, #B8860B 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {nameAccent}
            </span>
          </h2>

          <div className={`space-y-3 ${borderSide}`} style={borderSide ? { borderColor: `${accent}4d` } : undefined}>
            <p className="text-xs uppercase tracking-[0.25em] text-[#E5D7C0]/80">
              {classification}
            </p>
            <p className="text-sm sm:text-base text-[#FDF2EC]/90 font-light leading-relaxed max-w-md drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {description}
            </p>
          </div>

          {notesStyle === "pills" && (
            <div className={`flex flex-wrap gap-2 pt-2 ${notesJustify}`}>
              {(["top", "heart", "base"] as const).map((key) => (
                <span
                  key={key}
                  className="text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 whitespace-nowrap rounded-full bg-[#0D0D0E]/60 backdrop-blur-md border text-[#F5E4B5]"
                  style={{ borderColor: `${accent}4d` }}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}: {notes[key]}
                </span>
              ))}
            </div>
          )}

          {notesStyle === "underline" && (
            <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 ${notesJustify}`}>
              {(["top", "heart", "base"] as const).map((key, i) => (
                <span key={key} className="flex items-center gap-x-5">
                  {i > 0 && <span className="w-1 h-1 rounded-full" style={{ background: accent }} />}
                  <span
                    className="text-[11px] uppercase tracking-[0.2em] text-[#F5E4B5] border-b pb-1"
                    style={{ borderColor: `${accent}80` }}
                  >
                    {notes[key]}
                  </span>
                </span>
              ))}
            </div>
          )}

          {notesStyle === "stacked" && (
            <div className={`flex flex-col gap-2 pt-2 ${textAlign}`}>
              {(["top", "heart", "base"] as const).map((key) => (
                <div key={key} className="flex items-baseline gap-3">
                  <span className="text-[9px] uppercase tracking-[0.25em]" style={{ color: accent }}>
                    {key}
                  </span>
                  <span className="text-[12px] uppercase tracking-[0.15em] text-[#F5E4B5]">
                    {notes[key]}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className={`flex items-center gap-4 pt-4 ${ctaJustify}`}>
            <CinematicAcquireButton
              worldNumber={Number(worldNumber)}
              className="inline-flex items-center justify-center px-9 py-4 rounded-full bg-[#D4AF37] border border-[#D4AF37] text-[#080809] text-xs uppercase tracking-[0.25em] font-semibold leading-none whitespace-nowrap hover:bg-[#E5C158] hover:border-[#E5C158] transition-all duration-300 shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(229,193,88,0.55)]"
              accent={accent}
              align={isRight ? "right" : "left"}
            />
            <Link
              href="/fragrances"
              className="inline-flex items-center justify-center px-7 py-4 rounded-full border text-[#FFF3D1] text-xs uppercase tracking-[0.25em] leading-none whitespace-nowrap hover:bg-[#121215]/50 transition-all duration-300"
              style={{ borderColor: `${accent}66` }}
            >
              Explore Notes
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Seal Card — a distinct visual element on the side opposite the text,
          so it never fights the copy for space and adds a real graphic beyond just text. */}
      <div
        className={`hidden lg:flex absolute top-28 z-20 flex-col items-center gap-3 seal-float transition-all duration-[1300ms] ease-out ${
          isRight ? "left-14 xl:left-20" : "right-14 xl:right-20"
        } ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
        style={{ transitionDelay: isVisible ? "300ms" : "0ms" }}
      >
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Rotating dashed accent ring */}
          <div
            className="absolute inset-0 rounded-full seal-ring-spin"
            style={{ border: `1px dashed ${accent}80` }}
          />
          {/* Glass core */}
          <div
            className="absolute inset-2 rounded-full backdrop-blur-md flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 35% 30%, ${accent}33 0%, rgba(13,13,14,0.7) 70%)`,
              border: `1px solid ${accent}55`,
              boxShadow: `0 0 22px ${accent}30, inset 0 1px 2px rgba(255,255,255,0.15)`,
            }}
          >
            <span
              className="font-serif-luxury text-3xl italic"
              style={{
                background: `linear-gradient(135deg, #FFF0CA 0%, ${accent} 60%, #B8860B 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {monogram}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-0.5">
          <span className="text-[9px] uppercase tracking-[0.25em]" style={{ color: accent }}>
            World {worldNumber}
          </span>
          <span className="text-[9px] uppercase tracking-[0.15em] text-[#F5E4B5]/70 whitespace-nowrap">
            {classification}
          </span>
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
    </section>
  );
}
