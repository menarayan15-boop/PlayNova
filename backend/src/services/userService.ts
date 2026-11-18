import { User, IUser, SafeUserDTO, IUserPreferences, IRefreshToken } from "../models/User.js"
import { WatchProgress } from "../models/WatchProgress.js"
import { Watchlist } from "../models/Watchlist.js"
import { Notification } from "../models/Notification.js"
import { isDatabaseConnected, connectDB } from "../config/db.js"
import { config } from "../config/env.js"
import { hashPassword, comparePassword, validatePasswordStrength } from "../utils/password.js"
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from "../utils/token.js"

// In-Memory fallback store for when MONGODB_URI is not yet configured
interface InMemoryUser {
  id: string
  fullName: string
  email: string
  passwordHash: string
  role: "user" | "admin"
  avatarUrl?: string
  lastLoginAt?: Date
  preferences: IUserPreferences
  refreshTokens: IRefreshToken[]
  createdAt: Date
  updatedAt: Date
}

const memoryUsers: Map<string, InMemoryUser> = new Map()

function toSafeMemoryUser(u: InMemoryUser): SafeUserDTO {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl,
    lastLoginAt: u.lastLoginAt,
    preferences: u.preferences,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }
}

export class UserService {
  /**
   * Register a new user
   */
  static async register(
    fullName: string,
    email: string,
    passwordPlain: string
  ): Promise<{ user: SafeUserDTO; accessToken: string; refreshToken: string }> {
    const cleanEmail = email.trim().toLowerCase()
    const cleanName = fullName.trim()

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(cleanEmail)) {
      throw new Error("Please provide a valid email address")
    }

    // Validate password strength
    const strength = validatePasswordStrength(passwordPlain)
    if (!strength.valid) {
      throw new Error(strength.errors[0])
    }

    const passwordHash = await hashPassword(passwordPlain)
    const rawRefreshToken = generateRefreshTokenString()
    const hashedRefresh = hashRefreshToken(rawRefreshToken)
    const refreshExpiry = getRefreshTokenExpiry()

    const initialPreferences: IUserPreferences = {
      preferredSpeed: 1,
      preferredSubtitle: "en",
      autoplay: false,
      preferredTheme: "cream",
      defaultVolume: 0.8,
      historyTrackingEnabled: true,
      resumePreference: "ask",
      completionThreshold: 90,
    }

