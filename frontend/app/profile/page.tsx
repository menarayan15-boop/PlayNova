"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/stores/useAuthStore"

const AVATAR_PRESETS = [
  "https://api.dicebear.com/7.x/initials/svg?seed=Astrid&backgroundColor=0f3238&textColor=f5f4ee",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cosmo&backgroundColor=10292d",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Nova1&backgroundColor=f5f4ee",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena&backgroundColor=cdc8f6",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Horizon&backgroundColor=8c7b33",
]

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, isInitialized, updateProfile, changePassword, logout } = useAuthStore()

  // Profile edit state
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/login")
    }
  }, [isInitialized, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setFullName(user.fullName)
      setAvatarUrl(user.avatarUrl || "")
    }
  }, [user])

  if (!isInitialized || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-[#f5f4ee]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#8c7b33] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-[#66726f]">Verifying session...</p>
        </div>
      </div>
    )
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)
    setIsUpdatingProfile(true)

    try {
      await updateProfile({ fullName, avatarUrl })
      setProfileMsg({ type: "success", text: "Profile updated successfully!" })
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update profile",
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" })
      return
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters" })
      return
    }

    setIsChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordMsg({
        type: "success",
        text: "Password updated successfully. Other device sessions have been revoked.",
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to change password",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently"

  return (
    <div className="min-h-screen pt-28 pb-20 bg-[#f5f4ee]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <div className="bg-[#0f3238] rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={user.fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/20 shadow-lg bg-black/20"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#8c7b33] flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {user.fullName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  {user.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-[#8c7b33]/30 text-[#cdc8f6] border border-[#8c7b33]/40">
                  {user.role === "admin" ? "Administrator" : "Member"}
                </span>
              </div>
              <p className="text-sm text-[#93aaa6]">{user.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs font-mono text-[#93aaa6]">
                <span>Member since {memberSince}</span>
                <span>•</span>
                <span className="text-[#cdc8f6]">HTML5 Engine Active</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Link
                href="/settings"
                className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/10 text-white text-center transition-all"
              >
                Playback Settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-200 text-center transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Edit Profile Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#e2e0d6] flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#10292d] mb-1">Personal Details</h2>
              <p className="text-xs text-[#66726f] mb-6">
                Update your display name and choose your preferred avatar.
              </p>

              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-xs mb-4 ${
                    profileMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#10292d] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#e2e0d6] text-sm text-[#10292d] focus:outline-none focus:ring-2 focus:ring-[#8c7b33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#10292d] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#e2e0d6] text-sm text-[#66726f] bg-gray-50 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-[#66726f] mt-1 block">
                    Account email address is permanently verified.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#10292d] mb-2">
                    Avatar Preset
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {AVATAR_PRESETS.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setAvatarUrl(preset)}
                        className={`flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                          avatarUrl === preset ? "border-[#8c7b33] scale-105" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preset} alt={`Avatar preset ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-2.5 px-4 rounded-full text-xs font-semibold bg-[#0f3238] text-white hover:bg-[#10292d] transition-all shadow-sm disabled:opacity-60 mt-4"
                >
                  {isUpdatingProfile ? "Saving Details..." : "Save Profile Details"}
                </button>
              </form>
            </div>
          </div>

          {/* Card 2: Security & Password */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#e2e0d6] flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#10292d] mb-1">Security & Password</h2>
              <p className="text-xs text-[#66726f] mb-6">
                Change your password to keep your PlayNova stream secure.
              </p>

              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl text-xs mb-4 ${
                    passwordMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#10292d] mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#e2e0d6] text-sm text-[#10292d] focus:outline-none focus:ring-2 focus:ring-[#8c7b33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#10292d] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#e2e0d6] text-sm text-[#10292d] focus:outline-none focus:ring-2 focus:ring-[#8c7b33]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#10292d] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#e2e0d6] text-sm text-[#10292d] focus:outline-none focus:ring-2 focus:ring-[#8c7b33]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full py-2.5 px-4 rounded-full text-xs font-semibold bg-[#8c7b33] hover:bg-[#a8963f] text-white transition-all shadow-sm disabled:opacity-60 mt-4"
                >
                  {isChangingPassword ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
