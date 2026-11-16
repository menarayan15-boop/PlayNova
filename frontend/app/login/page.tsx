"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/useAuthStore"
import PlayNovaLogo from "@/components/ui/PlayNovaLogo"

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!email.trim()) {
      errs.email = "Please enter your email address"
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address"
    }

    if (!password) {
      errs.password = "Please enter your password"
    }

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!validate()) return

    try {
      await login(email.trim(), password)
      router.push("/profile")
    } catch {
      // Error handled by store
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#f5f4ee] flex flex-col justify-center px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link href="/" className="inline-block focus:outline-none mb-4">
          <PlayNovaLogo size={34} />
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-[#10292d]">
          Welcome back
        </h1>
        <p className="text-sm text-[#66726f] mt-2">
          Sign in to access your customized streaming settings and profile.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-[#e2e0d6]">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#10292d] mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" })
                }}
                placeholder="astrid@playnova.tv"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#10292d] bg-[#fbfbfa] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8c7b33] transition-all ${
                  fieldErrors.email ? "border-red-400" : "border-[#e2e0d6]"
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#10292d]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-medium text-[#8c7b33] hover:text-[#0f3238] transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" })
                  }}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#10292d] bg-[#fbfbfa] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8c7b33] transition-all pr-10 ${
                    fieldErrors.password ? "border-red-400" : "border-[#e2e0d6]"
                  }`}
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-full text-sm font-semibold bg-[#0f3238] text-white hover:bg-[#10292d] focus:outline-none focus:ring-2 focus:ring-[#8c7b33] focus:ring-offset-2 transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2 mt-6 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#e2e0d6] text-center">
            <p className="text-xs text-[#66726f]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-[#8c7b33] hover:text-[#0f3238] transition-colors">
                Get started
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

