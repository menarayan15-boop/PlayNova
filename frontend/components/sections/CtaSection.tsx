"use client"

import React, { useRef, useEffect } from "react"
import Link from "next/link"
import gsap from "gsap"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export default function CtaSection() {
  const cardRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const card = cardRef.current
    if (!card || reduced) return

    const blobs = Array.from(card.querySelectorAll(".cta-glow-blob")) as HTMLElement[]
    if (!blobs.length) return

    const movers = blobs.map((b, i) => ({
      x: gsap.quickTo(b, "x", { duration: 1.4 + i * 0.4, ease: "power3.out" }),
      y: gsap.quickTo(b, "y", { duration: 1.4 + i * 0.4, ease: "power3.out" }),
    }))

    const handlePointerMove = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect()
      const dx = e.clientX - rect.left - rect.width / 2
      const dy = e.clientY - rect.top - rect.height / 2

      movers.forEach((m, i) => {
        const k = [0.3, -0.22, 0.16][i] ?? 0.2
        m.x(dx * k)
        m.y(dy * k)
      })
    }

    card.addEventListener("pointermove", handlePointerMove)
    return () => {
      card.removeEventListener("pointermove", handlePointerMove)
      blobs.forEach((b) => gsap.killTweensOf(b))
    }
  }, [reduced])

  return (
    <section id="cta" className="relative py-20 bg-[#f5f4ee] border-t border-[#e2e0d6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={cardRef}
          className="relative min-h-[380px] rounded-3xl overflow-hidden p-8 sm:p-14 lg:p-16 flex items-center justify-between border border-white/50 shadow-[0_30px_70px_-25px_rgba(16,41,45,0.25)] bg-gradient-to-br from-[#c9c3f5] via-[#f2c4b4] to-[#f7dccb]"
        >
          {/* Pointer-responsive animated glowing blobs */}
          <span
            aria-hidden="true"
            className="cta-glow-blob absolute -top-24 -left-20 w-[420px] h-[420px] rounded-full bg-[#c9c3f5] filter blur-[60px] pointer-events-none opacity-85"
          />
          <span
            aria-hidden="true"
            className="cta-glow-blob absolute -bottom-32 -right-24 w-[380px] h-[380px] rounded-full bg-[#f2c4b4] filter blur-[60px] pointer-events-none opacity-80"
          />
          <span
            aria-hidden="true"
            className="cta-glow-blob absolute top-12 right-1/3 w-[260px] h-[260px] rounded-full bg-white filter blur-[50px] pointer-events-none opacity-60"
          />

          {/* Grain texture overlay */}
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-25 mix-blend-soft-light pointer-events-none bg-[radial-gradient(#10292d_1px,transparent_1px)] bg-[size:16px_16px]"
          />

          {/* CTA Content */}
          <div className="relative z-10 max-w-2xl flex flex-col gap-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 backdrop-blur-sm text-[#10292d] text-xs font-semibold uppercase tracking-wider w-max">
              <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
              Start Watching Today
            </div>

            <h2 className="text-[clamp(34px,5vw,60px)] font-normal tracking-[-0.035em] leading-[1.05] text-[#10292d]">
              Ready to Experience <span className="font-semibold text-[#0f3238]">PlayNova?</span>
            </h2>

            <p className="text-base sm:text-lg text-[#10292d]/80 max-w-lg leading-relaxed">
              Discover a new way to enjoy your favorite videos with cinematic fidelity and zero distractions.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Link
                href="/watch?id=nova-01"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm sm:text-base font-semibold bg-[#0f3238] text-[#ffffff] hover:bg-[#10292d] hover:shadow-[0_12px_24px_-8px_#0f3238] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Start Watching
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/explore"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-full text-sm sm:text-base font-medium bg-white/40 hover:bg-white/60 text-[#10292d] border border-white/60 backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Explore Videos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

