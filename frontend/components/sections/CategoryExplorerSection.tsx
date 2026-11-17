"use client"

import React from "react"
import Link from "next/link"

const CATEGORIES = [
  {
    name: "Space",
    description: "Astrophysics, orbital mechanics, planetary nebulae, and deep cosmological observatories.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
    color: "from-purple-950/80 to-black/80",
  },
  {
    name: "Nature",
    description: "Alpine peaks, coral reefs, wildlife ecosystems, and breathtaking natural environments.",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
    color: "from-emerald-950/80 to-black/80",
  },
  {
    name: "Technology",
    description: "Semiconductor fabrication, quantum computing architectures, and software engineering.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    color: "from-cyan-950/80 to-black/80",
  },
  {
    name: "Education",
    description: "Masterclasses in full-stack architecture, typography design, and pedagogical lectures.",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
    color: "from-amber-950/80 to-black/80",
  },
  {
    name: "Science",
    description: "Theoretical physics, cellular biology, CRISPR genomics, and atmospheric sciences.",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80",
    color: "from-blue-950/80 to-black/80",
  },
  {
    name: "Documentaries",
    description: "In-depth investigative retrospectives on oceanic exploration, engineering, and history.",
    image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80",
    color: "from-teal-950/80 to-black/80",
  },
]

export default function CategoryExplorerSection() {
  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-[#f5f4ee] border-b border-[#e2e0d6]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#8c7b33]">
                Taxonomy
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#10292d]">
              Explore by Category
            </h2>
            <p className="text-xs sm:text-sm text-[#66726f] mt-1">
              Dive into specialized subjects, curated specifically for focused learning and viewing.
            </p>
          </div>

          <Link
            href="/explore"
            className="text-xs sm:text-sm font-semibold text-[#8c7b33] hover:text-[#706227] inline-flex items-center gap-1 transition-colors"
          >
            All Channels
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/explore?cat=${encodeURIComponent(cat.name)}`}
              className="group relative h-48 rounded-2xl overflow-hidden border border-[#e2e0d6] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-end p-6"
            >
              {/* Image background */}
              <div className="absolute inset-0 z-0">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-90 transition-opacity duration-300 group-hover:opacity-95`} />
              </div>

              {/* Text Content */}
              <div className="relative z-10 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-medium text-[#ffffff] tracking-tight group-hover:text-[#cdc8f6] transition-colors">
                    {cat.name}
                  </h3>
                  <span className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-[#8c7b33] flex items-center justify-center text-white transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
                <p className="text-xs text-[#93aaa6] line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

