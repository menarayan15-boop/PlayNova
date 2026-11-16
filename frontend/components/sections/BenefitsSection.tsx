"use client"

import React, { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export default function BenefitsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const statementRef = useRef<HTMLParagraphElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (typeof window === "undefined" || reduced) return
    gsap.registerPlugin(ScrollTrigger)

    const section = sectionRef.current
    if (!section) return

    // Word-by-word ink reveal animation on the statement
    const words = statementRef.current?.querySelectorAll(".benefit-word")
    if (words && words.length) {
      gsap.fromTo(
        words,
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.04,
          ease: "none",
          scrollTrigger: {
            trigger: statementRef.current,
            start: "top 85%",
            end: "bottom 50%",
            scrub: true,
          },
        }
      )
    }

    // Expanding stat horizontal rule line
    const rules = section.querySelectorAll(".benefit-stat-rule")
    if (rules.length) {
      gsap.fromTo(
        rules,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          ease: "power3.inOut",
          stagger: 0.12,
          scrollTrigger: {
            trigger: section.querySelector(".benefit-stats"),
            start: "top 88%",
            once: true,
          },
        }
      )
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.vars.trigger === statementRef.current || t.vars.trigger === section.querySelector(".benefit-stats")) {
          t.kill()
        }
      })
    }
  }, [reduced])

  const statementText =
    "Video streaming should be effortless, not cluttered with friction. With PlayNova, discover a fluid HTML5 player built for speed, crystalline fidelity, and complete control across every device you own."

  const words = statementText.split(" ")

  const cards = [
    {
      title: "Seamless Playback",
      description: "Enjoy smooth playback with intuitive controls, low-latency buffering, and rapid frame scrubbing.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8c7b33" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" />
        </svg>
      ),
    },
    {
      title: "Personalized Experience",
      description: "Customize your viewing experience with flexible playback settings, subtitle styling, and audio dynamics.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8c7b33" strokeWidth="2">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
    {
      title: "Watch Anywhere",
      description: "Enjoy a responsive experience across desktop, tablet, and mobile devices without losing your place.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8c7b33" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
  ]

  const stats = [
    { value: "4K UHD", label: "Ultra-high bitrate resolution" },
    { value: "0 ms", label: "Zero frame drop buffer latency" },
    { value: "100%", label: "Pure HTML5 cross-device standard" },
  ]

  return (
    <section
      id="benefits"
      ref={sectionRef}
      className="relative py-24 md:py-36 bg-[#f5f4ee] border-t border-[#e2e0d6]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Label & Main Headline */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8c7b33]">
                Platform Benefits
              </span>
            </div>
            <h2 className="text-[clamp(32px,4vw,52px)] font-normal tracking-[-0.035em] leading-[1.08] text-[#10292d]">
              More Control. Better Viewing. <span className="text-[#8c7b33]">Zero Distractions.</span>
            </h2>
          </div>

          {/* Right Column: Inking Statement, Benefit Cards & Stats */}
          <div className="lg:col-span-8 flex flex-col gap-14">
            {/* Template-inspired Word-by-word reveal statement */}
            <p
              ref={statementRef}
              className="text-[clamp(22px,2.6vw,34px)] font-normal tracking-[-0.02em] leading-snug text-[#10292d]"
            >
              {words.map((word, i) => (
                <span key={i} className="benefit-word inline-block mr-2 select-none">
                  {word}
                </span>
              ))}
            </p>

            {/* Benefit Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-[#e2e0d6]">
              {cards.map((c) => (
                <div
                  key={c.title}
                  className="p-6 rounded-2xl bg-[#ffffff] border border-[#e2e0d6] shadow-[0_10px_30px_-20px_rgba(16,41,45,0.15)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f5f4ee] border border-[#e2e0d6] flex items-center justify-center mb-1">
                    {c.icon}
                  </div>
                  <h3 className="font-semibold text-lg text-[#10292d]">{c.title}</h3>
                  <p className="text-sm text-[#66726f] leading-relaxed">{c.description}</p>
                </div>
              ))}
            </div>

            {/* Metrics & Performance Stats */}
            <div className="benefit-stats grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8">
              {stats.map((s) => (
                <div key={s.label} className="relative pt-6 flex flex-col gap-1">
                  <span className="benefit-stat-rule absolute top-0 inset-x-0 h-[1px] bg-[#10292d]/20 origin-left" />
                  <span className="font-mono text-3xl sm:text-4xl font-normal text-[#10292d] tracking-tight">
                    {s.value}
                  </span>
                  <span className="text-xs text-[#66726f]">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

