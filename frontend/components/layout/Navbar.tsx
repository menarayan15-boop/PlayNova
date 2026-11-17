"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import PlayNovaLogo from "../ui/PlayNovaLogo"
import { useAuthStore } from "@/stores/useAuthStore"

interface NavbarProps {
  onGetStartedClick?: () => void
}

export default function Navbar({ onGetStartedClick }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  const { user, isAuthenticated, logout } = useAuthStore()

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsScrolled(scrollY > 20)

      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        setScrollProgress(Math.min(1, Math.max(0, scrollY / docHeight)))
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Navigation Links depending on authentication status
  const navLinks = isAuthenticated
    ? [
        { label: "Home", href: "/" },
        { label: "Explore", href: "/explore" },
        { label: "Watchlist", href: "/watchlist" },
        { label: "History", href: "/history" },
        { label: "Profile", href: "/profile" },
      ]
    : [
        { label: "Home", href: "/" },
        { label: "Explore", href: "/explore" },
        { label: "Watchlist", href: "/watchlist" },
        { label: "Showcase", href: "/#showcase" },
      ]

  const handleNavClick = (href: string) => (e: React.MouseEvent) => {
    setMobileMenuOpen(false)
    if (href.startsWith("/#") && pathname === "/") {
      e.preventDefault()
      const targetId = href.replace("/#", "")
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  const handleLogout = async () => {
    setMobileMenuOpen(false)
    await logout()
    router.push("/")
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#f5f4ee]/85 backdrop-blur-md shadow-[0_1px_0_#e2e0d6]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="focus:outline-none" aria-label="PlayNova Home">
          <PlayNovaLogo size={28} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#10292d]/5 p-1 rounded-full border border-[#e2e0d6]/60 backdrop-blur-sm">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={handleNavClick(link.href)}
                className={`px-3.5 py-1.5 rounded-full text-[13.5px] font-medium transition-all ${
                  isActive
                    ? "bg-[#ffffff] text-[#10292d] shadow-sm"
                    : "text-[#66726f] hover:text-[#10292d] hover:bg-black/5"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Action Buttons / User Menu */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#e2e0d6] hover:border-[#8c7b33]/40 shadow-sm transition-all text-xs font-medium text-[#10292d]"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-[#0f3238] text-[#f5f4ee] flex items-center justify-center text-[10px]">
                    {user.fullName.charAt(0)}
                  </span>
                )}
                <span className="max-w-[120px] truncate">{user.fullName.split(" ")[0]}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[13px] font-medium text-[#66726f] hover:text-red-700 px-2.5 py-1.5 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[13.5px] font-medium text-[#66726f] hover:text-[#10292d] px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={onGetStartedClick}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full text-[13px] font-semibold bg-[#0f3238] text-[#ffffff] hover:bg-[#10292d] hover:shadow-[0_10px_20px_-10px_#0f3238] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className="md:hidden p-2 rounded-lg text-[#10292d] hover:bg-black/5 focus:outline-none"
        >
          {mobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-[#ffffff] border-b border-[#e2e0d6] shadow-xl animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={handleNavClick(link.href)}
                className="px-4 py-3 rounded-lg text-sm font-medium text-[#10292d] hover:bg-[#f5f4ee] flex items-center justify-between"
              >
                {link.label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8c7b33" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-[#e2e0d6] flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <div className="px-4 py-2 text-xs font-mono text-[#66726f]">
                    Signed in as <span className="font-semibold text-[#10292d]">{user.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 text-center text-sm font-medium text-red-700 border border-red-200 rounded-full hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 text-center text-sm font-medium text-[#10292d] border border-[#e2e0d6] rounded-full"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 text-center text-sm font-semibold bg-[#0f3238] text-[#ffffff] rounded-full shadow-md"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gold scroll progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8c7b33] origin-left pointer-events-none"
        style={{ transform: `scaleX(${scrollProgress})` }}
        aria-hidden="true"
      />
    </header>
  )
}
