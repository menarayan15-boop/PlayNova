import React from "react"
import Link from "next/link"
import { VideoItem } from "@/types"

interface VideoCardProps {
  video: VideoItem
  onSelect?: (video: VideoItem) => void
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K`
  return String(views)
}

export default function VideoCard({ video, onSelect }: VideoCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault()
      onSelect(video)
    }
  }

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden bg-[#0c2f35] text-[#eef2ec] border border-[#e2e0d6]/20 shadow-[0_10px_30px_-15px_rgba(16,41,45,0.2)] hover:shadow-[0_24px_50px_-20px_rgba(16,41,45,0.45)] hover:-translate-y-1.5 transition-all duration-300">
      {/* Thumbnail area with duration badge and play hover button */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#0a181b]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Category Pill */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-[#0c2f35]/90 text-[#8c7b33] border border-[#8c7b33]/40 backdrop-blur-sm">
            {video.category}
          </span>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 rounded bg-black/75 text-[11px] font-mono text-[#eef2ec] border border-white/10 backdrop-blur-sm">
          {formatDuration(video.duration)}
        </div>

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Link
            href={`/watch?id=${video.id}`}
            onClick={handleClick}
            className="w-12 h-12 rounded-full bg-[#8c7b33] text-[#f5f4ee] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300"
            aria-label={`Watch ${video.title}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Video metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3 className="font-medium text-[15px] leading-snug line-clamp-2 text-[#eef2ec] group-hover:text-[#cdc8f6] transition-colors">
            {video.title}
          </h3>
          <p className="mt-1 text-xs text-[#93aaa6] line-clamp-2 leading-relaxed">
            {video.description}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-[#93aaa6] pt-2 border-t border-white/10">
          <span className="font-mono">{formatViews(video.views)} views</span>
          <Link
            href={`/watch?id=${video.id}`}
            onClick={handleClick}
            className="inline-flex items-center gap-1 text-[#8c7b33] hover:text-[#a8963f] font-medium text-xs group-hover:translate-x-0.5 transition-all"
          >
            Watch Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

