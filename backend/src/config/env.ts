import dotenv from "dotenv"

dotenv.config()

export interface AppConfig {
  port: number
  nodeEnv: string
  mongodbUri: string
  frontendUrl: string
  jwtAccessSecret: string
  jwtRefreshSecret: string
  cookieSecret: string
  jwtAccessExpiration: string
  jwtRefreshExpiration: string
  youtubeApiKey: string
  youtubeRegionCode: string
  youtubeDailyQuotaLimit: number
}

export function validateConfig(): AppConfig {
  const port = parseInt(process.env.PORT || "5000", 10)
  const nodeEnv = process.env.NODE_ENV || "development"
  const mongodbUri = process.env.MONGODB_URI || ""
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000"

  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || "playnova_dev_jwt_access_secret_super_secure_key_123"
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "playnova_dev_jwt_refresh_secret_super_secure_key_456"
  const cookieSecret = process.env.COOKIE_SECRET || "playnova_dev_cookie_signing_secret_super_key_789"
  const jwtAccessExpiration = process.env.JWT_ACCESS_EXPIRATION || "15m"
  const jwtRefreshExpiration = process.env.JWT_REFRESH_EXPIRATION || "7d"

  const youtubeApiKey = (process.env.YOUTUBE_API_KEY || "").trim()
  const youtubeRegionCode = (process.env.YOUTUBE_REGION_CODE || "US").trim().toUpperCase()
  const youtubeDailyQuotaLimit = parseInt(process.env.YOUTUBE_DAILY_QUOTA_LIMIT || "10000", 10)

  if (!process.env.MONGODB_URI) {
    console.warn("[Config Warning] MONGODB_URI is not set. Running in unconfigured database mode.")
  }

  return {
    port,
    nodeEnv,
    mongodbUri,
    frontendUrl,
    jwtAccessSecret,
    jwtRefreshSecret,
    cookieSecret,
    jwtAccessExpiration,
    jwtRefreshExpiration,
    youtubeApiKey,
    youtubeRegionCode,
    youtubeDailyQuotaLimit,
  }
}

export const config = validateConfig()
