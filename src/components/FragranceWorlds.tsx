"use client";

import React, { useEffect, useRef } from "react";
import FragranceWorldSection from "./FragranceWorldSection";
import { publicEnv } from "@/config/env.public";

const WORLD_2_VIDEO_URL =
  publicEnv.NEXT_PUBLIC_CLOUDINARY_WORLD_2_VIDEO_URL ||
  "https://res.cloudinary.com/dcru4if6j/video/upload/v1786968035/2_lvv254.mp4";

const WORLD_3_VIDEO_URL =
  publicEnv.NEXT_PUBLIC_CLOUDINARY_WORLD_3_VIDEO_URL ||
  "https://res.cloudinary.com/dcru4if6j/video/upload/v1786968075/3_umsmqe.mp4";

const worlds = [
  {
    id: "world-2",
    worldNumber: "02",
    videoSrc: WORLD_2_VIDEO_URL,
    name: "Noir",
    nameAccent: "Cashmere",
    classification: "Eau de Parfum • 100ml",
    description:
      "A velvety oriental woven from black pepper and cashmere wood, settling into a warm veil of vanilla and musk.",
    notes: { top: "Black Pepper", heart: "Cashmere Wood", base: "Vanilla & Musk" },
    accent: "#A09DC8",
    layout: "right" as const,
    entrance: "side" as const,
    notesStyle: "pills" as const,
  },
  {
    id: "world-3",
    worldNumber: "03",
    videoSrc: WORLD_3_VIDEO_URL,
    name: "Citrus",
    nameAccent: "Vetiver",
    classification: "Eau de Parfum • 100ml",
    description:
      "A crisp aromatic escape opening with bergamot, grounded by earthy vetiver and a whisper of clean white musk.",
    notes: { top: "Bergamot", heart: "Vetiver", base: "White Musk" },
    accent: "#A8C89D",
    layout: "right" as const,
    entrance: "side" as const,
    notesStyle: "underline" as const,
  },
];

const WHEEL_THRESHOLD = 30;
const SWIPE_THRESHOLD = 50;

export default function FragranceWorlds() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLocked = useRef(false);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getSections = () =>
      Array.from(container.querySelectorAll<HTMLElement>("[data-world-section]"));

    const getCurrentPosition = (): "hero" | 0 | 1 | "reviews" => {
      const sections = getSections();
      if (sections.length < 2) return "hero";

      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      const top2 = sections[0].offsetTop;
      const top3 = sections[1].offsetTop;
      const bottom3 = top3 + sections[1].offsetHeight;

      // Above World 2
      if (scrollY < top2 - vh * 0.35) {
        return "hero";
      }

      // Past World 3
      if (scrollY > bottom3 - vh * 0.35) {
        return "reviews";
      }

      // Inside Worlds 2, 3
      const diff2 = Math.abs(scrollY - top2);
      const diff3 = Math.abs(scrollY - top3);

      if (diff2 <= diff3) return 0;
      return 1;
    };

    const absorbCooldown = () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      cooldownTimer.current = setTimeout(() => {
        isLocked.current = false;
      }, 300);
    };

    const scrollToTarget = (targetEl: HTMLElement | null) => {
      if (!targetEl) return;
      isLocked.current = true;
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });

      if (animTimer.current) clearTimeout(animTimer.current);
      animTimer.current = setTimeout(() => {
        absorbCooldown();
      }, 700);
    };

    const scrollToWorld1 = () => {
      isLocked.current = true;
      window.scrollTo({ top: 1050, behavior: "smooth" });

      if (animTimer.current) clearTimeout(animTimer.current);
      animTimer.current = setTimeout(() => {
        absorbCooldown();
      }, 700);
    };

    const onWheel = (e: WheelEvent) => {
      const pos = getCurrentPosition();
      const sections = getSections();
      if (sections.length < 2) return;

      const bottom3 = sections[1].offsetTop + sections[1].offsetHeight;
      const isNearWorld3FromBelow = pos === "reviews" && window.scrollY <= bottom3 + 80;

      // If locked, absorb event to prevent rapid momentum skips
      if (isLocked.current) {
        if (pos !== "reviews" || (isNearWorld3FromBelow && e.deltaY < 0)) {
          e.preventDefault();
        }
        absorbCooldown();
        return;
      }

      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;

      if (e.deltaY > 0) {
        // Scrolling DOWN
        if (pos === "hero") {
          if (window.scrollY >= 980) {
            e.preventDefault();
            scrollToTarget(sections[0]);
          }
        } else if (pos === 0) {
          e.preventDefault();
          scrollToTarget(sections[1]);
        } else if (pos === 1) {
          e.preventDefault();
          scrollToTarget(document.getElementById("reviews"));
        }
      } else {
        // Scrolling UP
        if (isNearWorld3FromBelow) {
          e.preventDefault();
          scrollToTarget(sections[1]);
        } else if (pos === 1) {
          e.preventDefault();
          scrollToTarget(sections[0]);
        } else if (pos === 0) {
          e.preventDefault();
          scrollToWorld1();
        }
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isLocked.current) return;
      const deltaY = touchStartY.current - e.touches[0].clientY;
      if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;

      const pos = getCurrentPosition();
      const sections = getSections();
      if (sections.length < 2) return;

      const bottom3 = sections[1].offsetTop + sections[1].offsetHeight;
      const isNearWorld3FromBelow = pos === "reviews" && window.scrollY <= bottom3 + 80;

      if (deltaY > 0) {
        if (pos === 0) {
          e.preventDefault();
          scrollToTarget(sections[1]);
        } else if (pos === 1) {
          e.preventDefault();
          scrollToTarget(document.getElementById("reviews"));
        }
      } else {
        if (isNearWorld3FromBelow) {
          e.preventDefault();
          scrollToTarget(sections[1]);
        } else if (pos === 1) {
          e.preventDefault();
          scrollToTarget(sections[0]);
        } else if (pos === 0) {
          e.preventDefault();
          scrollToWorld1();
        }
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      if (animTimer.current) clearTimeout(animTimer.current);
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <div ref={containerRef}>
      {worlds.map((world) => (
        <div key={world.id} data-world-section>
          <FragranceWorldSection {...world} />
        </div>
      ))}
    </div>
  );
}
