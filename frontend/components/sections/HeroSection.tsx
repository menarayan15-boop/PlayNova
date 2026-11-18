"use client"

import React, { useRef, useEffect, useState } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import VideoPlayer from "../player/VideoPlayer"
import YouTubePlayer from "../player/YouTubePlayer"
import VideoPlayerErrorBoundary from "../player/VideoPlayerErrorBoundary"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { getHomepageFeedApi } from "@/services/videoApi"
import { getYouTubeHomepageApi } from "@/services/youtubeApi"
import { VideoItem } from "@/types"

const LAST_FEATURED_KEY = "playnova_last_featured_video_id"

function pickRandomFeatured(pool: VideoItem[], excludeId: string | null): VideoItem | null {
  if (pool.length === 0) return null
  if (pool.length === 1) return pool[0]

  const candidates = excludeId ? pool.filter((v) => v.id !== excludeId) : pool
  const effectivePool = candidates.length > 0 ? candidates : pool
  const randomIdx = Math.floor(Math.random() * effectivePool.length)
  return effectivePool[randomIdx]
}

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)
  const deviceWrapRef = useRef<HTMLDivElement>(null)
  const deviceRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const [featuredVideo, setFeaturedVideo] = useState<VideoItem | null>(null)
  const [eligibleCount, setEligibleCount] = useState<number>(0)
  const [isLoadingFeatured, setIsLoadingFeatured] = useState<boolean>(true)

  // Mount-only featured video selection:
  // - Fetches real published playable videos (PlayNova DB + live YouTube if configured)
  // - Excludes the previous visit's featured ID from localStorage when >= 2 eligible videos exist
  // - Locks the selected video for the entire page visit (never changes on re-renders, zero hydration mismatch)
  useEffect(() => {
    let mounted = true

    async function selectHeroVideo() {
      setIsLoadingFeatured(true)
      try {
        const [nativeHome, ytHome] = await Promise.all([
          getHomepageFeedApi(`hero_${Date.now()}`).catch(() => null),
          getYouTubeHomepageApi().catch(() => null),
        ])

        const rawPool: VideoItem[] = [
          ...(ytHome?.configured ? ytHome.featured || [] : []),
          ...(ytHome?.configured ? ytHome.trending || [] : []),
          ...(nativeHome?.featured || []),
          ...(nativeHome?.trending || []),
          ...(nativeHome?.recentlyAdded || []),
        ]

        // Deduplicate by ID and verify playable status
        const seen = new Set<string>()
        const eligible: VideoItem[] = []
        for (const v of rawPool) {
          if (!v || !v.id || seen.has(v.id)) continue
          if (v.status === "broken" || v.embeddable === false) continue
          const hasPlayableSource =
            v.sourceType === "youtube"
              ? Boolean(v.externalVideoId || v.id.startsWith("yt_"))
              : Boolean(v.videoUrl)
          if (!hasPlayableSource) continue
          seen.add(v.id)
          eligible.push(v)
        }

        if (!mounted) return
        setEligibleCount(eligible.length)

        let lastId: string | null = null
        try {
          lastId = localStorage.getItem(LAST_FEATURED_KEY)
        } catch {}

        const chosen = pickRandomFeatured(eligible, lastId)
        if (chosen) {
          try {
            localStorage.setItem(LAST_FEATURED_KEY, chosen.id)
          } catch {}
          setFeaturedVideo(chosen)
        } else {
          setFeaturedVideo(null)
        }
      } catch {
        if (mounted) {
          setFeaturedVideo(null)
          setEligibleCount(0)
        }
      } finally {
        if (mounted) setIsLoadingFeatured(false)
      }
    }

    selectHeroVideo()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || reduced) return
    gsap.registerPlugin(ScrollTrigger)

    const hero = heroRef.current
    if (!hero) return

    const mm = gsap.matchMedia()

    mm.add("(min-width: 768px)", () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } })

      tl.from(".hero-headline-word", {
        yPercent: 120,
        rotate: 3,
        duration: 1.15,
        stagger: 0.06,
      })
        .from(
          ".hero-fade",
          {
            y: 20,
            autoAlpha: 0,
            duration: 0.9,
            stagger: 0.1,
          },
          "-=0.75"
        )
        .from(
          deviceWrapRef.current,
          {
            y: 120,
            autoAlpha: 0,
            duration: 1.2,
          },
          "-=0.7"
        )

      if (deviceRef.current && deviceWrapRef.current) {
        gsap.fromTo(
          deviceRef.current,
          { rotateX: 16, scale: 0.94, y: -10 },
          {
            rotateX: 0,
            scale: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: deviceWrapRef.current,
              start: "top 95%",
              end: "top 30%",
              scrub: 0.6,
            },
          }
        )
      }
    })

    return () => {
      mm.revert()
    }
  }, [reduced])

  const headlineWords = [
    { text: "Your", isGold: false },
    { text: "Videos.", isGold: false },
    { text: "Your", isGold: false },
    { text: "Experience.", isGold: true },
  ]

  const isFeaturedYouTube = Boolean(
    featuredVideo &&
      (featuredVideo.sourceType === "youtube" ||
        featuredVideo.externalVideoId ||
        featuredVideo.id.startsWith("yt_"))
  )
  const featuredYtId =
    featuredVideo?.externalVideoId ||
    (featuredVideo?.id.startsWith("yt_") ? featuredVideo.id.slice(3) : "")

  return (
    <section
      ref={heroRef}
      className="relative pt-32 pb-24 md:pt-40 md:pb-36 overflow-hidden bg-[#f5f4ee]"
    >
      {/* Subtle radial glow background effect */}
      <div
        aria-hidden="true"
        className="absolute top-24 left-1/2 -translate-x-1/2 w-[min(1000px,120vw)] h-[550px] bg-[radial-gradient(closest-side,#cdc8f6_0%,transparent_70%)] opacity-40 pointer-events-none -z-10"
      />

      {/* Grid line background overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 h-[600px] bg-[linear-gradient(#e2e0d6_1px,transparent_1px),linear-gradient(90deg,#e2e0d6_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_0%,#000_20%,transparent_75%)] opacity-45 pointer-events-none -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="hero-fade inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10292d]/5 border border-[#e2e0d6] text-[#8c7b33] text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8c7b33] animate-ping" />
            A Smarter Way to Watch
          </div>

          <h1 className="text-[clamp(38px,6.8vw,86px)] font-normal tracking-[-0.04em] leading-[1.02] text-[#10292d]">
            {headlineWords.map((word, index) => (
              <span key={index} className="inline-block overflow-hidden py-1">
                <span
                  className={`hero-headline-word inline-block ${
                    word.isGold ? "text-[#8c7b33]" : ""
                  }`}
                >
                  {word.text}&nbsp;
                </span>
              </span>
            ))}
          </h1>

          <p className="hero-fade mt-6 text-base sm:text-lg md:text-xl text-[#66726f] max-w-2xl leading-relaxed">
            Discover a smarter way to watch, explore, and enjoy videos with advanced playback controls and a seamless viewing experience.
          </p>

          <div className="hero-fade mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#showcase"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm sm:text-base font-semibold bg-[#0f3238] text-[#ffffff] hover:bg-[#10292d] hover:shadow-[0_12px_24px_-10px_#0f3238] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Start Watching
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>

            <Link
              href="/explore"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm sm:text-base font-medium bg-[#cdc8f6] text-[#1e1a44] hover:bg-[#b8b1f3] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Explore Library
            </Link>
          </div>
        </div>

        {/* 3D Perspective Device Wrap & Randomized Real Featured Video Player */}
        <div
          ref={deviceWrapRef}
          className="relative max-w-5xl mx-auto mt-16 sm:mt-20 [perspective:1800px]"
        >
          <div
            ref={deviceRef}
            data-testid="hero-featured-container"
            data-featured-video-id={featuredVideo?.id || ""}
            className="rounded-2xl p-2.5 sm:p-3.5 bg-gradient-to-br from-[#1b1f22] to-[#0b0d0e] border border-white/10 shadow-[0_50px_100px_-40px_rgba(16,41,45,0.55),0_20px_40px_-30px_rgba(16,41,45,0.4)] transition-transform"
          >
            {isLoadingFeatured ? (
              <div
                className="w-full aspect-video rounded-xl bg-[#0c2f35]/80 animate-pulse flex items-center justify-center"
                role="status"
                aria-label="Loading featured video"
              >
                <span className="text-xs font-mono text-[#93aaa6]">Selecting featured spotlight...</span>
              </div>
            ) : !featuredVideo ? (
              <div className="w-full aspect-video rounded-xl bg-[#0c2f35] flex flex-col items-center justify-center p-6 text-center text-[#eef2ec] gap-3">
                <p className="text-sm font-medium">No featured videos are currently available.</p>
                <Link
                  href="/explore"
                  className="px-4 py-2 rounded-full bg-[#8c7b33] text-white text-xs font-semibold"
                >
                  Browse Video Library
                </Link>
              </div>
            ) : isFeaturedYouTube && featuredYtId ? (
              <VideoPlayerErrorBoundary fallbackTitle={featuredVideo.title}>
                <YouTubePlayer
                  playnovaVideoId={featuredVideo.id}
                  youtubeVideoId={featuredYtId}
                  title={featuredVideo.title}
                  channelTitle={featuredVideo.channelTitle}
                  autoPlay={false}
                />
              </VideoPlayerErrorBoundary>
            ) : (
              <VideoPlayerErrorBoundary fallbackTitle={featuredVideo.title}>
                <VideoPlayer
                  id={featuredVideo.id}
                  src={featuredVideo.videoUrl}
                  title={featuredVideo.title}
                  poster={featuredVideo.thumbnailUrl}
                  autoPlay={false}
                  className="rounded-xl"
                />
              </VideoPlayerErrorBoundary>
            )}

            {/* Featured Video Attribution Strip */}
            {featuredVideo && (
              <div className="mt-2.5 px-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#93aaa6]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#8c7b33]/20 text-[#cdc8f6] border border-[#8c7b33]/40 shrink-0">
                    Featured · {featuredVideo.category}
                  </span>
                  <span className="truncate text-[#eef2ec] font-medium" data-testid="hero-featured-title">
                    {featuredVideo.title}
                  </span>
                  {featuredVideo.channelTitle && (
                    <span className="hidden sm:inline text-[11px] font-mono text-[#93aaa6] shrink-0">
                      · {featuredVideo.channelTitle}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono text-[#93aaa6]/80">
                    Pool: {eligibleCount} videos
                  </span>
                  <Link
                    href={`/watch?id=${encodeURIComponent(featuredVideo.id)}`}
                    className="text-xs font-semibold text-[#8c7b33] hover:text-[#cdc8f6] transition-colors"
                  >
                    Open Watch Page &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
