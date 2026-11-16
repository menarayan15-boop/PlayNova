"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/useAuthStore"
import PlayNovaLogo from "@/components/ui/PlayNovaLogo"

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuthStore()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Compute password strength metrics
  const passwordChecks = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    }
  }, [password])

  const strengthScore = useMemo(() => {
    return Object.values(passwordChecks).filter(Boolean).length
  }, [passwordChecks])

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return { text: "None", color: "bg-gray-200" }
    if (strengthScore <= 2) return { text: "Weak", color: "bg-red-500" }
    if (strengthScore === 3) return { text: "Fair", color: "bg-amber-500" }
    if (strengthScore === 4) return { text: "Good", color: "bg-emerald-500" }
    return { text: "Strong", color: "bg-[#2f7d57]" }
  }, [password.length, strengthScore])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = "Please enter your full name (at least 2 characters)"
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      errs.email = "Please provide a valid email address"
    }

    if (password.length < 8) {
      errs.password = "Password must be at least 8 characters long"
    } else if (!passwordChecks.upper || !passwordChecks.lower || !passwordChecks.number) {
      errs.password = "Password must contain uppercase, lowercase, and numbers"
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match"
    }

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!validate()) return

    try {
      await register(fullName.trim(), email.trim(), password)
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
          Create your account
        </h1>
        <p className="text-sm text-[#66726f] mt-2">
          Experience ultra-definition streaming tailored to your rhythm.
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
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-[#10292d] mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: "" })
                }}
                placeholder="Astrid Lindgren"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#10292d] bg-[#fbfbfa] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8c7b33] transition-all ${
                  fieldErrors.fullName ? "border-red-400" : "border-[#e2e0d6]"
                }`}
              />
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.fullName}</p>
              )}
            </div>

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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" })
                  }}
                  placeholder="At least 8 characters"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#10292d] bg-[#fbfbfa] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8c7b33] transition-all pr-10 ${
                    fieldErrors.password ? "border-red-400" : "border-[#e2e0d6]"
                  }`}
                />
              </div>

              {/* Password strength meter */}
              {password.length > 0 && (
                <div className="mt-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#66726f]">Password strength:</span>
                    <span className="font-semibold text-[#10292d]">{strengthLabel.text}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          step <= strengthScore ? strengthLabel.color : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-[#66726f] pt-1">
                    <span className={passwordChecks.length ? "text-emerald-700 font-medium" : ""}>
                      • 8+ characters
                    </span>
                    <span className={passwordChecks.upper ? "text-emerald-700 font-medium" : ""}>
                      • Uppercase letter
                    </span>
                    <span className={passwordChecks.lower ? "text-emerald-700 font-medium" : ""}>
                      • Lowercase letter
                    </span>
                    <span className={passwordChecks.number ? "text-emerald-700 font-medium" : ""}>
                      • Number (0-9)
                    </span>
                  </div>
                </div>
              )}

              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-[#10292d] mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: "" })
                }}
                placeholder="Re-type your password"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#10292d] bg-[#fbfbfa] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8c7b33] transition-all ${
                  fieldErrors.confirmPassword ? "border-red-400" : "border-[#e2e0d6]"
                }`}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.confirmPassword}</p>
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
                  Creating Account...
                </>
              ) : (
                "Create PlayNova Account"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#e2e0d6] text-center">
            <p className="text-xs text-[#66726f]">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-[#8c7b33] hover:text-[#0f3238] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
