import React from "react"
import HeroSection from "@/components/sections/HeroSection"
import HomeSearchSection from "@/components/sections/HomeSearchSection"
import ContinueWatchingSection from "@/components/sections/ContinueWatchingSection"
import RecommendationsSection from "@/components/sections/RecommendationsSection"
import TrendingSection from "@/components/sections/TrendingSection"
import HomeWatchlistSection from "@/components/sections/HomeWatchlistSection"
import CategoryExplorerSection from "@/components/sections/CategoryExplorerSection"
import WatchAgainSection from "@/components/sections/WatchAgainSection"
import VideoShowcase from "@/components/sections/VideoShowcase"
import BenefitsSection from "@/components/sections/BenefitsSection"
import CtaSection from "@/components/sections/CtaSection"
import { fetchVideos } from "@/services/api"

export default async function HomePage() {
  const videos = await fetchVideos()

  return (
    <div className="relative w-full overflow-hidden">
      {/* 1. Hero with custom HTML5 video player */}
      <HeroSection />

      {/* 2. Instant Search & Topic Explorer */}
      <HomeSearchSection />

      {/* 3. Continue Watching (MongoDB watchProgress) */}
      <ContinueWatchingSection />

      {/* 4. Personalized / Curated Recommendations */}
      <RecommendationsSection />

      {/* 5. Trending Streams */}
      <TrendingSection />

      {/* 6. User Watchlist (if saved items exist) */}
      <HomeWatchlistSection />

      {/* 7. Category Taxonomy Visual Explorer */}
      <CategoryExplorerSection />

      {/* 8. Completed Videos (Watch Again) */}
      <WatchAgainSection />

      {/* 9. Curated Video Showcase */}
      <VideoShowcase initialVideos={videos} />

      {/* 10. Platform Architecture Benefits */}
      <BenefitsSection />

      {/* 11. Final Call to Action */}
      <CtaSection />
    </div>
  )
}
