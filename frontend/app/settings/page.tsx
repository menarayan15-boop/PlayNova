"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useAuthStore } from "@/stores/useAuthStore"
import { usePlayerStore } from "@/stores/usePlayerStore"
import { useProgressStore } from "@/stores/useProgressStore"
import { PlaybackSpeed } from "@/types"

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 1, 1.25, 1.5, 2]

export default function SettingsPage() {
  const { user, isAuthenticated, isInitialized, updatePreferences } = useAuthStore()
  const { setPlaybackSpeed, setVolume, setActiveSubtitleTrack } = usePlayerStore()
  const { clearAllHistory } = useProgressStore()

  const [preferredSpeed, setPrefSpeed] = useState<PlaybackSpeed>(1)
  const [preferredSubtitle, setPrefSubtitle] = useState<string | null>("en")
  const [autoplay, setAutoplay] = useState(false)
  const [preferredTheme, setPrefTheme] = useState("cream")
  const [defaultVolume, setDefaultVol] = useState(0.8)

  // Phase 4 Playback & Privacy Preferences
  const [historyTrackingEnabled, setHistoryTrackingEnabled] = useState(true)
  const [resumePreference, setResumePreference] = useState<"ask" | "auto" | "start_over">("ask")
  const [completionThreshold, setCompletionThreshold] = useState<number>(90)

  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearStatus, setClearStatus] = useState<string | null>(null)

  // Load preferences from user or localStorage
  useEffect(() => {
    if (isAuthenticated && user?.preferences) {
      setPrefSpeed((user.preferences.preferredSpeed as PlaybackSpeed) || 1)
      setPrefSubtitle(user.preferences.preferredSubtitle ?? "en")
      setAutoplay(Boolean(user.preferences.autoplay))
      setPrefTheme(user.preferences.preferredTheme || "cream")
      setDefaultVol(typeof user.preferences.defaultVolume === "number" ? user.preferences.defaultVolume : 0.8)
      setHistoryTrackingEnabled(user.preferences.historyTrackingEnabled !== false)
      setResumePreference(user.preferences.resumePreference || "ask")
      setCompletionThreshold(user.preferences.completionThreshold || 90)
    } else if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("playnova_guest_preferences")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.preferredSpeed) setPrefSpeed(parsed.preferredSpeed)
          if (typeof parsed.preferredSubtitle !== "undefined") setPrefSubtitle(parsed.preferredSubtitle)
          if (typeof parsed.autoplay === "boolean") setAutoplay(parsed.autoplay)
          if (parsed.preferredTheme) setPrefTheme(parsed.preferredTheme)
          if (typeof parsed.defaultVolume === "number") setDefaultVol(parsed.defaultVolume)
          if (typeof parsed.historyTrackingEnabled === "boolean") setHistoryTrackingEnabled(parsed.historyTrackingEnabled)
          if (parsed.resumePreference) setResumePreference(parsed.resumePreference)
          if (parsed.completionThreshold) setCompletionThreshold(parsed.completionThreshold)
        }
      } catch {
        // Fallback to defaults
      }
    }
  }, [isAuthenticated, user])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus(null)

    const newPrefs = {
      preferredSpeed,
      preferredSubtitle,
      autoplay,
      preferredTheme,
      defaultVolume,
      historyTrackingEnabled,
      resumePreference,
      completionThreshold,
    }

    try {
      if (isAuthenticated) {
        await updatePreferences(newPrefs)
      } else if (typeof window !== "undefined") {
        localStorage.setItem("playnova_guest_preferences", JSON.stringify(newPrefs))
      }

      // Synchronize with active video player engine
      setPlaybackSpeed(preferredSpeed)
      setVolume(defaultVolume)
      setActiveSubtitleTrack(preferredSubtitle)

      setSaveStatus("Settings saved successfully!")
      setTimeout(() => setSaveStatus(null), 3500)
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : "Failed to save preferences")
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmClearHistory = async () => {
    try {
      await clearAllHistory()
      setShowClearModal(false)
      setClearStatus("Watch history cleared successfully!")
      setTimeout(() => setClearStatus(null), 3500)
    } catch {
      setClearStatus("Failed to clear history")
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#f5f4ee]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#66726f] mb-6">
          <Link href="/" className="hover:text-[#10292d]">
            Home
          </Link>
          <span>/</span>
          {isAuthenticated ? (
            <Link href="/profile" className="hover:text-[#10292d]">
              Profile
            </Link>
          ) : (
            <span>Guest</span>
          )}
          <span>/</span>
          <span className="text-[#8c7b33] font-semibold">Playback & History Preferences</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#10292d]">
              Playback & History Settings
            </h1>
            <p className="text-sm text-[#66726f] mt-1">
              {isAuthenticated
                ? "Your streaming preferences and watch progress settings are synchronized across devices."
                : "Settings are stored locally in your browser. Sign in to sync across devices."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0f3238] hover:bg-[#10292d] text-white shadow-md transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        {saveStatus && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium mb-6 animate-in fade-in ${
              saveStatus.includes("success")
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {saveStatus}
          </div>
        )}

        {clearStatus && (
          <div className="p-4 rounded-2xl text-xs font-medium mb-6 bg-emerald-50 text-emerald-800 border border-emerald-200 animate-in fade-in">
            {clearStatus}
          </div>
        )}

        <div className="space-y-6">
          {/* Phase 4: Watch History Privacy Toggle */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#e2e0d6]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${historyTrackingEnabled ? "bg-emerald-500" : "bg-gray-400"}`} />
                  <h3 className="text-base font-semibold text-[#10292d]">Watch History Tracking</h3>
                </div>
                <p className="text-xs text-[#66726f] mt-1">
                  When enabled, PlayNova records your playback positions, calculates completion, and enables resume playback.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHistoryTrackingEnabled(!historyTrackingEnabled)}
                role="switch"
                aria-checked={historyTrackingEnabled}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#8c7b33] ${
                  historyTrackingEnabled ? "bg-[#0f3238]" : "bg-gray-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    historyTrackingEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Phase 4: Resume Playback Behavior */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#e2e0d6]">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-[#10292d]">Resume Playback Behavior</h3>
              <p className="text-xs text-[#66726f] mt-0.5">
                How should the player handle videos you previously started watching?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  value: "ask",
                  title: "Ask Each Time",
                  desc: "Show a prompt asking to resume or start over",
                },
                {
                  value: "auto",
                  title: "Always Resume",
                  desc: "Automatically jump to your last position",
                },
                {
                  value: "start_over",
                  title: "Start from Beginning",
                  desc: "Always begin playback from 0:00",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setResumePreference(opt.value as any)}
                  className={`p-3.5 rounded-2xl text-left border transition-all ${
                    resumePreference === opt.value
                      ? "border-[#0f3238] bg-[#0f3238]/5 shadow-sm"
                      : "border-[#e2e0d6] hover:border-[#10292d]/30 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#10292d]">{opt.title}</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        resumePreference === opt.value
                          ? "border-[#0f3238] bg-[#0f3238]"
                          : "border-gray-300"
                      }`}
                    >
                      {resumePreference === opt.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#66726f] leading-snug">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Phase 4: Video Completion Threshold */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#e2e0d6]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#10292d]">Completion Threshold</h3>
                <p className="text-xs text-[#66726f] mt-0.5">
                  Percentage of unique playback coverage required to mark a video as completed.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#f5f4ee] border border-[#e2e0d6]">
                {[80, 85, 90, 95].map((threshold) => (
                  <button
                    key={threshold}
                    type="button"
                    onClick={() => setCompletionThreshold(threshold)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                      completionThreshold === threshold
                        ? "bg-[#0f3238] text-white shadow-sm"
                        : "text-[#66726f] hover:text-[#10292d]"
                    }`}
                  >
                    {threshold}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 1: Default Playback Speed */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#e2e0d6]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#10292d]">Default Playback Speed</h3>
                <p className="text-xs text-[#66726f] mt-0.5">
                  Choose the starting speed for all video streams.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#f5f4ee] border border-[#e2e0d6]">
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setPrefSpeed(speed)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                      preferredSpeed === speed
                        ? "bg-[#0f3238] text-white shadow-sm"
                        : "text-[#66726f] hover:text-[#10292d]"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Subtitles & Captions */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#e2e0d6]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#10292d]">Default Subtitle Language</h3>
                <p className="text-xs text-[#66726f] mt-0.5">
                  Select your preferred WebVTT closed-caption language.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { label: "English", value: "en" },
                  { label: "Español", value: "es" },
                  { label: "Off", value: null },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setPrefSubtitle(item.value)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      preferredSubtitle === item.value
                        ? "bg-[#0f3238] text-white border-[#0f3238] shadow-sm"
                        : "bg-white text-[#66726f] border-[#e2e0d6] hover:text-[#10292d]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Default Volume */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#e2e0d6]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#10292d]">Default Audio Volume</h3>
                <p className="text-xs text-[#66726f] mt-0.5">
                  Initial sound volume level when opening a video.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-56">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={defaultVolume}
                  onChange={(e) => setDefaultVol(parseFloat(e.target.value))}
                  className="w-full accent-[#8c7b33] cursor-pointer"
                />
                <span className="text-xs font-mono font-semibold text-[#10292d] w-10 text-right">
                  {Math.round(defaultVolume * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Autoplay Next Video */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#e2e0d6]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#10292d]">Autoplay Stream</h3>
                <p className="text-xs text-[#66726f] mt-0.5">
                  Automatically start playback when opening a video player.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAutoplay(!autoplay)}
                role="switch"
                aria-checked={autoplay}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#8c7b33] ${
                  autoplay ? "bg-[#0f3238]" : "bg-gray-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autoplay ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card 5: Clear Watch History Danger Zone */}
          {isAuthenticated && (
            <div className="bg-rose-50/50 rounded-3xl p-6 sm:p-7 border border-rose-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-rose-900">Clear Watch History</h3>
                  <p className="text-xs text-rose-700/80 mt-0.5">
                    Permanently delete all continue watching progress and completed video records.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/history"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-[#10292d] border border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    Manage History
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-sm active:scale-95"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear History Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0c2f35] text-[#f5f4ee] border border-white/10 shadow-2xl">
            <h3 className="text-lg font-serif font-bold mb-2">Clear all watch history?</h3>
            <p className="text-xs sm:text-sm text-[#93aaa6] mb-6 leading-relaxed">
              This will erase all playback progress across devices. Videos will no longer appear in Continue Watching.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/10 text-white hover:bg-white/15 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearHistory}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
