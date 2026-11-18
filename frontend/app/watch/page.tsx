import React from "react"
import Link from "next/link"
import WatchPageClient from "@/components/player/WatchPageClient"
import { fetchVideos, fetchVideoById } from "@/services/api"
import { getSimilarVideosApi } from "@/services/videoApi"
import { getYouTubeRelatedApi } from "@/services/youtubeApi"
import { VideoItem } from "@/types"

interface WatchPageProps {
  searchParams: { id?: string }
}

export default async function WatchPage({ searchParams }: WatchPageProps) {
  const videoId = searchParams.id
  let activeVideo: VideoItem | null = videoId ? await fetchVideoById(videoId) : null

  if (!activeVideo) {
    const catalog = await fetchVideos()
    activeVideo = catalog[0] || null
  }

  if (!activeVideo) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-[#f5f4ee] px-4 text-center">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-[#e2e0d6]">
          <h1 className="text-xl font-semibold text-[#10292d] mb-2">Video Unavailable</h1>
          <p className="text-sm text-[#66726f] mb-6">
            The requested video could not be loaded from the catalog.
          </p>
          <Link
            href="/explore"
            className="inline-flex px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0f3238] text-white"
          >
            Browse Catalog
          </Link>
        </div>
      </div>
    )
  }

  const isYouTube = activeVideo.sourceType === "youtube" || activeVideo.id.startsWith("yt_")
  const ytRelated = isYouTube ? await getYouTubeRelatedApi(activeVideo.id) : []
  const similar = ytRelated.length > 0 ? ytRelated : await getSimilarVideosApi(activeVideo.id, 10)
  const relatedVideos = similar.filter((v) => v.id !== activeVideo!.id)

  return <WatchPageClient activeVideo={activeVideo} relatedVideos={relatedVideos} />
}
