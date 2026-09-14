"use client";

import React, { useEffect, useRef, useState } from "react";

const worldIds = ["world-1", "world-2", "world-3"];
const WORLD_LABELS = [
  "Élixir de Rose",
  "Noir Cashmere",
  "Citrus Vetiver",
];

const STEP_PX = 42; // vertical spacing between ticks

export default function WorldProgressRail() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let world1Revealed = false;

    const onWorld1Visibility = (e: Event) => {
      const detail = (e as CustomEvent<{ visible: boolean }>).detail;
      world1Revealed = detail.visible;
      updateRail();
    };
    window.addEventListener("aura:world1-visibility", onWorld1Visibility);

    const updateRail = () => {
      const vh = window.innerHeight;
      const centerY = vh / 2;

      const el2 = document.getElementById("world-2");
      const el3 = document.getElementById("world-3");

      const rect2 = el2?.getBoundingClientRect();
      const rect3 = el3?.getBoundingClientRect();

      // If user has scrolled past World 3 into reviews or footer
      if (rect3 && rect3.bottom <= centerY) {
        setVisible(false);
        return;
      }

      // Check World 3
      if (rect3 && rect3.top <= centerY && rect3.bottom > centerY) {
        setActiveIndex(2);
        setVisible(true);
        return;
      }

      // Check World 2
      if (rect2 && rect2.top <= centerY && rect2.bottom > centerY) {
        setActiveIndex(1);
        setVisible(true);
        return;
      }

      // Check World 1
      // World 1 lives in the hero portal. It is active once scrolled into the portal (scrollY >= 450 or world1Revealed)
      // and before World 2 reaches the center of the viewport.
      const isPastWorld1Start = world1Revealed || window.scrollY >= 450;
      const isBeforeWorld2 = !rect2 || rect2.top > centerY;

      if (isPastWorld1Start && isBeforeWorld2 && window.scrollY >= 380) {
        setActiveIndex(0);
        setVisible(true);
        return;
      }

      // Above World 1 (Initial Hero Screen "Enter the World of Fragrance")
      setVisible(false);
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateRail();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // Initial check
    updateRail();

    return () => {
      window.removeEventListener("aura:world1-visibility", onWorld1Visibility);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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
