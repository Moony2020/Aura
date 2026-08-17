"use client";

import React, { useEffect, useRef } from "react";
import FragranceWorldSection from "./FragranceWorldSection";

const WORLD_2_VIDEO_URL =
  process.env.NEXT_PUBLIC_CLOUDINARY_WORLD_2_VIDEO_URL ||
  "https://res.cloudinary.com/dcru4if6j/video/upload/v1786968035/2_lvv254.mp4";

const WORLD_3_VIDEO_URL =
  process.env.NEXT_PUBLIC_CLOUDINARY_WORLD_3_VIDEO_URL ||
  "https://res.cloudinary.com/dcru4if6j/video/upload/v1786968075/3_umsmqe.mp4";

const WORLD_4_VIDEO_URL =
  process.env.NEXT_PUBLIC_CLOUDINARY_WORLD_4_VIDEO_URL ||
  "https://res.cloudinary.com/dcru4if6j/video/upload/v1786968025/4_qsri4s.mp4";

const WORLD_5_VIDEO_URL =
  process.env.NEXT_PUBLIC_CLOUDINARY_WORLD_5_VIDEO_URL ||
  "https://res.cloudinary.com/dcru4if6j/video/upload/v1786968023/5_gjmelu.mp4";

const WORLD_6_VIDEO_URL =
  process.env.NEXT_PUBLIC_CLOUDINARY_WORLD_6_VIDEO_URL ||
  "https://res.cloudinary.com/dcru4if6j/video/upload/v1786968028/6_nlyw46.mp4";

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
    price: "$295",
    accent: "#A09DC8",
    layout: "left" as const,
    entrance: "up" as const,
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
    price: "$260",
    accent: "#A8C89D",
    layout: "right" as const,
    entrance: "side" as const,
    notesStyle: "underline" as const,
  },
  {
    id: "world-4",
    worldNumber: "04",
    videoSrc: WORLD_4_VIDEO_URL,
    name: "Amber",
    nameAccent: "Mystique",
    classification: "Extrait de Parfum • 100ml",
    description:
      "Saffron-laced smoke gives way to rich oud, resting on a base of amber and supple leather.",
    notes: { top: "Saffron", heart: "Oud", base: "Amber & Leather" },
    price: "$340",
    accent: "#C8A265",
    layout: "left" as const,
    entrance: "scale" as const,
    notesStyle: "stacked" as const,
  },
  {
    id: "world-5",
    worldNumber: "05",
    videoSrc: WORLD_5_VIDEO_URL,
    name: "Jasmine",
    nameAccent: "Nocturne",
    classification: "Eau de Parfum • 100ml",
    description:
      "A moonlit floral bouquet of jasmine sambac and pink pepper, softened by warm sandalwood.",
    notes: { top: "Pink Pepper", heart: "Jasmine Sambac", base: "Sandalwood" },
    price: "$275",
    accent: "#C8C0A5",
    layout: "right" as const,
    entrance: "blur" as const,
    notesStyle: "pills" as const,
  },
  {
    id: "world-6",
    worldNumber: "06",
    videoSrc: WORLD_6_VIDEO_URL,
    name: "Golden",
    nameAccent: "Santal",
    classification: "Eau de Parfum Intense • 100ml",
    description:
      "Warm cardamom and creamy santal wood unfold into a sweet, resinous trail of tonka bean.",
    notes: { top: "Cardamom", heart: "Santal", base: "Tonka Bean" },
    price: "$310",
    accent: "#E5C158",
    layout: "left" as const,
    entrance: "up" as const,
    notesStyle: "underline" as const,
  },
];

const TRANSITION_LOCK_MS = 1100;
const WHEEL_THRESHOLD = 12;
const SWIPE_THRESHOLD = 40;

export default function FragranceWorlds() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInZone = useRef(false);
  const isAnimating = useRef(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getSections = () =>
      Array.from(container.querySelectorAll<HTMLElement>("[data-world-section]"));

    const zoneObserver = new IntersectionObserver(
      ([entry]) => {
        isInZone.current = entry.isIntersecting;
      },
      { threshold: 0.2 }
    );
    zoneObserver.observe(container);

    const currentIndex = () => {
      const sections = getSections();
      const viewportCenter = window.scrollY + window.innerHeight / 2;
      let index = 0;
      sections.forEach((sec, i) => {
        if (sec.offsetTop <= viewportCenter) index = i;
      });
      return index;
    };

    const goTo = (index: number) => {
      const sections = getSections();
      const clamped = Math.max(0, Math.min(sections.length - 1, index));
      const target = sections[clamped];
      if (!target) return;
      isAnimating.current = true;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        isAnimating.current = false;
      }, TRANSITION_LOCK_MS);
    };

    const onWheel = (e: WheelEvent) => {
      if (!isInZone.current) return;
      if (isAnimating.current) {
        e.preventDefault();
        return;
      }
      const index = currentIndex();
      const sections = getSections();

      if (e.deltaY > WHEEL_THRESHOLD) {
        if (index >= sections.length - 1) return; // let native scroll continue past the last world
        e.preventDefault();
        goTo(index + 1);
      } else if (e.deltaY < -WHEEL_THRESHOLD) {
        if (index <= 0) {
          // Smooth scroll back up to the Hero section
          e.preventDefault();
          isAnimating.current = true;
          document.getElementById("hero")?.scrollIntoView({ behavior: "smooth", block: "end" });
          window.setTimeout(() => {
            isAnimating.current = false;
          }, TRANSITION_LOCK_MS);
          return;
        }
        e.preventDefault();
        goTo(index - 1);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isInZone.current || isAnimating.current) return;
      const deltaY = touchStartY.current - e.touches[0].clientY;
      if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;

      const index = currentIndex();
      const sections = getSections();

      if (deltaY > 0) {
        if (index >= sections.length - 1) return;
        e.preventDefault();
        goTo(index + 1);
      } else {
        if (index <= 0) {
          // Smooth scroll back up to the Hero section
          e.preventDefault();
          isAnimating.current = true;
          document.getElementById("hero")?.scrollIntoView({ behavior: "smooth", block: "end" });
          window.setTimeout(() => {
            isAnimating.current = false;
          }, TRANSITION_LOCK_MS);
          return;
        }
        e.preventDefault();
        goTo(index - 1);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      zoneObserver.disconnect();
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
