import React from "react"

export function ContinueWatchingCard({
  title = "Cosmic Horizons",
  category = "Space",
  progressTime = "12:14",
  totalTime = "18:24",
  progressPercent = 66,
  className = "",
}: {
  title?: string
  category?: string
  progressTime?: string
  totalTime?: string
  progressPercent?: number
  className?: string
}) {
  return (
    <div
      className={`w-[320px] p-3.5 rounded-xl bg-[#0c2f35] text-[#eef2ec] border border-white/10 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.65)] backdrop-blur-md transition-transform hover:-translate-y-1 ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-[#93aaa6] mb-2.5">
        <span className="flex items-center gap-1.5 font-medium tracking-wide uppercase text-[10px]">
          <span className="w-2 h-2 rounded-full bg-[#8c7b33] animate-pulse" />
          Continue Watching
        </span>
        <span className="font-mono text-[#8c7b33] text-[11px] font-semibold">{category}</span>
      </div>

      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-10 h-10 rounded-lg bg-[#0f3238] border border-white/10 flex items-center justify-center flex-shrink-0 text-[#8c7b33]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#eef2ec] truncate">{title}</p>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#93aaa6] mt-0.5">
            <span>{progressTime}</span>
            <span>{totalTime}</span>
          </div>
        </div>
      </div>

      {/* Progress track */}
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#8c7b33] to-[#cdc8f6] rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}

export function SmartPlaybackCard({
  speed = "1.5x",
  quality = "4K UHD 60fps",
  subtitles = "English [CC]",
  audio = "Dolby Atmos",
  className = "",
}: {
  speed?: string
  quality?: string
  subtitles?: string
  audio?: string
  className?: string
}) {
  return (
    <div
      className={`w-[290px] p-3.5 rounded-xl bg-[#0c2f35] text-[#eef2ec] border border-white/10 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.65)] backdrop-blur-md transition-transform hover:-translate-y-1 ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-[#93aaa6] mb-3">
        <span className="flex items-center gap-1.5 font-medium tracking-wide uppercase text-[10px]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cdc8f6" strokeWidth="2.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Smart Playback
        </span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#8c7b33]/20 text-[#8c7b33] border border-[#8c7b33]/30">
          Active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="block text-[10px] text-[#93aaa6] uppercase font-mono">Speed</span>
          <span className="text-[12px] font-semibold text-[#eef2ec]">{speed}</span>
        </div>
        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="block text-[10px] text-[#93aaa6] uppercase font-mono">Quality</span>
          <span className="text-[12px] font-semibold text-[#8c7b33]">{quality}</span>
        </div>
        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="block text-[10px] text-[#93aaa6] uppercase font-mono">Captions</span>
          <span className="text-[12px] font-semibold text-[#cdc8f6] truncate block">{subtitles}</span>
        </div>
        <div className="p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="block text-[10px] text-[#93aaa6] uppercase font-mono">Audio</span>
          <span className="text-[12px] font-semibold text-[#eef2ec]">{audio}</span>
        </div>
      </div>
    </div>
  )
}

