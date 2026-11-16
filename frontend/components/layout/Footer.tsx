"use client"

import React, { useRef, useEffect } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import PlayNovaLogo from "../ui/PlayNovaLogo"

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  const bigmarkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    gsap.registerPlugin(ScrollTrigger)

    const letters = bigmarkRef.current?.querySelectorAll("span")
    if (letters && letters.length) {
      gsap.fromTo(
        letters,
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          stagger: 0.04,
          ease: "power2.out",
          scrollTrigger: {
            trigger: bigmarkRef.current,
            start: "top 95%",
            end: "bottom 95%",
            scrub: 0.6,
          },
        }
      )
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.vars.trigger === bigmarkRef.current) {
          t.kill()
        }
      })
    }
  }, [])

  return (
    <footer ref={footerRef} className="relative pt-20 pb-8 bg-[#f5f4ee] border-t border-[#e2e0d6] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-16 border-b border-[#e2e0d6]">
          {/* Brand info */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <PlayNovaLogo size={32} />
            <p className="text-sm text-[#66726f] max-w-sm leading-relaxed">
              PlayNova — A Smarter Way to Watch. Experience fluid HTML5 video streaming with advanced playback controls, responsive 3D design, and zero friction.
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#66726f]">
              <span className="w-2 h-2 rounded-full bg-[#2f7d57]" />
              Phase 1 Platform Build
            </div>
          </div>

          {/* Column 1: Navigation */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#10292d]">Navigation</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#66726f]">
              <li>
                <Link href="/" className="hover:text-[#10292d] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-[#10292d] transition-colors">
                  Explore Videos
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#10292d] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#benefits" className="hover:text-[#10292d] transition-colors">
                  Benefits
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Categories */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#10292d]">Categories</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#66726f]">
              <li>
                <Link href="/explore?cat=Space" className="hover:text-[#10292d] transition-colors">
                  Space & Cosmos
                </Link>
              </li>
              <li>
                <Link href="/explore?cat=Nature" className="hover:text-[#10292d] transition-colors">
                  Nature & Wildlife
                </Link>
              </li>
              <li>
                <Link href="/explore?cat=Technology" className="hover:text-[#10292d] transition-colors">
                  Technology & Future
                </Link>
              </li>
              <li>
                <Link href="/explore?cat=Science" className="hover:text-[#10292d] transition-colors">
                  Science & Innovation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Attribution */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#10292d]">Legal</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#66726f]">
              <li>
                <Link href="/privacy" className="hover:text-[#10292d] transition-colors">
                  Privacy Policy (Draft)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#10292d] transition-colors">
                  Terms of Service (Draft)
                </Link>
              </li>
              <li className="pt-2 text-xs text-[#93aaa6] leading-tight">
                Design adapted under MIT license from Kedhareswer Naidu template.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#66726f]">
          <p>© {new Date().getFullYear()} PlayNova. All rights reserved. Built with Next.js, TypeScript & GSAP.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[#10292d]">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-[#10292d]">Terms</Link>
            <span>·</span>
            <span className="text-[#8c7b33] font-mono font-medium">Phase 1 Complete</span>
          </div>
        </div>

        {/* Oversized animated template-inspired wordmark */}
        <div
          ref={bigmarkRef}
          aria-hidden="true"
          className="flex justify-center mt-12 text-[clamp(60px,18vw,260px)] font-bold tracking-[-0.06em] leading-[0.8] select-none text-transparent border-t border-[#e2e0d6]/50 pt-4"
          style={{
            WebkitTextStroke: "1px rgba(16, 41, 45, 0.18)",
          }}
        >
          {"PLAYNOVA".split("").map((letter, i) => (
            <span
              key={i}
              className="inline-block bg-gradient-to-b from-[#8c7b33]/30 to-transparent bg-clip-text"
            >
              {letter}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}

