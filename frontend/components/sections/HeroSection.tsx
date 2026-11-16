"use client"

import React, { useRef, useEffect } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import VideoPlayer from "../player/VideoPlayer"
import VideoPlayerErrorBoundary from "../player/VideoPlayerErrorBoundary"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { ThumbnailPreview } from "@/types"

const HERO_THUMBNAILS: ThumbnailPreview[] = [
  { time: 0, imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=300&q=70" },
  { time: 60, imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=70" },
  { time: 180, imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=300&q=70" },
  { time: 300, imageUrl: "https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?auto=format&fit=crop&w=300&q=70" },
  { time: 480, imageUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=300&q=70" },
  { time: 600, imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=70" },
]

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)
  const deviceWrapRef = useRef<HTMLDivElement>(null)
  const deviceRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (typeof window === "undefined" || reduced) return
    gsap.registerPlugin(ScrollTrigger)

    const hero = heroRef.current
    if (!hero) return

    const mm = gsap.matchMedia()

    mm.add("(min-width: 768px)", () => {
      // Intro timeline
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

      // Perspective tilt & scroll straightening
      if (deviceRef.current && deviceWrapRef.current) {
        gsap.fromTo(
          deviceRef.current,
          {
            rotateX: 22,
            scale: 0.92,
            y: -15,
          },
          {
            rotateX: 0,
            scale: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: deviceWrapRef.current,
              start: "top 95%",
              end: "top 25%",
              scrub: 0.7,
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
          {/* Tagline Badge */}
          <div className="hero-fade inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10292d]/5 border border-[#e2e0d6] text-[#8c7b33] text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8c7b33] animate-ping" />
            A Smarter Way to Watch
          </div>

          {/* Masked Editorial Headline */}
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

          {/* Supporting Text */}
          <p className="hero-fade mt-6 text-base sm:text-lg md:text-xl text-[#66726f] max-w-2xl leading-relaxed">
            Discover a smarter way to watch, explore, and enjoy videos with advanced playback controls and a seamless viewing experience.
          </p>

          {/* Primary & Secondary CTAs */}
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

        {/* 3D Perspective Device Wrap & Video Player Preview */}
        <div
          ref={deviceWrapRef}
          className="relative max-w-5xl mx-auto mt-16 sm:mt-20 [perspective:1800px]"
        >
          {/* The tilting device frame */}
          <div
            ref={deviceRef}
            className="rounded-2xl p-2.5 sm:p-3.5 bg-gradient-to-br from-[#1b1f22] to-[#0b0d0e] border border-white/10 shadow-[0_50px_100px_-40px_rgba(16,41,45,0.55),0_20px_40px_-30px_rgba(16,41,45,0.4)] transition-transform [transform-style:preserve-3d]"
          >
            {/* The real functional HTML5 Video Player */}
            <VideoPlayerErrorBoundary fallbackTitle="Cosmic Horizons: The Deep Space Explorer">
              <VideoPlayer
                id="hero-player"
                src="/sample-videos/cosmic-horizons.mp4"
                title="Cosmic Horizons: The Deep Space Explorer"
                poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
                autoPlay={false}
                thumbnails={HERO_THUMBNAILS}
                className="rounded-xl"
              />
            </VideoPlayerErrorBoundary>
          </div>
        </div>
      </div>
    </section>
  )
}

