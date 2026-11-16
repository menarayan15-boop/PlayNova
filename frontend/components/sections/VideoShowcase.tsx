"use client"

import React, { useState } from "react"
import { VideoItem, VideoCategory } from "@/types"
import VideoCard from "../ui/VideoCard"

interface VideoShowcaseProps {
  initialVideos: VideoItem[]
  onSelectVideo?: (video: VideoItem) => void
}

const CATEGORIES: ("All" | VideoCategory)[] = [
  "All",
  "Space",
  "Nature",
  "Technology",
  "Science",
  "Education",
  "Entertainment",
]

export default function VideoShowcase({
  initialVideos,
  onSelectVideo,
}: VideoShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<"All" | VideoCategory>("All")

  const filteredVideos =
    selectedCategory === "All"
      ? initialVideos
      : initialVideos.filter(
          (v) => v.category.toLowerCase() === selectedCategory.toLowerCase()
        )

  return (
    <section id="showcase" className="relative py-24 md:py-32 bg-[#f5f4ee] border-t border-[#e2e0d6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8c7b33]">
                Video Showcase
              </span>
            </div>
            <h2 className="text-[clamp(28px,4vw,48px)] font-normal tracking-[-0.03em] leading-tight text-[#10292d]">
              Curated Masterpieces. Ready to Stream.
            </h2>
          </div>

          {/* Category Tabs (styled in template segmented control language) */}
          <div className="inline-flex flex-wrap p-1 rounded-xl bg-black/5 border border-[#e2e0d6] max-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-[#ffffff] text-[#10292d] shadow-sm font-semibold"
                    : "text-[#66726f] hover:text-[#10292d]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onSelect={onSelectVideo}
            />
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-16 text-[#66726f]">
            <p className="text-sm">No videos found under &quot;{selectedCategory}&quot;.</p>
          </div>
        )}
      </div>
    </section>
  )
}

