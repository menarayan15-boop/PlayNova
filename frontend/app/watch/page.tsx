import React from "react"
import WatchPageClient from "@/components/player/WatchPageClient"
import { fetchVideos, fetchVideoById } from "@/services/api"
import { VideoItem } from "@/types"

interface WatchPageProps {
  searchParams: { id?: string }
}

export default async function WatchPage({ searchParams }: WatchPageProps) {
  const videoId = searchParams.id || "nova-01"
  const currentVideo = await fetchVideoById(videoId)
  const allVideos = await fetchVideos()

  const activeVideo: VideoItem = currentVideo || allVideos[0]
  const relatedVideos = allVideos.filter((v) => v.id !== activeVideo.id)

  return (
    <WatchPageClient
      activeVideo={activeVideo}
      relatedVideos={relatedVideos}
    />
  )
}
