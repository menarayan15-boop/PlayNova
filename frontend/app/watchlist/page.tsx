"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useWatchlistStore } from "@/stores/useWatchlistStore"
import { useAuthStore } from "@/stores/useAuthStore"
import VideoCard from "@/components/ui/VideoCard"

type WatchlistSort = "recent" | "alpha" | "duration"

export default function WatchlistPage() {
  const {
    items,
    collections,
    activeCollection,
    isLoading,
    setActiveCollection,
    fetchWatchlist,
    addToCollection,
    removeItem,
  } = useWatchlistStore()
  const { isAuthenticated, isInitialized } = useAuthStore()

  const [sortOrder, setSortOrder] = useState<WatchlistSort>("recent")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [customCollections, setCustomCollections] = useState<string[]>([])

  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  const allCollectionTabs = useMemo(() => {
    const merged = Array.from(new Set(["Watch Later", "Favorites", ...collections, ...customCollections]))
    return ["All", ...merged]
  }, [collections, customCollections])

  // Filtered and sorted items
  const visibleItems = useMemo(() => {
    let list = [...items]

    if (activeCollection !== "All") {
      list = list.filter((entry) => (entry.collectionName || "Watch Later") === activeCollection)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (entry) =>
          entry.video.title.toLowerCase().includes(q) ||
          entry.video.category.toLowerCase().includes(q) ||
          (entry.video.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    }

    list.sort((a, b) => {
      if (sortOrder === "recent") {
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      } else if (sortOrder === "alpha") {
        return a.video.title.localeCompare(b.video.title)
      } else if (sortOrder === "duration") {
        return b.video.duration - a.video.duration
      }
      return 0
    })

    return list
  }, [items, activeCollection, searchQuery, sortOrder])

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = newCollectionName.trim()
    if (!clean) return
    if (!customCollections.includes(clean) && !collections.includes(clean)) {
      setCustomCollections((prev) => [...prev, clean])
    }
    setActiveCollection(clean)
    setNewCollectionName("")
    setIsCreatingCollection(false)
  }

  return (
    <div className="pt-24 pb-24 bg-[#f5f4ee] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Editorial Header */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0c2f35] text-[#eef2ec] border border-white/10 shadow-xl flex flex-col gap-4 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#8c7b33]/20 blur-3xl pointer-events-none"
          />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#8c7b33]">
              Personal Library &amp; Collections
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[#ffffff]">
            Your Watchlist
          </h1>
          <p className="text-sm sm:text-base text-[#93aaa6] max-w-xl leading-relaxed">
            Organize saved videos into custom collections like Watch Later, Favorites, or thematic lists. Synced permanently to your PlayNova account.
          </p>
        </div>

        {/* Not Authenticated State */}
        {isInitialized && !isAuthenticated && (
          <div className="p-10 rounded-3xl bg-white/70 border border-[#e2e0d6] text-center flex flex-col items-center justify-center max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#8c7b33]/15 text-[#8c7b33] flex items-center justify-center mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-[#10292d] mb-2">Sign in to save videos</h2>
            <p className="text-sm text-[#66726f] mb-6">
              Create an account or sign in to build custom collections and sync your watchlist across all your devices.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#10292d] text-white hover:bg-[#16383e] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white border border-[#e2e0d6] text-[#10292d] hover:bg-black/5 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}

        {/* Authenticated Watchlist View */}
        {(!isInitialized || isAuthenticated) && (
          <>
            {/* Collection Tabs Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {allCollectionTabs.map((col) => {
                const isSelected = activeCollection === col
                const count =
                  col === "All"
                    ? items.length
                    : items.filter((e) => (e.collectionName || "Watch Later") === col).length

                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setActiveCollection(col)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${
                      isSelected
                        ? "bg-[#0f3238] text-white shadow-sm"
                        : "bg-white/80 text-[#10292d] border border-[#e2e0d6] hover:border-[#8c7b33]/50"
                    }`}
                  >
                    <span>{col}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        isSelected ? "bg-white/20 text-white" : "bg-[#f5f4ee] text-[#66726f]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}

              {isCreatingCollection ? (
                <form onSubmit={handleCreateCollection} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Collection name..."
                    autoFocus
                    maxLength={32}
                    className="px-3 py-1.5 rounded-full text-xs bg-white border border-[#8c7b33] text-[#10292d] focus:outline-none w-40"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#8c7b33] text-white hover:bg-[#736529]"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCollection(false)
                      setNewCollectionName("")
                    }}
                    className="px-2 py-1.5 text-xs text-[#66726f] hover:text-[#10292d]"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreatingCollection(true)}
                  className="px-3.5 py-2 rounded-full text-xs font-medium border border-dashed border-[#8c7b33]/60 text-[#8c7b33] hover:bg-[#8c7b33]/10 transition-colors"
                >
                  + New Collection
                </button>
              )}
            </div>

            {/* Toolbar: Search, Counter & Sort */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/75 backdrop-blur-md border border-[#e2e0d6]">
              {/* Search within saved items */}
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <svg
                  className="w-4 h-4 text-[#66726f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved videos by title, category, or tag..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-[#e2e0d6] text-xs text-[#10292d] placeholder:text-[#99a2a0] focus:outline-none focus:border-[#8c7b33]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear filter"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#99a2a0] hover:text-[#10292d]"
                  >
                    &times;
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-[#66726f]">
                  Showing <strong className="text-[#10292d]">{visibleItems.length}</strong> of {items.length}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#66726f]">Sort:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as WatchlistSort)}
                    className="bg-white border border-[#e2e0d6] rounded-xl px-3 py-1.5 text-xs text-[#10292d] font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="alpha">Title (A-Z)</option>
                    <option value="duration">Longest Duration</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading skeletons */}
            {isLoading && items.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-black/5 animate-pulse" />
                ))}
              </div>
            )}

            {/* Video Cards Grid */}
            {!isLoading && visibleItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {visibleItems.map((entry) => {
                  const colName = entry.collectionName || "Watch Later"
                  return (
                    <div key={`${entry.videoId}-${colName}`} className="flex flex-col relative">
                      <VideoCard video={entry.video} showWatchlistButton={true} />
                      <div className="mt-2.5 flex items-center justify-between gap-2 px-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#8c7b33]/15 text-[#8c7b33]">
                            {colName}
                          </span>
                          <select
                            aria-label="Add to another collection"
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                addToCollection(entry.video, e.target.value)
                                e.target.value = ""
                              }
                            }}
                            className="text-[10px] bg-transparent border border-[#e2e0d6] rounded-lg px-1.5 py-0.5 text-[#66726f] hover:border-[#8c7b33] focus:outline-none cursor-pointer"
                          >
                            <option value="" disabled>
                              + Copy to...
                            </option>
                            {allCollectionTabs
                              .filter((c) => c !== "All" && c !== colName)
                              .map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(entry.videoId, colName)}
                          className="text-[11px] text-[#66726f] hover:text-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && visibleItems.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-white/50 border border-[#e2e0d6]">
                <div className="w-16 h-16 rounded-2xl bg-[#8c7b33]/15 text-[#8c7b33] flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-[#10292d] mb-2">
                  {searchQuery
                    ? `No saved videos match "${searchQuery}"`
                    : activeCollection !== "All"
                    ? `No videos in "${activeCollection}" yet`
                    : "Your watchlist is currently empty"}
                </h3>
                <p className="text-sm text-[#66726f] max-w-md mb-6 leading-relaxed">
                  {searchQuery
                    ? "Try adjusting your search keywords or switching to the All collection tab."
                    : "As you browse channels and streams, tap the bookmark icon on any video thumbnail to save it here for later."}
                </p>
                {searchQuery || activeCollection !== "All" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("")
                      setActiveCollection("All")
                    }}
                    className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#10292d] text-white hover:bg-[#16383e] shadow-sm transition-all"
                  >
                    Show All Saved Videos
                  </button>
                ) : (
                  <Link
                    href="/explore"
                    className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#10292d] text-white hover:bg-[#16383e] shadow-sm transition-all"
                  >
                    Explore Catalog
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
