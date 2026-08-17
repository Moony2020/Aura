import Navbar from "@/components/Navbar";
import HeroPortalExperience from "@/components/HeroPortalExperience";
import FragranceWorlds from "@/components/FragranceWorlds";
import WorldProgressRail from "@/components/WorldProgressRail";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#080809] text-[#FDF2EC]">
      {/* Global Navbar */}
      <Navbar />

      {/* Phase 1: Core Hero Portal & World 1 Experience */}
      <HeroPortalExperience />

      {/* Fragrance Worlds 2-6 (scroll-snap so each world settles fully into view) */}
      <FragranceWorlds />

      {/* Gold scroll-progress rail (right side, tracks World 1-6) */}
      <WorldProgressRail />

      <Footer />
    </main>
  );
}
