"use client"

import React, { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import SearchBar from "@/components/search/SearchBar"
import SearchFilterBar, { FilterState } from "@/components/search/SearchFilterBar"
import VideoCard from "@/components/ui/VideoCard"
import { searchVideosApi, PaginatedVideosResponse } from "@/services/videoApi"
import { VideoItem, VideoCategory } from "@/types"

function ExploreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialQ = searchParams.get("q") || ""
  const initialCat = (searchParams.get("cat") || "All") as "All" | VideoCategory

  const [query, setQuery] = useState(initialQ)
  const [filters, setFilters] = useState<FilterState>({
    category: initialCat,
    duration: "any",
    sort: "relevant",
  })

  const [results, setResults] = useState<PaginatedVideosResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Sync state if URL changes externally
  useEffect(() => {
    const q = searchParams.get("q") || ""
    const cat = (searchParams.get("cat") || "All") as "All" | VideoCategory
    setQuery(q)
    setFilters((prev) => ({ ...prev, category: cat }))
  }, [searchParams])

  // Execute search
  const executeSearch = useCallback(
    async (pageToLoad: number = 1) => {
      setIsLoading(true)
      try {
        const res = await searchVideosApi({
          query: query.trim() || undefined,
          category: filters.category !== "All" ? filters.category : undefined,
          duration: filters.duration,
          sort: filters.sort,
          page: pageToLoad,
          limit: 12,
        })
        setResults(res)
      } catch (err) {
        console.error("Explore search failed:", err)
      } finally {
        setIsLoading(false)
      }
    },
    [query, filters]
  )

  useEffect(() => {
    executeSearch(1)
  }, [executeSearch])

  const handleSearchSubmit = (newQuery: string) => {
    setQuery(newQuery)
    const params = new URLSearchParams()
    if (newQuery) params.set("q", newQuery)
    if (filters.category !== "All") params.set("cat", filters.category)
    router.replace(`/explore?${params.toString()}`)
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (newFilters.category !== "All") params.set("cat", newFilters.category)
    router.replace(`/explore?${params.toString()}`)
  }

  return (
    <div className="pt-24 pb-24 bg-[#f5f4ee] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Editorial Header Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0c2f35] text-[#eef2ec] border border-white/10 shadow-xl flex flex-col gap-4 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#8c7b33]/20 blur-3xl pointer-events-none"
          />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#8c7b33]">
              PlayNova Discovery
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[#ffffff]">
            Find Exactly What You Want to Watch
          </h1>
          <p className="text-sm sm:text-base text-[#93aaa6] max-w-2xl leading-relaxed">
            Search our curated library by title, topic, or tag. Filter by category, running duration, or sort by what is trending now.
          </p>

          {/* Search bar inside banner */}
          <div className="mt-4 max-w-2xl">
            <SearchBar
              initialQuery={query}
              onSearch={handleSearchSubmit}
              placeholder="Search space, biology, design, quantum computing..."
            />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-[#e2e0d6] shadow-sm">
          <SearchFilterBar
            filters={filters}
            onChange={handleFilterChange}
            totalCount={results.total}
          />
        </div>

        {/* Active Query Indicator */}
        {query && (
          <div className="flex items-center gap-2 text-sm text-[#66726f]">
            <span>Showing results for &ldquo;<span className="text-[#10292d] font-semibold">{query}</span>&rdquo;</span>
            <button
              type="button"
              onClick={() => handleSearchSubmit("")}
              className="text-xs text-[#8c7b33] hover:underline ml-2"
            >
              Clear query
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#0c2f35]/10 border border-[#e2e0d6] h-72 animate-pulse flex flex-col overflow-hidden"
              >
                <div className="aspect-video bg-black/10 w-full" />
                <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                  <div className="h-4 bg-black/10 rounded w-3/4" />
                  <div className="h-3 bg-black/10 rounded w-1/2" />
                  <div className="h-4 bg-black/10 rounded w-1/4 mt-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Results Grid */}
        {!isLoading && results.items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {results.items.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                showWatchlistButton={true}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && results.items.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-white/50 border border-[#e2e0d6]">
            <div className="w-16 h-16 rounded-2xl bg-[#8c7b33]/15 text-[#8c7b33] flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-[#10292d] mb-2">No videos matched your criteria</h3>
            <p className="text-sm text-[#66726f] max-w-md mb-6">
              Try adjusting your search terms, removing filters, or explore our popular categories like Space, Education, or Nature.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Space", "Education", "Nature", "Technology", "Science"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setQuery("")
                    handleFilterChange({
                      category: cat as VideoCategory,
                      duration: "any",
                      sort: "relevant",
                    })
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white border border-[#e2e0d6] text-[#10292d] hover:bg-black/5"
                >
                  Explore {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && results.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-8 border-t border-[#e2e0d6]">
            <button
              type="button"
              disabled={results.page <= 1}
              onClick={() => executeSearch(results.page - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e2e0d6] text-[#10292d] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-[#66726f]">
              Page <span className="font-semibold text-[#10292d]">{results.page}</span> of {results.totalPages}
            </span>
            <button
              type="button"
              disabled={results.page >= results.totalPages}
              onClick={() => executeSearch(results.page + 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e2e0d6] text-[#10292d] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="pt-32 pb-24 text-center text-[#66726f]">
          <p className="text-sm font-medium">Loading PlayNova Discovery...</p>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  )
}
