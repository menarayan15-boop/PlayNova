import React from "react"
import HeroSection from "@/components/sections/HeroSection"
import FeaturesSection from "@/components/sections/FeaturesSection"
import VideoShowcase from "@/components/sections/VideoShowcase"
import BenefitsSection from "@/components/sections/BenefitsSection"
import CtaSection from "@/components/sections/CtaSection"
import { fetchVideos } from "@/services/api"

export default async function HomePage() {
  const videos = await fetchVideos()

  return (
    <div className="relative w-full overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <VideoShowcase initialVideos={videos} />
      <BenefitsSection />
      <CtaSection />
    </div>
  )
}

