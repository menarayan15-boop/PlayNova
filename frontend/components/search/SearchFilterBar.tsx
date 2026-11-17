"use client"

import React from "react"
import { VideoCategory } from "@/types"

export interface FilterState {
  category: "All" | VideoCategory
  duration: "any" | "short" | "medium" | "long"
  sort: "relevant" | "recent" | "views" | "alpha"
}

interface SearchFilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  totalCount?: number
}

const CATEGORIES: ("All" | VideoCategory)[] = [
  "All",
  "Technology",
  "Education",
  "Nature",
  "Science",
  "Space",
  "Entertainment",
  "Documentaries",
]

export default function SearchFilterBar({
  filters,
  onChange,
  totalCount,
}: SearchFilterBarProps) {
  const handleCategoryChange = (category: "All" | VideoCategory) => {
    onChange({ ...filters, category })
  }

  const handleDurationChange = (duration: FilterState["duration"]) => {
    onChange({ ...filters, duration })
  }

  const handleSortChange = (sort: FilterState["sort"]) => {
    onChange({ ...filters, sort })
  }

  const isFiltered = filters.category !== "All" || filters.duration !== "any" || filters.sort !== "relevant"

  const handleReset = () => {
    onChange({
      category: "All",
      duration: "any",
      sort: "relevant",
    })
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {CATEGORIES.map((cat) => {
          const isActive = filters.category === cat
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#10292d] text-white shadow-sm font-semibold"
                  : "bg-white/80 border border-[#e2e0d6] text-[#10292d] hover:bg-black/5"
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Secondary Bar: Duration, Sort & Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#e2e0d6]/80 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Duration Selector */}
          <div className="flex items-center gap-1.5 bg-white/80 border border-[#e2e0d6] rounded-xl px-2.5 py-1.5">
            <span className="text-[#66726f] text-xs">Duration:</span>
            <select
              value={filters.duration}
              onChange={(e) => handleDurationChange(e.target.value as FilterState["duration"])}
              className="bg-transparent text-[#10292d] text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="any">Any duration</option>
              <option value="short">Short (&lt; 5 min)</option>
              <option value="medium">Medium (5–15 min)</option>
              <option value="long">Long (&gt; 15 min)</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-white/80 border border-[#e2e0d6] rounded-xl px-2.5 py-1.5">
            <span className="text-[#66726f] text-xs">Sort:</span>
            <select
              value={filters.sort}
              onChange={(e) => handleSortChange(e.target.value as FilterState["sort"])}
              className="bg-transparent text-[#10292d] text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="relevant">Most Relevant</option>
              <option value="recent">Most Recent</option>
              <option value="views">Most Watched</option>
              <option value="alpha">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* Reset Action */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded-xl text-xs text-[#8c7b33] hover:text-[#706227] hover:bg-[#8c7b33]/10 font-medium transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Results Counter */}
        {totalCount !== undefined && (
          <div className="text-xs text-[#66726f]">
            Found <span className="font-semibold text-[#10292d]">{totalCount}</span> {totalCount === 1 ? "video" : "videos"}
          </div>
        )}
      </div>
    </div>
  )
}