    if (config.mongodbUri) {
      if (!isDatabaseConnected()) {
        const reconnected = await connectDB()
        if (!reconnected) {
          throw new Error("Database connection unavailable. Registration could not be saved to MongoDB.")
        }
      }

      // Check existing in MongoDB
      const existing = await User.findOne({ email: cleanEmail })
      if (existing) {
        throw new Error("An account with this email address already exists")
      }

      const newUser = new User({
        fullName: cleanName,
        email: cleanEmail,
        passwordHash,
        role: "user",
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=0f3238&textColor=f5f4ee`,
        preferences: initialPreferences,
        refreshTokens: [
          {
            tokenHash: hashedRefresh,
            expiresAt: refreshExpiry,
            createdAt: new Date(),
          },
        ],
      })

      // Await database write to confirm persistence
      const savedUser = await newUser.save()
      if (!savedUser || !savedUser._id) {
        throw new Error("MongoDB write failed. User was not saved.")
      }

      const safe = savedUser.toSafeUser()
      const accessToken = generateAccessToken({
        userId: safe.id,
        email: safe.email,
        role: safe.role,
      })

      return { user: safe, accessToken, refreshToken: rawRefreshToken }
    } else {
      throw new Error("MONGODB_URI is not configured. Registration requires a live database.")
    }
  }

  /**
   * Log in user with email & password
   */
  static async login(
    email: string,
    passwordPlain: string
  ): Promise<{ user: SafeUserDTO; accessToken: string; refreshToken: string }> {
    const cleanEmail = email.trim().toLowerCase()

    const rawRefreshToken = generateRefreshTokenString()
    const hashedRefresh = hashRefreshToken(rawRefreshToken)
    const refreshExpiry = getRefreshTokenExpiry()

    if (config.mongodbUri) {
      if (!isDatabaseConnected()) {
        const reconnected = await connectDB()
        if (!reconnected) {
          throw new Error("Database connection unavailable. Please try again.")
        }
      }

      const user = await User.findOne({ email: cleanEmail }).select("+passwordHash +refreshTokens")
      if (!user) {
        throw new Error("Invalid email or password")
      }

      const match = await comparePassword(passwordPlain, user.passwordHash)
      if (!match) {
        throw new Error("Invalid email or password")
      }

      user.lastLoginAt = new Date()
      // Prune expired tokens and append new
      const now = new Date()
      user.refreshTokens = user.refreshTokens.filter((rt) => rt.expiresAt > now)
      user.refreshTokens.push({
        tokenHash: hashedRefresh,
        expiresAt: refreshExpiry,
        createdAt: now,
      })

      await user.save()
      const safe = user.toSafeUser()
      const accessToken = generateAccessToken({
        userId: safe.id,
        email: safe.email,
        role: safe.role,
      })

      return { user: safe, accessToken, refreshToken: rawRefreshToken }
    } else {
      throw new Error("MONGODB_URI is not configured. Login requires a live database.")
    }
  }

  /**
   * Refresh session using refresh token string
   */
  static async refresh(
    rawRefreshToken: string
  ): Promise<{ user: SafeUserDTO; accessToken: string; refreshToken: string }> {
    if (!rawRefreshToken) {
      throw new Error("Refresh token required")
    }

    const hashed = hashRefreshToken(rawRefreshToken)
    const newRawRefresh = generateRefreshTokenString()
    const newHashedRefresh = hashRefreshToken(newRawRefresh)
    const newExpiry = getRefreshTokenExpiry()
    const now = new Date()

    if (config.mongodbUri) {
      if (!isDatabaseConnected()) {
        await connectDB()
      }
      const user = await User.findOne({
        "refreshTokens.tokenHash": hashed,
      }).select("+refreshTokens")

      if (!user) {
        throw new Error("Invalid or revoked refresh token")
      }

      // Check if the specific token has expired
      const tokenRecord = user.refreshTokens.find((rt) => rt.tokenHash === hashed)
      if (!tokenRecord || tokenRecord.expiresAt < now) {
        user.refreshTokens = user.refreshTokens.filter((rt) => rt.tokenHash !== hashed)
        await user.save()
        throw new Error("Refresh token expired")
      }

      // Token rotation: remove used token and push new
      user.refreshTokens = user.refreshTokens.filter((rt) => rt.tokenHash !== hashed && rt.expiresAt > now)
      user.refreshTokens.push({
        tokenHash: newHashedRefresh,
        expiresAt: newExpiry,
        createdAt: now,
      })

      await user.save()
      const safe = user.toSafeUser()
      const accessToken = generateAccessToken({
        userId: safe.id,
        email: safe.email,
        role: safe.role,
      })

      return { user: safe, accessToken, refreshToken: newRawRefresh }
    } else {
      let foundUser: InMemoryUser | null = null
      for (const u of memoryUsers.values()) {
        const hasToken = u.refreshTokens.some((rt) => rt.tokenHash === hashed)
        if (hasToken) {
          foundUser = u
          break
        }
      }

      if (!foundUser) {
        throw new Error("Invalid or revoked refresh token")
      }

      const tokenRecord = foundUser.refreshTokens.find((rt) => rt.tokenHash === hashed)
      if (!tokenRecord || tokenRecord.expiresAt < now) {
        foundUser.refreshTokens = foundUser.refreshTokens.filter((rt) => rt.tokenHash !== hashed)
        throw new Error("Refresh token expired")
      }

      foundUser.refreshTokens = foundUser.refreshTokens.filter(
        (rt) => rt.tokenHash !== hashed && rt.expiresAt > now
      )
      foundUser.refreshTokens.push({
        tokenHash: newHashedRefresh,
        expiresAt: newExpiry,
        createdAt: now,
      })
      foundUser.updatedAt = now

      const safe = toSafeMemoryUser(foundUser)
      const accessToken = generateAccessToken({
        userId: safe.id,
        email: safe.email,
        role: safe.role,
      })

      return { user: safe, accessToken, refreshToken: newRawRefresh }
    }
  }

  /**
   * Log out: revoke specific refresh token
   */
  static async logout(userId: string, rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return
    const hashed = hashRefreshToken(rawRefreshToken)

    if (config.mongodbUri) {
      if (!isDatabaseConnected()) {
        await connectDB()
      }
      await User.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: { tokenHash: hashed } },
      })
    } else {
      const u = memoryUsers.get(userId)
      if (u) {
        u.refreshTokens = u.refreshTokens.filter((rt) => rt.tokenHash !== hashed)
      }
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserById(userId: string): Promise<SafeUserDTO | null> {
    if (config.mongodbUri) {
      if (!isDatabaseConnected()) {
        await connectDB()
      }
      const user = await User.findById(userId)
      return user ? user.toSafeUser() : null
    } else {
      const u = memoryUsers.get(userId)
      return u ? toSafeMemoryUser(u) : null
    }
  }

  /**
   * Update profile details (Name, Avatar) - Role escalation strictly prohibited!
   */
  static async updateProfile(
    userId: string,
    updates: { fullName?: string; avatarUrl?: string }
  ): Promise<SafeUserDTO> {
    if (config.mongodbUri) {
      if (!isDatabaseConnected()) {
        await connectDB()
      }
      const user = await User.findById(userId)
      if (!user) throw new Error("User not found")

      if (updates.fullName && updates.fullName.trim().length >= 2) {
        user.fullName = updates.fullName.trim()
      }
      if (typeof updates.avatarUrl === "string") {
        user.avatarUrl = updates.avatarUrl.trim()
      }

      await user.save()
      return user.toSafeUser()
    } else {
      const u = memoryUsers.get(userId)
      if (!u) throw new Error("User not found")

      if (updates.fullName && updates.fullName.trim().length >= 2) {
        u.fullName = updates.fullName.trim()
      }
      if (typeof updates.avatarUrl === "string") {
        u.avatarUrl = updates.avatarUrl.trim()
      }
      u.updatedAt = new Date()

      return toSafeMemoryUser(u)
    }
  }

  /**
   * Change password after verifying current password
   */
  static async changePassword(
    userId: string,
    currentPasswordPlain: string,
    newPasswordPlain: string
  ): Promise<void> {
    const strength = validatePasswordStrength(newPasswordPlain)
    if (!strength.valid) {
      throw new Error(strength.errors[0])
    }

    if (config.mongodbUri) {
      if (!isDatabaseConnected()) {
        await connectDB()
      }
      const user = await User.findById(userId).select("+passwordHash +refreshTokens")
      if (!user) throw new Error("User not found")

      const matches = await comparePassword(currentPasswordPlain, user.passwordHash)
      if (!matches) {
        throw new Error("Current password is incorrect")
      }

      user.passwordHash = await hashPassword(newPasswordPlain)
      // Revoke all existing sessions on password change for security
      user.refreshTokens = []
      await user.save()
    } else {
      const u = memoryUsers.get(userId)
      if (!u) throw new Error("User not found")

      const matches = await comparePassword(currentPasswordPlain, u.passwordHash)
      if (!matches) {
        throw new Error("Current password is incorrect")
      }

      u.passwordHash = await hashPassword(newPasswordPlain)
      u.refreshTokens = []
      u.updatedAt = new Date()
    }
  }

  /**
   * Get user preferences
   */
  static async getPreferences(userId: string): Promise<IUserPreferences> {
    const safeUser = await this.getUserById(userId)
    if (!safeUser) throw new Error("User not found")
    return safeUser.preferences
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(
    userId: string,
    prefUpdates: Partial<IUserPreferences>
  ): Promise<IUserPreferences> {
    if (config.mongodbUri) {
      if (!isDatabaseConnected()) {
        await connectDB()
      }
      const user = await User.findById(userId)
      if (!user) throw new Error("User not found")

      if (typeof prefUpdates.preferredSpeed === "number") {
        user.preferences.preferredSpeed = prefUpdates.preferredSpeed
      }
      if (typeof prefUpdates.preferredSubtitle !== "undefined") {
        user.preferences.preferredSubtitle = prefUpdates.preferredSubtitle
      }
      if (typeof prefUpdates.autoplay === "boolean") {
        user.preferences.autoplay = prefUpdates.autoplay
      }
      if (typeof prefUpdates.preferredTheme === "string") {
        user.preferences.preferredTheme = prefUpdates.preferredTheme
      }
      if (typeof prefUpdates.defaultVolume === "number") {
        user.preferences.defaultVolume = Math.max(0, Math.min(1, prefUpdates.defaultVolume))
      }
      if (typeof prefUpdates.historyTrackingEnabled === "boolean") {
        user.preferences.historyTrackingEnabled = prefUpdates.historyTrackingEnabled
      }
      if (prefUpdates.resumePreference && ["ask", "auto", "start_over"].includes(prefUpdates.resumePreference)) {
        user.preferences.resumePreference = prefUpdates.resumePreference
      }
      if (typeof prefUpdates.completionThreshold === "number") {
        user.preferences.completionThreshold = Math.max(50, Math.min(100, prefUpdates.completionThreshold))
      }
      if (prefUpdates.notificationPreferences && typeof prefUpdates.notificationPreferences === "object") {
        const cur = user.preferences.notificationPreferences || {
          recommendations: true,
          newReleases: true,
          systemUpdates: true,
        }
        user.preferences.notificationPreferences = {
          recommendations:
            typeof prefUpdates.notificationPreferences.recommendations === "boolean"
              ? prefUpdates.notificationPreferences.recommendations
              : cur.recommendations,
          newReleases:
            typeof prefUpdates.notificationPreferences.newReleases === "boolean"
              ? prefUpdates.notificationPreferences.newReleases
              : cur.newReleases,
          systemUpdates:
            typeof prefUpdates.notificationPreferences.systemUpdates === "boolean"
              ? prefUpdates.notificationPreferences.systemUpdates
              : cur.systemUpdates,
        }
      }

      await user.save()
      return user.preferences
    } else {
      const u = memoryUsers.get(userId)
      if (!u) throw new Error("User not found")

      if (typeof prefUpdates.preferredSpeed === "number") {
        u.preferences.preferredSpeed = prefUpdates.preferredSpeed
      }
      if (typeof prefUpdates.preferredSubtitle !== "undefined") {
        u.preferences.preferredSubtitle = prefUpdates.preferredSubtitle
      }
      if (typeof prefUpdates.autoplay === "boolean") {
        u.preferences.autoplay = prefUpdates.autoplay
      }
      if (typeof prefUpdates.preferredTheme === "string") {
        u.preferences.preferredTheme = prefUpdates.preferredTheme
      }
      if (typeof prefUpdates.defaultVolume === "number") {
        u.preferences.defaultVolume = Math.max(0, Math.min(1, prefUpdates.defaultVolume))
      }
      if (typeof prefUpdates.historyTrackingEnabled === "boolean") {
        u.preferences.historyTrackingEnabled = prefUpdates.historyTrackingEnabled
      }
      if (prefUpdates.resumePreference && ["ask", "auto", "start_over"].includes(prefUpdates.resumePreference)) {
        u.preferences.resumePreference = prefUpdates.resumePreference
      }
      if (typeof prefUpdates.completionThreshold === "number") {
        u.preferences.completionThreshold = Math.max(50, Math.min(100, prefUpdates.completionThreshold))
      }
      u.updatedAt = new Date()

      return u.preferences
    }
  }

  /**
   * List active (non-expired) sessions for the authenticated user without exposing token hashes
   */
  static async getActiveSessions(
    userId: string,
    currentRawRefreshToken?: string
  ): Promise<{ id: string; createdAt: string; expiresAt: string; device: string; isCurrent: boolean }[]> {
    if (!config.mongodbUri) return []
    if (!isDatabaseConnected()) {
      await connectDB()
    }

    const user = await User.findById(userId).select("+refreshTokens").maxTimeMS(4000)
    if (!user) throw new Error("User not found")

    const now = new Date()
    const currentHash = currentRawRefreshToken ? hashRefreshToken(currentRawRefreshToken) : null

    const active = (user.refreshTokens || []).filter((rt) => rt.expiresAt > now)
    return active.map((rt, idx) => ({
      id: `session_${idx + 1}_${rt.tokenHash.slice(0, 8)}`,
      createdAt: rt.createdAt.toISOString(),
      expiresAt: rt.expiresAt.toISOString(),
      device: rt.userAgent || "Web Browser Session",
      isCurrent: Boolean(currentHash && rt.tokenHash === currentHash),
    }))
  }

  /**
   * Revoke all active refresh token sessions across all devices
   */
  static async revokeAllSessions(userId: string): Promise<number> {
    if (!config.mongodbUri) return 0
    if (!isDatabaseConnected()) {
      await connectDB()
    }

    const user = await User.findById(userId).select("+refreshTokens").maxTimeMS(4000)
    if (!user) throw new Error("User not found")

    const count = (user.refreshTokens || []).length
    user.refreshTokens = []
    await user.save()
    return count
  }

  /**
   * Export all user-owned account data (profile, preferences, watch progress, watchlist, notifications)
   * Strictly omits passwordHash and refreshTokens.
   */
  static async exportAccountData(userId: string) {
    if (!isDatabaseConnected()) {
      await connectDB()
    }

    const user = await User.findById(userId).maxTimeMS(5000)
    if (!user) throw new Error("User not found")

    const [watchProgress, watchlist, notifications] = await Promise.all([
      WatchProgress.find({ userId }).maxTimeMS(5000).lean(),
      Watchlist.find({ userId }).maxTimeMS(5000).lean(),
      Notification.find({ userId }).maxTimeMS(5000).lean(),
    ])

    return {
      exportedAt: new Date().toISOString(),
      platform: "PlayNova",
      account: user.toSafeUser(),
      watchHistory: watchProgress.map((p) => ({
        videoId: p.videoId,
        lastPositionSeconds: p.lastPositionSeconds,
        durationSeconds: p.durationSeconds,
        completionPercentage: p.completionPercentage,
        isCompleted: p.isCompleted,
        lastWatchedAt: p.lastWatchedAt,
      })),
      watchlist: watchlist.map((w) => ({
        videoId: w.videoId,
        collectionName: w.collectionName || "Watch Later",
        addedAt: w.addedAt,
      })),
      notifications: notifications.map((n) => ({
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
      })),
    }
  }

  /**
   * Permanently delete authenticated user's account and associated personal data
   * Requires password re-authentication.
   */
  static async deleteAccount(userId: string, currentPasswordPlain: string): Promise<void> {
    if (!isDatabaseConnected()) {
      await connectDB()
    }

    const user = await User.findById(userId).select("+passwordHash").maxTimeMS(5000)
    if (!user) throw new Error("User not found")

    const matches = await comparePassword(currentPasswordPlain, user.passwordHash)
    if (!matches) {
      throw new Error("Incorrect password. Account deletion cancelled.")
    }

    await Promise.all([
      WatchProgress.deleteMany({ userId }),
      Watchlist.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ])
  }
}

