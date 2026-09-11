"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { storefrontNavigation } from "@/config/storefront-navigation";

// Only show these items — "Gifts" removed from desktop nav
const secondaryLabels = ["New Arrivals", "About"] as const;

export function StorefrontSecondaryNav() {
  const pathname = usePathname();

  return (
    <nav className="storefront-secondary-nav" aria-label="Secondary storefront navigation">
      <ul>
        {storefrontNavigation
          .filter((item) => secondaryLabels.includes(item.label as (typeof secondaryLabels)[number]))
          .map((item) => {
            const isActive = Boolean(item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`)));

            return (
              <li key={item.label}>
                {item.status === "available" && item.href ? (
                  <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                    {item.label}
                  </Link>
                ) : (
                  <span className="storefront-nav-item--planned" aria-disabled="true" title="Coming soon">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
