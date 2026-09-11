export const siteConfig = {
  name: "AURA",
  legalName: "AURA Luxury Fragrance",
  category: "Haute Parfumerie",
  description:
    "Enter the world of AURA Haute Parfumerie. Discover timeless luxury fragrances crafted to leave an unforgettable impression.",
  locale: "en",
  currency: "USD",
} as const;

export type SiteConfig = typeof siteConfig;
