"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";

export function StorefrontBrandLogo() {
  const pathname = usePathname();

  const brandContent = (
    <span className="text-2xl sm:text-3xl font-serif tracking-[0.38em] gold-gradient-text font-bold drop-shadow-[0_2px_18px_rgba(229,193,88,0.5)] select-none leading-none">
      AURA
    </span>
  );

  if (pathname === "/") {
    return (
      <a
        className="storefront-brand flex items-center group cursor-pointer text-decoration-none"
        href="#hero"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        aria-label={`${siteConfig.name} home`}
      >
        {brandContent}
      </a>
    );
  }

  return (
    <Link
      className="storefront-brand flex items-center group cursor-pointer text-decoration-none"
      href="/"
      aria-label={`${siteConfig.name} home`}
    >
      {brandContent}
    </Link>
  );
}
