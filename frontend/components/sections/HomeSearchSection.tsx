"use client"

import React from "react"
import Link from "next/link"
import SearchBar from "@/components/search/SearchBar"

const POPULAR_TOPICS = [
  { label: "Deep Space", query: "space" },
  { label: "Wildlife", query: "wildlife" },
  { label: "Quantum Computing", query: "quantum" },
  { label: "Marine Biology", query: "ocean" },
  { label: "Next.js Architecture", query: "react" },
  { label: "Typography", query: "typography" },
]

export default function HomeSearchSection() {
  return (
    <section className="relative w-full py-10 px-4 sm:px-6 lg:px-8 bg-[#f5f4ee] border-b border-[#e2e0d6]">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-5">
        <div className="w-full">
          <SearchBar
            placeholder="Search thousands of hours of high-fidelity streams, titles, tags..."
            className="shadow-md"
          />
        </div>

        {/* Popular topic chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-[#66726f] font-medium mr-1">Trending Topics:</span>
          {POPULAR_TOPICS.map((topic) => (
            <Link
              key={topic.label}
              href={`/explore?q=${encodeURIComponent(topic.query)}`}
              className="px-3 py-1 rounded-full bg-white border border-[#e2e0d6] text-[#10292d] hover:border-[#8c7b33] hover:text-[#8c7b33] hover:bg-black/[0.02] transition-all"
            >
              {topic.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
