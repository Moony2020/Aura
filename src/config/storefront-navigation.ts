export type StorefrontNavigationItem = {
  label: string;
  href?: string;
  status: "available" | "planned";
};

export const storefrontNavigation: readonly StorefrontNavigationItem[] = [
  { label: "Fragrances", href: "/fragrances", status: "available" },
  { label: "Collections", href: "/collections", status: "available" },
  { label: "New Arrivals", href: "/new-arrivals", status: "available" },
  { label: "Gifts", status: "planned" },
  { label: "About", href: "/about", status: "available" },
] as const;

export const storefrontActionLabels = ["Search", "Account", "Shopping bag"] as const;

export const fragranceMegaMenuGroups = [
  { heading: "By wearer", items: ["Women", "Men", "Unisex", "Discovery Sets"] },
  { heading: "By olfactive family", items: ["Floral", "Woody", "Amber", "Citrus", "Fresh", "Oud", "Musk"] },
  { heading: "Curated", items: ["New Arrivals", "Best Sellers"] },
] as const;

export const fragranceAudienceNavigation = [
  { label: "Women", href: "/fragrances/women" },
  { label: "Men", href: "/fragrances/men" },
  { label: "Unisex", href: "/fragrances/unisex" },
  { label: "New Arrivals", href: "/new-arrivals" },
] as const;

export const collectionsMegaMenuEditorial = {
  eyebrow: "Curated by AURA",
  copy: "Explore the Maison through considered scent families and enduring compositions.",
} as const;
