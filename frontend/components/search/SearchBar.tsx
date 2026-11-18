"use client"

import React, { useState, useEffect, useRef, KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { getSearchSuggestionsApi, SearchSuggestionsResponse } from "@/services/videoApi"
import { VideoItem } from "@/types"

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  onSearch?: (query: string) => void
  onSelectVideo?: (video: VideoItem) => void
  autoFocus?: boolean
  className?: string
}

const RECENT_SEARCHES_KEY = "playnova_recent_searches"

export default function SearchBar({
  initialQuery = "",
  placeholder = "Search titles, categories, tags, or topics...",
  onSearch,
  onSelectVideo,
  autoFocus = false,
  className = "",
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [videoMatches, setVideoMatches] = useState<VideoItem[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showRecent, setShowRecent] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [isLoading, setIsLoading] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, 5))
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  const saveRecentSearch = (term: string) => {
    const clean = term.trim()
    if (!clean) return
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 5)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const removeRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item !== term)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    setShowRecent(false)
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  // Debounced live suggestion fetch
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed || trimmed.length < 1) {
      setSuggestions([])
      setVideoMatches([])
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res: SearchSuggestionsResponse = await getSearchSuggestionsApi(trimmed)
        setSuggestions(res.suggestions || [])
        setVideoMatches(res.videos || [])
        setIsOpen((res.suggestions?.length || 0) > 0 || (res.videos?.length || 0) > 0)
        setActiveIndex(-1)
      } catch (err) {
        setSuggestions([])
        setVideoMatches([])
      } finally {
        setIsLoading(false)
      }
    }, 280)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [query])

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setShowRecent(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const totalItems = suggestions.length + videoMatches.length

  const handleSubmit = (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim()
    if (q) saveRecentSearch(q)
    setIsOpen(false)
    setShowRecent(false)
    setActiveIndex(-1)
    if (onSearch) {
      onSearch(q)
    } else {
      router.push(`/explore?q=${encodeURIComponent(q)}`)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || totalItems === 0) {
      if (e.key === "Enter") {
        e.preventDefault()
        handleSubmit()
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIndex >= 0) {
        if (activeIndex < suggestions.length) {
          const selected = suggestions[activeIndex]
          setQuery(selected)
          handleSubmit(selected)
        } else {
          const video = videoMatches[activeIndex - suggestions.length]
          if (onSelectVideo) {
            onSelectVideo(video)
          } else {
            router.push(`/watch/${video.id}`)
          }
        }
      } else {
        handleSubmit()
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  // Highlight matching characters in text
  const renderHighlighted = (text: string, highlight: string) => {
    if (!highlight.trim()) return text
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const parts = text.split(new RegExp(`(${escaped})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span key={i} className="text-[#8c7b33] font-semibold underline underline-offset-2">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        {/* Search icon */}
        <span className="absolute left-4 pointer-events-none text-[#66726f]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value
            setQuery(val)
            if (!val.trim() && recentSearches.length > 0) {
              setShowRecent(true)
            } else {
              setShowRecent(false)
            }
          }}
          onFocus={() => {
            if (!query.trim() && recentSearches.length > 0) {
              setShowRecent(true)
            } else if ((suggestions.length > 0 || videoMatches.length > 0) && query.trim()) {
              setIsOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-11 pr-24 py-3 sm:py-3.5 bg-white/90 backdrop-blur-md rounded-2xl border border-[#e2e0d6] text-[#10292d] placeholder-[#8f9b97] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#8c7b33]/40 focus:border-[#8c7b33] shadow-sm transition-all"
        />

        {/* Clear and Submit actions */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setSuggestions([])
                setVideoMatches([])
                setIsOpen(false)
                if (onSearch) onSearch("")
              }}
              className="p-1.5 rounded-lg text-[#66726f] hover:text-[#10292d] hover:bg-black/5 transition-colors"
              aria-label="Clear search"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-3 py-1.5 rounded-xl bg-[#10292d] hover:bg-[#16383e] text-white text-xs font-medium tracking-wide shadow-sm transition-all"
          >
            Search
          </button>
        </div>
      </div>

      {/* Recent Searches Dropdown (when focused & query is empty) */}
      {showRecent && !query.trim() && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-[#e2e0d6] rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2">
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8c7b33]">
                Recent Searches
              </span>
              <button
                type="button"
                onClick={clearRecentSearches}
                className="text-[11px] font-medium text-[#66726f] hover:text-red-700 transition-colors"
              >
                Clear History
              </button>
            </div>
            {recentSearches.map((term) => (
              <div
                key={term}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-black/5 transition-colors group"
              >
                <button
                  type="button"
                  onClick={() => {
                    setQuery(term)
                    handleSubmit(term)
                  }}
                  className="flex-1 flex items-center gap-2.5 text-left text-xs sm:text-sm text-[#10292d] truncate"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[#66726f] flex-shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="truncate">{term}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeRecentSearch(term)
                  }}
                  aria-label={`Remove ${term} from recent searches`}
                  className="p-1 text-[#99a2a0] hover:text-[#10292d] opacity-70 group-hover:opacity-100"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-[#e2e0d6] rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {suggestions.length > 0 && (
            <div className="p-2 border-b border-[#e2e0d6]/70">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8c7b33] px-3 py-1">
                Suggested Topics & Tags
              </div>
              {suggestions.map((suggestion, idx) => {
                const isSelected = activeIndex === idx
                return (
                  <button
                    key={`sug-${idx}`}
                    type="button"
                    onClick={() => {
                      setQuery(suggestion)
                      handleSubmit(suggestion)
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl text-xs sm:text-sm transition-colors ${
                      isSelected ? "bg-[#8c7b33]/15 text-[#10292d] font-medium" : "text-[#10292d] hover:bg-black/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8c7b33] flex-shrink-0">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <span className="truncate">{renderHighlighted(suggestion, query)}</span>
                    </div>
                    <span className="text-[10px] text-[#66726f] ml-2 flex-shrink-0">Search tag</span>
                  </button>
                )
              })}
            </div>
          )}

          {videoMatches.length > 0 && (
            <div className="p-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8c7b33] px-3 py-1">
                Matching Videos
              </div>
              {videoMatches.map((video, idx) => {
                const itemIndex = suggestions.length + idx
                const isSelected = activeIndex === itemIndex
                return (
                  <button
                    key={`vid-${video.id}`}
                    type="button"
                    onClick={() => {
                      if (onSelectVideo) {
                        onSelectVideo(video)
                      } else {
                        router.push(`/watch/${video.id}`)
                      }
                    }}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-colors ${
                      isSelected ? "bg-[#8c7b33]/15" : "hover:bg-black/5"
                    }`}
                  >
                    <div className="w-14 h-9 rounded-lg overflow-hidden bg-black/10 flex-shrink-0 relative">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-[#10292d] truncate">
                        {renderHighlighted(video.title, query)}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#66726f]">
                        <span className="text-[#8c7b33] font-medium">{video.category}</span>
                        <span>•</span>
                        <span>{video.views.toLocaleString()} views</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Quick footer hint */}
          <div className="px-4 py-2 bg-black/[0.02] border-t border-[#e2e0d6]/60 flex items-center justify-between text-[11px] text-[#66726f]">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 border border-black/10 font-mono text-[10px]">Enter</kbd> to view full results</span>
            <span><kbd className="px-1 py-0.5 rounded bg-black/5 border border-black/10 font-mono text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-black/5 border border-black/10 font-mono text-[10px]">↓</kbd> navigate</span>
          </div>
        </div>
      )}
    </div>
  )
}

