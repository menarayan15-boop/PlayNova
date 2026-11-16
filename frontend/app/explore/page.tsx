import React from "react"
import VideoShowcase from "@/components/sections/VideoShowcase"
import { fetchVideos } from "@/services/api"

interface ExplorePageProps {
  searchParams: { cat?: string }
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const videos = await fetchVideos(searchParams.cat)

  return (
    <div className="pt-24 pb-20 bg-[#f5f4ee] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0c2f35] text-[#eef2ec] border border-white/10 shadow-xl mb-12 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#93aaa6]">
              PlayNova Discover
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight">
            Explore All Channels & Streams
          </h1>
          <p className="text-sm sm:text-base text-[#93aaa6] max-w-xl">
            Browse through curated open-source animations, space science documentaries, technological deep dives, and orchestral experiences.
          </p>
        </div>

        {/* Gallery */}
        <VideoShowcase initialVideos={videos} />
      </div>
    </div>
  )
}

