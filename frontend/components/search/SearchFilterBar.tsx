"use client"

import React from "react"
import { VideoCategory, ALL_VIDEO_CATEGORIES } from "@/types"

export interface FilterState {
  category: "All" | VideoCategory
  duration: "any" | "short" | "medium" | "long"
  uploadDate: "any" | "today" | "week" | "month" | "year"
  sort: "relevant" | "recent" | "views" | "alpha"
  source: "all" | "youtube" | "native"
}

interface SearchFilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  totalCount?: number
  youtubeConfigured?: boolean
}

const CATEGORIES: ("All" | VideoCategory)[] = ["All", ...ALL_VIDEO_CATEGORIES]

export default function SearchFilterBar({
  filters,
  onChange,
  totalCount,
  youtubeConfigured = false,
}: SearchFilterBarProps) {
  const isFiltered =
    filters.category !== "All" ||
    filters.duration !== "any" ||
    filters.uploadDate !== "any" ||
    filters.sort !== "relevant" ||
    filters.source !== "all"

  const handleReset = () => {
    onChange({
      category: "All",
      duration: "any",
      uploadDate: "any",
      sort: "relevant",
      source: "all",
    })
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 19-Category Pills Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 text-xs" role="tablist" aria-label="Video categories">
        {CATEGORIES.map((cat) => {
          const isActive = filters.category === cat
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange({ ...filters, category: cat })}
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

      {/* Secondary Bar: Source, Upload Date, Duration, Sort & Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#e2e0d6]/80 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Source Selector */}
          <div className="flex items-center gap-1.5 bg-white/80 border border-[#e2e0d6] rounded-xl px-2.5 py-1.5">
            <span className="text-[#66726f]">Source:</span>
            <select
              aria-label="Content source"
              value={filters.source}
              onChange={(e) => onChange({ ...filters, source: e.target.value as FilterState["source"] })}
              className="bg-transparent text-[#10292d] font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">{youtubeConfigured ? "All Sources" : "All Available"}</option>
              <option value="youtube">{youtubeConfigured ? "Creator Channels" : "Creator Channels (Key Required)"}</option>
              <option value="native">PlayNova Library</option>
            </select>
          </div>

          {/* Upload Date Selector */}
          <div className="flex items-center gap-1.5 bg-white/80 border border-[#e2e0d6] rounded-xl px-2.5 py-1.5">
            <span className="text-[#66726f]">Uploaded:</span>
            <select
              aria-label="Upload date filter"
              value={filters.uploadDate}
              onChange={(e) => onChange({ ...filters, uploadDate: e.target.value as FilterState["uploadDate"] })}
              className="bg-transparent text-[#10292d] font-medium focus:outline-none cursor-pointer"
            >
              <option value="any">Any time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
            </select>
          </div>

          {/* Duration Selector */}
          <div className="flex items-center gap-1.5 bg-white/80 border border-[#e2e0d6] rounded-xl px-2.5 py-1.5">
            <span className="text-[#66726f]">Duration:</span>
            <select
              aria-label="Duration filter"
              value={filters.duration}
              onChange={(e) => onChange({ ...filters, duration: e.target.value as FilterState["duration"] })}
              className="bg-transparent text-[#10292d] font-medium focus:outline-none cursor-pointer"
            >
              <option value="any">Any duration</option>
              <option value="short">Short (&lt; 4 min)</option>
              <option value="medium">Medium (4–20 min)</option>
              <option value="long">Long (&gt; 20 min)</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-white/80 border border-[#e2e0d6] rounded-xl px-2.5 py-1.5">
            <span className="text-[#66726f]">Sort:</span>
            <select
              aria-label="Sort order"
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value as FilterState["sort"] })}
              className="bg-transparent text-[#10292d] font-medium focus:outline-none cursor-pointer"
            >
              <option value="relevant">Most Relevant</option>
              <option value="recent">Most Recent</option>
              <option value="views">Most Popular</option>
              <option value="alpha">Alphabetical (A-Z)</option>
            </select>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded-xl text-xs text-[#8c7b33] hover:text-[#706227] hover:bg-[#8c7b33]/10 font-medium transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {totalCount !== undefined && (
          <div className="text-xs text-[#66726f]">
            Found <span className="font-semibold text-[#10292d]">{totalCount.toLocaleString()}</span>{" "}
            {totalCount === 1 ? "video" : "videos"}
          </div>
        )}
      </div>
    </div>
  )
}
