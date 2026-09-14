"use client";

import { useState, useTransition } from "react";

import { publishCartView, requestCartDrawerOpen } from "@/lib/cart-events";
import { acquireCinematicWorld } from "@/server/cinematic/cinematic-actions";

export default function CinematicAcquireButton({
  worldNumber,
  className,
  accent,
  align = "left",
}: {
  worldNumber: number;
  className: string;
  accent?: string;
  align?: "left" | "right";
}) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "success" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  const acquire = () => {
    if (isPending) return;
    setMessage("Preparing your fragrance...");
    setState("idle");
    startTransition(async () => {
      const response = await acquireCinematicWorld({ worldNumber });
      if (!response.ok) {
        setMessage(response.error.message || "This fragrance cannot be added right now.");
        setState("error");
        return;
      }
      publishCartView(response.cart);
      setMessage("Added to your bag.");
      setState("success");
      requestCartDrawerOpen();
    });
  };

  const isRight = align === "right";

  return (
    <div className={`relative inline-flex flex-col ${isRight ? "items-end" : "items-start"}`}>
      <button
        type="button"
        className={`${className} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-wait disabled:opacity-60`}
        style={accent ? { outlineColor: accent } : undefined}
        onClick={acquire}
        disabled={isPending}
        aria-busy={isPending}
        aria-describedby={`cinematic-acquire-status-${worldNumber}`}
      >
        {isPending ? "Acquiring..." : "Acquire"}
      </button>
      <span
        id={`cinematic-acquire-status-${worldNumber}`}
        className={`absolute top-full ${isRight ? "right-0 text-right" : "left-0 text-left"} mt-2 whitespace-nowrap text-[10px] uppercase tracking-[0.16em] text-[#F5E4B5] pointer-events-none transition-opacity duration-300 ${message ? "opacity-100" : "opacity-0"}`}
        role={state === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        {message}
      </span>
    </div>
  );
}
