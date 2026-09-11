import Footer from "@/components/Footer";
import FragranceWorlds from "@/components/FragranceWorlds";
import HeroPortalExperience from "@/components/HeroPortalExperience";
import { MaisonReviewsCarousel } from "@/components/storefront/MaisonReviewsCarousel";
import { StorefrontHeaderShell } from "@/components/storefront/StorefrontHeaderShell";
import WorldProgressRail from "@/components/WorldProgressRail";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#080809] text-[#FDF2EC]">
      <div className="fixed top-0 left-0 right-0 z-[240] pointer-events-none [&>*]:pointer-events-auto">
        <StorefrontHeaderShell />
      </div>
      <HeroPortalExperience />
      <FragranceWorlds />
      <WorldProgressRail />
      <MaisonReviewsCarousel />
      <Footer />
    </main>
  );
}
