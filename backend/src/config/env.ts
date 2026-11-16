import dotenv from "dotenv"

dotenv.config()

export interface AppConfig {
  port: number
  nodeEnv: string
  mongodbUri: string
  frontendUrl: string
}

export function validateConfig(): AppConfig {
  const port = parseInt(process.env.PORT || "5000", 10)
  const nodeEnv = process.env.NODE_ENV || "development"
  const mongodbUri = process.env.MONGODB_URI || ""
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000"

  if (!process.env.MONGODB_URI) {
    console.warn("[Config Warning] MONGODB_URI is not set. Running in unconfigured database mode.")
  }

  return {
    port,
    nodeEnv,
    mongodbUri,
    frontendUrl,
  }
}

export const config = validateConfig()

