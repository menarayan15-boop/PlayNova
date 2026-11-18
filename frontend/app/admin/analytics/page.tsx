"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/useAuthStore"
import {
  fetchAnalyticsDashboardApi,
  AnalyticsDashboardData,
} from "@/services/analyticsApi"

type DateRange = "7d" | "30d" | "90d" | "all"

function formatDurationReadable(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s"
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hrs > 0) return `${hrs}h ${mins}m`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

export default function AdminAnalyticsPage() {
  const { user, isAuthenticated, isInitialized } = useAuthStore()
  const [range, setRange] = useState<DateRange>("30d")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<AnalyticsDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isAdmin = isAuthenticated && user?.role === "admin"

  const loadDashboard = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setErrorMsg(null)
    const res = await fetchAnalyticsDashboardApi({ range, page, limit: 8 })
    if (res.ok && res.data) {
      setData(res.data)
    } else {
      setErrorMsg(res.message || "Unable to load analytics data.")
    }
    setIsLoading(false)
  }, [isAdmin, range, page])

  useEffect(() => {
    if (isInitialized) {
      loadDashboard()
    }
  }, [isInitialized, loadDashboard])

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#f5f4ee]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header */}
        <div className="p-8 rounded-3xl bg-[#0c2f35] text-[#eef2ec] border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#8c7b33]">
                Authorized Administrator Console
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-white">
              Video Analytics
            </h1>
            <p className="text-sm text-[#93aaa6] mt-1 max-w-xl">
              Real-time MongoDB aggregation metrics from verified playback events. Privacy-respecting and deduplicated.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/10 border border-white/10">
              {(["7d", "30d", "90d", "all"] as DateRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRange(r)
                    setPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                    range === r
                      ? "bg-[#8c7b33] text-white shadow-sm"
                      : "text-[#93aaa6] hover:text-white"
                  }`}
                >
                  {r === "all" ? "All Time" : r.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Access Denied for non-admins */}
        {isInitialized && !isAdmin && (
          <div className="p-10 rounded-3xl bg-white border border-[#e2e0d6] text-center max-w-lg mx-auto">
            <h2 className="text-xl font-semibold text-[#10292d] mb-2">Administrator Access Required</h2>
            <p className="text-sm text-[#66726f] mb-6">
              Video analytics dashboards are restricted to authorized PlayNova administrators.
            </p>
            <Link
              href="/"
              className="inline-flex px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0f3238] text-white hover:bg-[#10292d]"
            >
              Return Home
            </Link>
          </div>
        )}

        {/* Error state */}
        {isAdmin && errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Loading skeleton */}
        {isAdmin && isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-black/5 animate-pulse" />
            ))}
          </div>
        )}

        {/* Real Analytics Content */}
        {isAdmin && !isLoading && data && (
          <>
            {!data.hasData ? (
              <div className="p-12 rounded-3xl bg-white/80 border border-[#e2e0d6] text-center flex flex-col items-center">
                <h2 className="text-lg font-semibold text-[#10292d] mb-2">
                  No Playback Events Recorded Yet
                </h2>
                <p className="text-sm text-[#66726f] max-w-md">
                  There are no verified playback events in the selected time window. Real metrics will appear automatically as viewers watch videos on PlayNova.
                </p>
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    {
                      label: "Total Verified Views",
                      value: data.summary.totalViews.toLocaleString(),
                      sub: `${data.summary.uniqueViewers.toLocaleString()} unique viewers`,
                    },
                    {
                      label: "Total Watch Time",
                      value: formatDurationReadable(data.summary.totalWatchTimeSeconds),
                      sub: `Avg ${formatDurationReadable(data.summary.averageWatchDurationSeconds)} / view`,
                    },
                    {
                      label: "Completion Rate",
                      value: `${data.summary.completionRate}%`,
                      sub: `${data.summary.totalCompletions.toLocaleString()} completions`,
                    },
                    {
                      label: "Playback Error Rate",
                      value: `${data.summary.playbackErrorRate}%`,
                      sub: `${data.summary.playbackErrors.toLocaleString()} recorded errors`,
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="p-6 rounded-2xl bg-white border border-[#e2e0d6] shadow-sm flex flex-col gap-1"
                    >
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c7b33]">
                        {kpi.label}
                      </span>
                      <span className="text-3xl font-semibold text-[#10292d]">{kpi.value}</span>
                      <span className="text-xs text-[#66726f]">{kpi.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Daily Engagement Trend */}
                {data.dailyTrends.length > 0 && (
                  <div className="p-6 rounded-3xl bg-white border border-[#e2e0d6] shadow-sm">
                    <h2 className="text-base font-semibold text-[#10292d] mb-4">
                      Daily Engagement Trend
                    </h2>
                    <div className="flex items-end gap-2 h-40 overflow-x-auto pb-2">
                      {(() => {
                        const maxViews = Math.max(1, ...data.dailyTrends.map((d) => d.views))
                        return data.dailyTrends.map((day) => {
                          const heightPct = Math.max(8, Math.round((day.views / maxViews) * 100))
                          return (
                            <div
                              key={day.date}
                              className="flex flex-col items-center gap-1 min-w-[44px] flex-1"
                            >
                              <span className="text-[10px] font-mono text-[#66726f]">{day.views}</span>
                              <div className="w-full bg-[#f5f4ee] rounded-t-lg h-28 flex items-end overflow-hidden">
                                <div
                                  className="w-full bg-[#0f3238] hover:bg-[#8c7b33] transition-colors rounded-t-lg"
                                  style={{ height: `${heightPct}%` }}
                                  title={`${day.date}: ${day.views} views, ${day.completions} completions`}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-[#66726f]">
                                {day.date.slice(5)}
                              </span>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>
                )}

                {/* Most Watched Videos Table */}
                <div className="p-6 rounded-3xl bg-white border border-[#e2e0d6] shadow-sm overflow-x-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-[#10292d]">Most Watched Videos</h2>
                    <span className="text-xs font-mono text-[#66726f]">
                      Page {data.pagination.page} of {data.pagination.totalPages}
                    </span>
                  </div>

                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#e2e0d6] text-[11px] font-mono uppercase text-[#66726f]">
                        <th className="py-2.5 pr-4">Video</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Views</th>
                        <th className="py-2.5 px-3 text-right">Unique</th>
                        <th className="py-2.5 px-3 text-right">Watch Time</th>
                        <th className="py-2.5 px-3 text-right">Completion</th>
                        <th className="py-2.5 pl-3 text-right">Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e0d6]/60">
                      {data.mostWatchedVideos.map((row) => (
                        <tr key={row.videoId} className="hover:bg-[#f5f4ee]/60">
                          <td className="py-3 pr-4 font-medium text-[#10292d]">{row.title}</td>
                          <td className="py-3 px-3 text-[#66726f]">{row.category}</td>
                          <td className="py-3 px-3 text-right font-mono">{row.views}</td>
                          <td className="py-3 px-3 text-right font-mono">{row.uniqueViewers}</td>
                          <td className="py-3 px-3 text-right font-mono">
                            {formatDurationReadable(row.watchSeconds)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">{row.completionRate}%</td>
                          <td className="py-3 pl-3 text-right font-mono">{row.errors}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {data.pagination.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-[#e2e0d6] text-xs disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={page >= data.pagination.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-3 py-1.5 rounded-xl border border-[#e2e0d6] text-xs disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

