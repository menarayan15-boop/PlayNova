"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/useAuthStore"
import {
  fetchAdminVideoInventoryApi,
  validateAdminVideoSourceApi,
  createAdminVideoApi,
  updateAdminVideoApi,
} from "@/services/videoApi"
import { VideoItem, VideoCategory } from "@/types"

const CATEGORIES: VideoCategory[] = [
  "Technology",
  "Science",
  "Space",
  "Nature",
  "Education",
  "Documentaries",
  "Entertainment",
]

export default function AdminVideosPage() {
  const { user, isAuthenticated, isInitialized } = useAuthStore()
  const isAdmin = isAuthenticated && user?.role === "admin"

  const [items, setItems] = useState<VideoItem[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Add video form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [duration, setDuration] = useState("180")
  const [category, setCategory] = useState<VideoCategory>("Space")
  const [tags, setTags] = useState("")
  const [sourceAttribution, setSourceAttribution] = useState("NASA / Public Domain")
  const [license, setLicense] = useState("Public Domain")
  const [validationResult, setValidationResult] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadInventory = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    const res = await fetchAdminVideoInventoryApi({
      status: statusFilter,
      category: categoryFilter,
      page,
      limit: 15,
    })
    if (res.ok && res.data) {
      setItems(res.data.items || [])
      setTotalPages(res.data.pagination?.totalPages || 1)
      setStatusCounts(res.data.summary?.statusCounts || {})
    }
    setIsLoading(false)
  }, [isAdmin, statusFilter, categoryFilter, page])

  useEffect(() => {
    if (isInitialized) loadInventory()
  }, [isInitialized, loadInventory])

  const handleValidateSource = async () => {
    if (!videoUrl || !thumbnailUrl) {
      setFeedback({ type: "error", text: "Enter both Video URL and Thumbnail URL before validating." })
      return
    }
    setIsValidating(true)
    setValidationResult(null)
    setFeedback(null)
    const res = await validateAdminVideoSourceApi(videoUrl, thumbnailUrl)
    setIsValidating(false)
    if (res.ok && res.data) {
      setValidationResult(res.data)
    } else {
      setFeedback({ type: "error", text: res.message || "Validation request failed" })
    }
  }

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)
    const res = await createAdminVideoApi({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration: Number(duration) || 120,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      sourceAttribution,
      license,
      publishImmediately: true,
    })
    setIsSubmitting(false)

    if (res.ok) {
      setFeedback({ type: "success", text: "Video validated and published to MongoDB catalog!" })
      setTitle("")
      setDescription("")
      setVideoUrl("")
      setThumbnailUrl("")
      setTags("")
      setValidationResult(null)
      setShowAddForm(false)
      loadInventory()
    } else {
      setFeedback({ type: "error", text: res.message || "Failed to add video" })
    }
  }

  const handleToggleStatus = async (video: VideoItem) => {
    const nextStatus = video.status === "published" ? "draft" : "published"
    const res = await updateAdminVideoApi(video.id, { status: nextStatus })
    if (res.ok) {
      setFeedback({ type: "success", text: `"${video.title}" updated to ${nextStatus}.` })
      loadInventory()
    } else {
      setFeedback({ type: "error", text: res.message || "Failed to update status" })
    }
  }

  const handleToggleFeatured = async (video: VideoItem) => {
    const res = await updateAdminVideoApi(video.id, { featured: !video.featured })
    if (res.ok) {
      loadInventory()
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#f5f4ee]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header */}
        <div className="p-8 rounded-3xl bg-[#0c2f35] text-[#eef2ec] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#8c7b33]">
                Authorized Content Inventory
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-white">
              Video Catalog Manager
            </h1>
            <p className="text-sm text-[#93aaa6] mt-1">
              Validate media streams, prevent duplicate sources, manage publication status, and inspect content health.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <Link
                href="/admin/analytics"
                className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white"
              >
                Analytics Console
              </Link>
              <button
                type="button"
                onClick={() => setShowAddForm((v) => !v)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#8c7b33] hover:bg-[#a6923d] text-white"
              >
                {showAddForm ? "Close Form" : "+ Add Validated Video"}
              </button>
            </div>
          )}
        </div>

        {/* Access Denied */}
        {isInitialized && !isAdmin && (
          <div className="p-10 rounded-3xl bg-white border border-[#e2e0d6] text-center max-w-lg mx-auto">
            <h2 className="text-xl font-semibold text-[#10292d] mb-2">Administrator Access Required</h2>
            <p className="text-sm text-[#66726f] mb-6">
              Catalog management is strictly restricted to authorized PlayNova administrators.
            </p>
            <Link
              href="/"
              className="inline-flex px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0f3238] text-white"
            >
              Return Home
            </Link>
          </div>
        )}

        {isAdmin && feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium border ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Inventory Summary Cards */}
        {isAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Published", count: statusCounts.published || 0, color: "text-emerald-700" },
              { label: "Drafts", count: statusCounts.draft || 0, color: "text-amber-700" },
              { label: "Duplicate Archived", count: statusCounts.duplicate_archived || 0, color: "text-[#66726f]" },
              { label: "Broken", count: statusCounts.broken || 0, color: "text-rose-700" },
            ].map((stat) => (
              <div key={stat.label} className="p-5 rounded-2xl bg-white border border-[#e2e0d6] shadow-sm">
                <span className="text-[11px] font-mono uppercase text-[#66726f]">{stat.label}</span>
                <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>{stat.count}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add & Validate Video Form */}
        {isAdmin && showAddForm && (
          <form
            onSubmit={handleCreateVideo}
            className="p-6 sm:p-8 rounded-3xl bg-white border border-[#e2e0d6] shadow-sm flex flex-col gap-5"
          >
            <h2 className="text-lg font-semibold text-[#10292d]">Register Authorized Video Source</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video Title"
                className="px-3.5 py-2.5 rounded-xl border border-[#e2e0d6] text-sm"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VideoCategory)}
                className="px-3.5 py-2.5 rounded-xl border border-[#e2e0d6] text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="url"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Direct HTTPS MP4 / WebM URL"
                className="px-3.5 py-2.5 rounded-xl border border-[#e2e0d6] text-sm"
              />
              <input
                type="url"
                required
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="HTTPS Thumbnail Image URL"
                className="px-3.5 py-2.5 rounded-xl border border-[#e2e0d6] text-sm"
              />
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Duration (seconds)"
                className="px-3.5 py-2.5 rounded-xl border border-[#e2e0d6] text-sm"
              />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated tags (e.g. nasa, robotics, space)"
                className="px-3.5 py-2.5 rounded-xl border border-[#e2e0d6] text-sm"
              />
              <input
                type="text"
                value={sourceAttribution}
                onChange={(e) => setSourceAttribution(e.target.value)}
                placeholder="Source Attribution"
                className="px-3.5 py-2.5 rounded-xl border border-[#e2e0d6] text-sm"
              />
              <input
                type="text"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="License / Usage Rights"
                className="px-3.5 py-2.5 rounded-xl border border-[#e2e0d6] text-sm"
              />
            </div>

            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Video description..."
              className="px-3.5 py-2.5 rounded-xl border border-[#e2e0d6] text-sm"
            />

            {/* Thumbnail Preview & Live Validation */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleValidateSource}
                disabled={isValidating}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f5f4ee] border border-[#8c7b33] text-[#10292d] hover:bg-[#8c7b33]/10"
              >
                {isValidating ? "Validating MP4 & Thumbnail..." : "Validate Playback & Deduplication"}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0f3238] text-white hover:bg-[#10292d] disabled:opacity-50"
              >
                {isSubmitting ? "Publishing..." : "Save & Publish Video"}
              </button>
            </div>

            {validationResult && (
              <div className="p-4 rounded-2xl bg-[#f5f4ee] border border-[#e2e0d6] text-xs flex flex-col gap-1">
                <p className="font-semibold text-[#10292d]">
                  Validation Status:{" "}
                  <span className={validationResult.valid ? "text-emerald-700" : "text-rose-700"}>
                    {validationResult.valid ? "VERIFIED PLAYABLE" : "FAILED"}
                  </span>
                </p>
                {validationResult.duplicate && (
                  <p className="text-rose-700 font-medium">
                    Duplicate detected: already in catalog as &ldquo;{validationResult.duplicate.title}&rdquo; ({validationResult.duplicate.id})
                  </p>
                )}
                {validationResult.details && (
                  <p className="font-mono text-[#66726f]">
                    HTTP {validationResult.details.httpStatus || "?"} · MIME: {validationResult.details.contentType || "?"} · Range:{" "}
                    {validationResult.details.supportsRange ? "Yes" : "No"} · MP4/WebM Header:{" "}
                    {validationResult.details.hasValidMediaHeader ? "Valid" : "Invalid"} · Thumbnail:{" "}
                    {validationResult.details.thumbnailOk ? "OK" : "Failed"}
                  </p>
                )}
              </div>
            )}
          </form>
        )}

        {/* Filters & Table */}
        {isAdmin && (
          <div className="p-6 rounded-3xl bg-white border border-[#e2e0d6] shadow-sm flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {["all", "published", "draft", "duplicate_archived", "broken"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st)
                      setPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${
                      statusFilter === st
                        ? "bg-[#0f3238] text-white"
                        : "bg-[#f5f4ee] text-[#66726f] hover:text-[#10292d]"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setPage(1)
                }}
                className="px-3 py-1.5 rounded-xl border border-[#e2e0d6] text-xs bg-white"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="h-40 rounded-2xl bg-black/5 animate-pulse" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e2e0d6] font-mono uppercase text-[10px] text-[#66726f]">
                      <th className="py-2 pr-3">Video</th>
                      <th className="py-2 px-2">Category</th>
                      <th className="py-2 px-2">Source / License</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 pl-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e0d6]/60">
                    {items.map((vid) => (
                      <tr key={vid.id} className="hover:bg-[#f5f4ee]/60">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={vid.thumbnailUrl}
                              alt={vid.title}
                              className="w-16 h-10 rounded-lg object-cover bg-black/10 shrink-0"
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-[#10292d] truncate max-w-xs">{vid.title}</p>
                              <p className="font-mono text-[10px] text-[#66726f]">{vid.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">{vid.category}</td>
                        <td className="py-3 px-2 text-[#66726f]">
                          <p className="truncate max-w-[180px]">{vid.sourceAttribution || vid.sourceProvider}</p>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              vid.status === "published"
                                ? "bg-emerald-100 text-emerald-800"
                                : vid.status === "broken"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {vid.status || "published"}
                          </span>
                        </td>
                        <td className="py-3 pl-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(vid)}
                            className="px-2.5 py-1 mr-1.5 rounded-lg border border-[#e2e0d6] text-[11px] hover:border-[#8c7b33]"
                          >
                            {vid.featured ? "Unfeature" : "Feature"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(vid)}
                            className="px-2.5 py-1 rounded-lg bg-[#0f3238] text-white text-[11px] hover:bg-[#10292d]"
                          >
                            {vid.status === "published" ? "Unpublish" : "Publish"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-[#e2e0d6] text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs font-mono text-[#66726f]">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl border border-[#e2e0d6] text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

