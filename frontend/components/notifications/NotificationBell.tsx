"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useNotificationStore } from "@/stores/useNotificationStore"
import { useAuthStore } from "@/stores/useAuthStore"

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated } = useAuthStore()
  const { items, unreadCount, fetchNotifications, markAsRead, markAllAsRead, dismiss } =
    useNotificationStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
      // Poll notifications every 45s
      const interval = setInterval(fetchNotifications, 45000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, fetchNotifications])

  // Handle click outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        className="relative p-2 rounded-full text-[#66726f] hover:text-[#10292d] hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#8c7b33]/40"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold text-white bg-[#8c7b33] rounded-full shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notification center"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#e2e0d6] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#f5f4ee]/70 border-b border-[#e2e0d6] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#10292d]">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#8c7b33]/15 text-[#8c7b33]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-xs text-[#8c7b33] hover:text-[#0f3238] font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#e2e0d6]/60">
            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#66726f] flex flex-col items-center justify-center gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8c7b33"
                  strokeWidth="1.5"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>You're all caught up! No notifications.</span>
              </div>
            ) : (
              items.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3.5 flex items-start gap-3 transition-colors ${
                    notification.read ? "bg-white hover:bg-[#f5f4ee]/40" : "bg-[#fbfaf6] hover:bg-[#f5f4ee]"
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id)
                    }
                  }}
                >
                  {/* Indicator Dot */}
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      notification.read ? "bg-transparent" : "bg-[#8c7b33]"
                    }`}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#10292d] truncate">
                      {notification.title}
                    </p>
                    <p className="text-[12px] text-[#66726f] line-clamp-2 mt-0.5 leading-relaxed">
                      {notification.message}
                    </p>
                    {notification.link && (
                      <Link
                        href={notification.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-block mt-1 text-[11px] font-medium text-[#8c7b33] hover:underline"
                      >
                        View details &rarr;
                      </Link>
                    )}
                  </div>

                  {/* Dismiss Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      dismiss(notification.id)
                    }}
                    title="Dismiss"
                    className="text-[#99a2a0] hover:text-[#10292d] p-1 rounded-md transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

