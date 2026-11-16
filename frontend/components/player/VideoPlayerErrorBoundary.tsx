"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class VideoPlayerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PlayNova Video Player Boundary caught an error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full aspect-video rounded-2xl bg-[#0a181b] border border-white/10 flex flex-col items-center justify-center p-6 text-center select-none shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-[#f5f4ee] font-semibold text-lg mb-1">
            {this.props.fallbackTitle || "Video Player Temporarily Unavailable"}
          </h3>
          <p className="text-[#93aaa6] text-sm max-w-md mb-5 leading-relaxed">
            {this.state.error?.message ||
              "An unexpected client-side error occurred during video rendering. Our engineering systems have captured this event."}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-full bg-[#8c7b33] hover:bg-[#a8963f] text-[#f5f4ee] text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
            >
              Reload Player
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.reload()
                }
              }}
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#f5f4ee] text-xs font-semibold tracking-wide transition-all active:scale-95 border border-white/10"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default VideoPlayerErrorBoundary

