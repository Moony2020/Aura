"use client";

import React, { useEffect, useRef, useState } from "react";

const worldIds = ["world-1", "world-2", "world-3", "world-4", "world-5", "world-6"];
const WORLD_LABELS = [
  "Élixir de Rose",
  "Noir Cashmere",
  "Citrus Vetiver",
  "Amber Mystique",
  "Jasmine Nocturne",
  "Golden Santal",
];

const STEP_PX = 42; // vertical spacing between ticks

export default function WorldProgressRail() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  // Persistent visibility ratio per section — survives partial IntersectionObserver
  // batches so the rail never blanks out just because a given tick didn't include
  // every section's entry.
  const ratiosRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const recompute = () => {
      const isFooterVisible = (ratiosRef.current["footer"] ?? 0) > 0.05;
      if (isFooterVisible) {
        setVisible(false);
        return;
      }

      let bestId: string | null = null;
      let bestRatio = 0;
      worldIds.forEach((id) => {
        const ratio = ratiosRef.current[id] ?? 0;
        if (ratio >= bestRatio && ratio > 0) {
          bestRatio = ratio;
          bestId = id;
        }
      });

      if (bestId) setActiveIndex(worldIds.indexOf(bestId));
      setVisible(bestRatio > 0.05);
    };

    // World 1 lives inside the pinned Hero container at opacity 0 until its GSAP
    // reveal — it's geometrically "fully visible" to IntersectionObserver from the
    // very first frame, so its actual visibility comes from HeroPortalExperience's
    // scroll-driven reveal event instead of DOM geometry.
    const onWorld1Visibility = (e: Event) => {
      const detail = (e as CustomEvent<{ visible: boolean }>).detail;
      ratiosRef.current["world-1"] = detail.visible ? 1 : 0;
      recompute();
    };
    window.addEventListener("aura:world1-visibility", onWorld1Visibility);

    // Worlds 2-6 and Footer are ordinary in-flow sections, so real geometric intersection works.
    const sections = worldIds
      .slice(1)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const footerEl = document.getElementById("footer");
    const targetsToObserve = [...sections, ...(footerEl ? [footerEl] : [])];

    let observer: IntersectionObserver | null = null;
    if (targetsToObserve.length > 0) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            ratiosRef.current[entry.target.id] = entry.intersectionRatio;
            // When any of world-2..6 comes into viewport, clear world-1 override
            if (entry.target.id !== "footer" && entry.intersectionRatio > 0.2) {
              ratiosRef.current["world-1"] = 0;
            }
          });
          recompute();
        },
        { threshold: [0, 0.05, 0.15, 0.3, 0.5, 0.75, 1] }
      );
      targetsToObserve.forEach((target) => observer!.observe(target));
    }

    return () => {
      window.removeEventListener("aura:world1-visibility", onWorld1Visibility);
      observer?.disconnect();
    };
  }, []);

  const scrollToWorld = (id: string) => {
    if (id === "world-1") {
      window.scrollTo({ top: 1050, behavior: "smooth" });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const trackHeight = (worldIds.length - 1) * STEP_PX;

  return (
    <div
      className={`hidden md:flex fixed right-6 lg:right-9 top-1/2 -translate-y-1/2 z-[60] flex-col items-center transition-opacity duration-500 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative flex flex-col items-center" style={{ height: trackHeight + 24 }}>
        {/* Track line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-3 bottom-3 w-px bg-gradient-to-b from-transparent via-[#E5C158]/45 to-transparent" />

        {/* Sliding glow marker, follows the active world */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#E5C158] shadow-[0_0_16px_6px_rgba(229,193,88,0.7)] transition-[top] duration-700 ease-out"
          style={{ top: 11 + (activeIndex / (worldIds.length - 1)) * trackHeight }}
        />

        {worldIds.map((id, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollToWorld(id)}
              aria-label={`Go to Fragrance World ${index + 1}: ${WORLD_LABELS[index]}`}
              aria-current={isActive}
              className="group absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 -ml-4"
              style={{ top: 12 + (index / (worldIds.length - 1)) * trackHeight - 16 }}
            >
              <span
                className={`text-[10px] font-bold tracking-wider transition-all duration-500 ease-out ${
                  isActive
                    ? "text-[#FFF3D1] scale-125 drop-shadow-[0_0_8px_rgba(229,193,88,0.95)]"
                    : "text-[#E5C158]/70 group-hover:text-[#FFF3D1] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap text-[9px] uppercase tracking-[0.25em] text-[#F5E4B5] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#0D0D0E]/80 backdrop-blur-md border border-[#E5C158]/20 rounded-full px-3 py-1">
                {WORLD_LABELS[index]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
