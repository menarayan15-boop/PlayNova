import mongoose from "mongoose"
import { config } from "./env.js"

let isConnected = false

export async function connectDB(): Promise<boolean> {
  if (!config.mongodbUri) {
    console.warn("[Database] MONGODB_URI is not provided. Database connection remains unconfigured.")
    isConnected = false
    return false
  }

  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    })
    isConnected = true
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`)
    return true
  } catch (error) {
    isConnected = false
    console.error("[Database] MongoDB connection failed:", error instanceof Error ? error.message : error)
    return false
  }
}

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1
}

export function getDatabaseStatus(): {
  configured: boolean
  connected: boolean
  readyState: number
  message: string
} {
  const readyState = mongoose.connection.readyState
  const configured = Boolean(config.mongodbUri)
  const connected = readyState === 1

  let message = "Database unconfigured"
  if (!configured) {
    message = "MONGODB_URI not provided; running without database"
  } else if (connected) {
    message = "Connected to MongoDB"
  } else if (readyState === 2) {
    message = "Connecting to MongoDB"
  } else {
    message = "Disconnected from MongoDB"
  }

  return {
    configured,
    connected,
    readyState,
    message,
  }
}

