import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} Storefront`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} Storefront`,
    description: siteConfig.description,
    type: "website",
  },
};

export default function StorefrontLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
