import React from "react"
import dynamic from "next/dynamic"
import HeroSection from "@/components/sections/HeroSection"
import HomeSearchSection from "@/components/sections/HomeSearchSection"
import ContinueWatchingSection from "@/components/sections/ContinueWatchingSection"

// Unified deduplicated DB-backed homepage sections (Featured, Trending, Recently Added, Recommended, Category Rows)
const DynamicHomepageSections = dynamic(
  () => import("@/components/sections/DynamicHomepageSections")
)
const HomeWatchlistSection = dynamic(() => import("@/components/sections/HomeWatchlistSection"))
const CategoryExplorerSection = dynamic(() => import("@/components/sections/CategoryExplorerSection"))
const WatchAgainSection = dynamic(() => import("@/components/sections/WatchAgainSection"))
const BenefitsSection = dynamic(() => import("@/components/sections/BenefitsSection"))
const CtaSection = dynamic(() => import("@/components/sections/CtaSection"))

export default function HomePage() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* 1. Hero with custom HTML5 video player */}
      <HeroSection />

      {/* 2. Instant Search & Topic Explorer */}
      <HomeSearchSection />

      {/* 3. Continue Watching (Contextual user progress — intentional overlap allowed) */}
      <ContinueWatchingSection />

      {/* 4. Deduplicated Dynamic Sections: Featured, Trending, Recently Added, Recommended & Category Rows */}
      <DynamicHomepageSections />

      {/* 5. User Watchlist (if saved items exist) */}
      <HomeWatchlistSection />

      {/* 6. Category Taxonomy Visual Explorer */}
      <CategoryExplorerSection />

      {/* 7. Completed Videos (Watch Again) */}
      <WatchAgainSection />

      {/* 8. Platform Architecture Benefits */}
      <BenefitsSection />

      {/* 9. Final Call to Action */}
      <CtaSection />
    </div>
  )
}
