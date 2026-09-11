import Link from "next/link";
import { unstable_cache } from "next/cache";
import { User } from "lucide-react";
import { MongoCollectionRepository } from "@/server/repositories/mongo-collection-repository";
import { StorefrontMegaMenu } from "./StorefrontMegaMenu";
import { StorefrontSecondaryNav } from "./StorefrontSecondaryNav";
import { StorefrontSearchAction } from "./StorefrontSearchAction";
import { StorefrontCartAction } from "./StorefrontCartAction";
import { StorefrontWishlistAction } from "./StorefrontWishlistAction";
import { StorefrontBrandLogo } from "./StorefrontBrandLogo";
import { SidebarNavigation } from "./SidebarNavigation";

const getVisibleCollectionsForNavigation = unstable_cache(
  async () => {
    try {
      const visibleCollections = await new MongoCollectionRepository().listVisible();
      return visibleCollections.map((collection) => ({ slug: collection.slug, name: collection.name }));
    } catch {
      return [];
    }
  },
  ["storefront-visible-collections"],
  { revalidate: 300 },
);

let visibleCollectionsSnapshot: { expiresAt: number; value: Array<{ slug: string; name: string }> } | null = null;
let visibleCollectionsPromise: Promise<Array<{ slug: string; name: string }>> | null = null;

async function readVisibleCollectionsForNavigation() {
  if (visibleCollectionsSnapshot && visibleCollectionsSnapshot.expiresAt > Date.now()) return visibleCollectionsSnapshot.value;
  visibleCollectionsPromise ??= getVisibleCollectionsForNavigation();
  try {
    const value = await visibleCollectionsPromise;
    visibleCollectionsSnapshot = { expiresAt: Date.now() + 300_000, value };
    return value;
  } finally {
    visibleCollectionsPromise = null;
  }
}

export async function StorefrontHeaderShell() {
  const collections = await readVisibleCollectionsForNavigation();

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-[rgba(229,193,88,0.15)] bg-[rgba(12,10,14,0.28)] backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.15)] transition-all duration-300">
      <div className="w-full flex items-center justify-between min-h-[4.5rem] py-2.5 px-3 sm:px-5 lg:px-6">

        {/* Left: Sidebar trigger + Desktop mega nav (shrink-0 so left side never compresses) */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Sidebar hamburger (all breakpoints) */}
          <SidebarNavigation collections={collections} />

          {/* Desktop mega-nav links (hidden on mobile/tablet) */}
          <div className="hidden xl:flex items-center gap-6 shrink-0">
            <StorefrontMegaMenu collections={collections} />
            <StorefrontSecondaryNav />
          </div>
        </div>

        {/* Center: Brand Logo */}
        <div className="flex items-center justify-center px-4 shrink-0">
          <StorefrontBrandLogo />
        </div>

        {/* Right: Action icons (Search, Account, Wishlist, Cart) */}
        <div className="flex items-center justify-end gap-0.5 sm:gap-1 shrink-0" aria-label="Storefront actions">
          <StorefrontSearchAction />
          <Link
            className="p-2 text-[#c2b8a3] hover:text-[#e5c982] transition-colors flex items-center justify-center cursor-pointer"
            href="/account"
            aria-label="Account profile"
            title="Account"
          >
            <User className="w-5 h-5" strokeWidth={1.5} />
          </Link>
          <StorefrontWishlistAction />
          <StorefrontCartAction />
        </div>
      </div>
    </header>
  );
}
