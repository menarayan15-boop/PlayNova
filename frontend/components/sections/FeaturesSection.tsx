"use client"

import React, { useState, useEffect, useRef } from "react"
import { useReducedMotion } from "@/hooks/useReducedMotion"

// Feature 1: Total Playback Control Scene
function ScenePlaybackControl({ active }: { active: boolean }) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [seekPos, setSeekPos] = useState(42)

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => {
      setSeekPos((prev) => (prev >= 90 ? 20 : prev + 4))
    }, 800)
    return () => clearInterval(interval)
  }, [active])

  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-6 bg-[#0c2f35] text-[#eef2ec] select-none">
      <div className="w-full max-w-md p-5 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col gap-4">
        {/* Top header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8c7b33] animate-pulse" />
            <span className="text-xs font-mono tracking-wider uppercase text-[#93aaa6]">
              Engine Diagnostics
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#2f7d57]/20 text-[#2f7d57] border border-[#2f7d57]/30">
            Phase 1 Active
          </span>
        </div>

        {/* Video Canvas Simulation */}
        <div className="relative aspect-video w-full rounded-xl bg-gradient-to-tr from-[#0a181b] via-[#10292d] to-[#0f3238] border border-white/10 flex items-center justify-center overflow-hidden">
          {/* Simulated audio waveform */}
          <div className="flex items-center gap-1.5 h-12">
            {[40, 75, 90, 60, 85, 100, 70, 50, 95, 65, 80, 45].map((height, i) => (
              <span
                key={i}
                className="w-1.5 bg-gradient-to-t from-[#8c7b33] to-[#cdc8f6] rounded-full transition-all duration-300"
                style={{
                  height: active && isPlaying ? `${height}%` : "20%",
                  opacity: 0.8,
                }}
              />
            ))}
          </div>

          {/* Simulated 10s Seek Ripple */}
          <div className="absolute right-4 top-4 px-2 py-1 rounded bg-black/60 text-[#8c7b33] text-[11px] font-mono border border-[#8c7b33]/40 flex items-center gap-1">
            <span>+10s seek</span>
          </div>
        </div>

        {/* Interactive Simulated Controls */}
        <div className="flex flex-col gap-2">
          {/* Timeline scrub track */}
          <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer">
            <div
              className="h-full bg-gradient-to-r from-[#8c7b33] to-[#cdc8f6] transition-all duration-300"
              style={{ width: `${seekPos}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#93aaa6] font-mono mt-1">
            <span>04:12</span>
            <span>10:00</span>
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <button
              type="button"
              onClick={() => setSeekPos((p) => Math.max(0, p - 10))}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#eef2ec]"
              aria-label="Rewind"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-[#8c7b33] text-[#f5f4ee] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                  <path d="M6 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSeekPos((p) => Math.min(100, p + 10))}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#eef2ec]"
              aria-label="Forward"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Feature 2: Watch Your Way Scene
function SceneWatchModes({ active }: { active: boolean }) {
  const [mode, setMode] = useState<"theater" | "pip" | "fullscreen">("theater")

  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-6 bg-[#0a181b] text-[#eef2ec] select-none">
      <div className="w-full max-w-md p-5 rounded-2xl bg-[#0c2f35] border border-white/10 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono tracking-wider uppercase text-[#93aaa6]">
            Display Morphing
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#8c7b33]/20 text-[#8c7b33] border border-[#8c7b33]/30">
            Upcoming Preview
          </span>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
          {[
            { id: "theater", label: "Theater Mode" },
            { id: "pip", label: "Picture-in-Pic" },
            { id: "fullscreen", label: "Full Screen" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id as typeof mode)}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                mode === tab.id
                  ? "bg-[#8c7b33] text-[#ffffff] shadow"
                  : "text-[#93aaa6] hover:text-[#eef2ec]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Visual Mode Simulator */}
        <div className="relative aspect-video w-full rounded-xl bg-black/70 border border-white/10 overflow-hidden flex items-center justify-center p-4">
          {mode === "theater" && (
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-[#0c2f35] to-[#10292d] border border-white/20 shadow-[0_0_40px_rgba(205,200,246,0.15)] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
              <span className="text-xs font-mono text-[#cdc8f6] mb-1">Expanded Ambient Canvas</span>
              <span className="text-[11px] text-[#93aaa6] text-center">
                Widescreen cinematic presentation with reduced distraction
              </span>
            </div>
          )}

          {mode === "pip" && (
            <div className="relative w-full h-full border border-dashed border-white/20 rounded-lg flex items-center justify-center">
              <span className="text-[11px] text-[#93aaa6]">Primary Workspace Window</span>
              {/* Floating mini player */}
              <div className="absolute bottom-2 right-2 w-36 aspect-video rounded-md bg-[#0c2f35] border-2 border-[#8c7b33] shadow-xl p-2 flex flex-col justify-between animate-in zoom-in-95 duration-200">
                <span className="text-[9px] font-mono text-[#8c7b33] uppercase">Mini Player</span>
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-[#8c7b33]" />
                </div>
              </div>
            </div>
          )}

          {mode === "fullscreen" && (
            <div className="w-full h-full rounded-lg bg-gradient-to-r from-[#0f3238] via-[#0c2f35] to-[#1b1f22] border-2 border-[#cdc8f6]/40 flex flex-col items-center justify-center p-3 animate-in fade-in duration-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cdc8f6" strokeWidth="2" className="mb-2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
              <span className="text-xs font-mono text-[#eef2ec]">Full Display Immersive Mode</span>
              <span className="text-[10px] text-[#93aaa6]">4K Ultra HD Scaling</span>
            </div>
          )}
        </div>

        <p className="text-xs text-[#93aaa6] leading-relaxed">
          Switch seamlessly between standard embedded, theater ambient glow, and floating picture-in-picture modes without interrupting playback.
        </p>
      </div>
    </div>
  )
}

// Feature 3: Never Lose Your Progress Scene
function SceneSyncProgress({ active }: { active: boolean }) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-6 bg-[#0c2f35] text-[#eef2ec] select-none">
      <div className="w-full max-w-md p-5 rounded-2xl bg-black/30 border border-white/10 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono tracking-wider uppercase text-[#93aaa6]">
            State Persistence
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#8c7b33]/20 text-[#8c7b33] border border-[#8c7b33]/30">
            Upcoming Preview
          </span>
        </div>

        {/* Sync Device Cards */}
        <div className="flex flex-col gap-2.5">
          {[
            { device: "MacBook Pro", time: "18:42", total: "45:10", status: "Active Now" },
            { device: "iPad Air", time: "18:42", total: "45:10", status: "Synced" },
            { device: "Mobile Phone", time: "18:42", total: "45:10", status: "Synced" },
          ].map((item, idx) => (
            <div
              key={item.device}
              className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between transition-all hover:bg-white/10"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0f3238] flex items-center justify-center text-[#8c7b33]">
                  {idx === 0 ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  ) : idx === 1 ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-[#eef2ec]">{item.device}</p>
                  <p className="text-[11px] font-mono text-[#93aaa6]">
                    Resume at {item.time} / {item.total}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  item.status === "Active Now"
                    ? "bg-[#2f7d57]/20 text-[#2f7d57] border border-[#2f7d57]/30"
                    : "bg-white/10 text-[#93aaa6]"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>

        {/* Action prompt */}
        <div className="p-3 rounded-xl bg-[#8c7b33]/15 border border-[#8c7b33]/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#f5f4ee]">Instant Session Recovery</p>
            <p className="text-[11px] text-[#93aaa6]">Pick up right where you paused</p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-full bg-[#8c7b33] text-[#ffffff] text-xs font-medium shadow"
          >
            Resume (18:42)
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FeaturesSection() {
  const [activeScene, setActiveScene] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const features = [
    {
      number: "01",
      title: "Total Playback Control",
      description:
        "Experience instantaneous play, pause, smooth scrubbing, and rapid 10-second jumps. Precision volume leveling and buffered timeline previews ensure you stay entirely in command.",
      tag: "Phase 1 Operational",
      renderScene: (active: boolean) => <ScenePlaybackControl active={active} />,
    },
    {
      number: "02",
      title: "Watch Your Way",
      description:
        "Designed to mold to your screen. Whether you desire immersive full-screen presentation, cinematic theater mode with ambient backing, or floating picture-in-picture multi-tasking.",
      tag: "Upcoming Phase 2 Preview",
      renderScene: (active: boolean) => <SceneWatchModes active={active} />,
    },
    {
      number: "03",
      title: "Never Lose Your Progress",
      description:
        "Seamless watch history and smart bookmarking preserve your exact timestamp down to the second across your tablet, desktop, or mobile device.",
      tag: "Upcoming Phase 2 Preview",
      renderScene: (active: boolean) => <SceneSyncProgress active={active} />,
    },
  ]

  // Track active feature block using IntersectionObserver
  useEffect(() => {
    if (typeof window === "undefined") return
    const container = containerRef.current
    if (!container) return

    const blocks = Array.from(container.querySelectorAll("[data-feature-block]")) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.featureBlock)
            if (!isNaN(index)) setActiveScene(index)
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px" }
    )

    blocks.forEach((b) => io.observe(b))
    return () => io.disconnect()
  }, [])

  return (
    <section id="features" className="relative py-24 md:py-32 bg-[#eae7dc] border-t border-[#e2e0d6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <div className="flex items-center gap-2 mb-12">
          <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8c7b33]">
            Feature Demonstrations
          </span>
        </div>

        {/* Desktop Sticky Stage Grid & Mobile Stack */}
        <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Sticky Stage (Visible on Desktop) */}
          <div className="hidden lg:block lg:col-span-7 sticky top-28 h-[540px]">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-[#e2e0d6]/60 bg-[#ffffff]">
              {features.map((f, i) => (
                <div
                  key={f.number}
                  className={`absolute inset-0 transition-all duration-700 ${
                    activeScene === i
                      ? "opacity-100 visible scale-100 filter-none"
                      : "opacity-0 invisible scale-95 blur-sm"
                  }`}
                  aria-hidden={activeScene !== i}
                >
                  {f.renderScene(activeScene === i)}
                </div>
              ))}

              {/* Stage Counter */}
              <div className="absolute left-5 bottom-4 font-mono text-xs text-[#93aaa6] pointer-events-none z-30">
                <span className="text-[#8c7b33] font-bold">
                  {String(activeScene + 1).padStart(2, "0")}
                </span>{" "}
                / {String(features.length).padStart(2, "0")}
              </div>
            </div>
          </div>

          {/* Right Column: Feature Copy and Mobile Inlines */}
          <div className="lg:col-span-5 flex flex-col">
            {features.map((feat, i) => (
              <article
                key={feat.number}
                data-feature-block={i}
                className={`flex flex-col justify-center min-h-[50vh] lg:min-h-[70vh] py-10 transition-opacity duration-500 ${
                  activeScene === i ? "opacity-100" : "opacity-35 lg:opacity-35"
                }`}
              >
                {/* Mobile Inline Scene */}
                <div className="lg:hidden w-full h-[380px] rounded-xl overflow-hidden shadow-xl border border-white/10 mb-6">
                  {feat.renderScene(true)}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-mono font-bold text-[#8c7b33]">
                    {feat.number}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#10292d]/5 text-[#66726f] border border-[#e2e0d6]">
                    {feat.tag}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#10292d] mb-4">
                  {feat.title}
                </h3>

                <p className="text-base text-[#66726f] leading-relaxed max-w-md">
                  {feat.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

