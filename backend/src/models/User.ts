import mongoose, { Document, Schema } from "mongoose"

export interface INotificationPreferences {
  recommendations: boolean
  newReleases: boolean
  systemUpdates: boolean
}

export interface IUserPreferences {
  preferredSpeed: number
  preferredSubtitle: string | null
  autoplay: boolean
  preferredTheme: string
  defaultVolume: number
  historyTrackingEnabled: boolean
  resumePreference: "ask" | "auto" | "start_over"
  completionThreshold: number
  notificationPreferences?: INotificationPreferences
}

export interface IRefreshToken {
  tokenHash: string
  expiresAt: Date
  createdAt: Date
  userAgent?: string
}

export interface IUser extends Document {
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
  toSafeUser(): SafeUserDTO
}

export interface SafeUserDTO {
  id: string
  fullName: string
  email: string
  role: "user" | "admin"
  avatarUrl?: string
  lastLoginAt?: Date
  preferences: IUserPreferences
  createdAt: Date
  updatedAt: Date
}

const PreferencesSchema = new Schema<IUserPreferences>(
  {
    preferredSpeed: { type: Number, enum: [0.5, 1, 1.25, 1.5, 2], default: 1 },
    preferredSubtitle: { type: String, default: "en" },
    autoplay: { type: Boolean, default: false },
    preferredTheme: { type: String, default: "cream" },
    defaultVolume: { type: Number, default: 0.8, min: 0, max: 1 },
    historyTrackingEnabled: { type: Boolean, default: true },
    resumePreference: { type: String, enum: ["ask", "auto", "start_over"], default: "ask" },
    completionThreshold: { type: Number, default: 90, min: 50, max: 100 },
    notificationPreferences: {
      type: {
        recommendations: { type: Boolean, default: true },
        newReleases: { type: Boolean, default: true },
        systemUpdates: { type: Boolean, default: true },
      },
      default: () => ({
        recommendations: true,
        newReleases: true,
        systemUpdates: true,
      }),
      _id: false,
    },
  },
  { _id: false }
)

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    userAgent: { type: String, maxlength: 160, default: "Web Session" },
  },
  { _id: false }
)

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false, // Automatically excluded from queries unless explicitly selected
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    lastLoginAt: {
      type: Date,
    },
    preferences: {
      type: PreferencesSchema,
      default: () => ({
        preferredSpeed: 1,
        preferredSubtitle: "en",
        autoplay: false,
        preferredTheme: "cream",
        defaultVolume: 0.8,
        historyTrackingEnabled: true,
        resumePreference: "ask",
        completionThreshold: 90,
      }),
    },
    refreshTokens: {
      type: [RefreshTokenSchema],
      default: [],
      select: false, // Never send refresh token hashes to client
    },
  },
  {
    timestamps: true,
  }
)

// Email unique index is established via unique: true on the schema field definition

// Helper to sanitize User documents into SafeUserDTO
UserSchema.methods.toSafeUser = function (): SafeUserDTO {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    role: this.role,
    avatarUrl: this.avatarUrl,
    lastLoginAt: this.lastLoginAt,
    preferences: this.preferences,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export const User = mongoose.model<IUser>("User", UserSchema)
