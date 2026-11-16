import mongoose from "mongoose"
import { config } from "./env.js"

let isConnected = false

// Helper to mask credentials when logging MongoDB URI
function sanitizeMongoUri(uri: string): string {
  try {
    return uri.replace(/\/\/(.*):(.*)@/, "//***:***@")
  } catch {
    return "[MASKED_URI]"
  }
}

export async function connectDB(): Promise<boolean> {
  if (!config.mongodbUri) {
    console.warn("[Database] MONGODB_URI is not provided. Database running in unconfigured in-memory fallback mode.")
    isConnected = false
    return false
  }

  // Prevent duplicate connections if already connected
  if (mongoose.connection.readyState === 1) {
    isConnected = true
    return true
  }

  try {
    const sanitized = sanitizeMongoUri(config.mongodbUri)
    console.log(`[Database] Connecting to MongoDB: ${sanitized}`)

    const conn = await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      autoIndex: true, // Builds unique indexes like User.email in development
    })

    isConnected = true
    console.log(`[Database] MongoDB Atlas connected successfully to host: ${conn.connection.host}`)
    return true
  } catch (error) {
    isConnected = false
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[Database] MongoDB connection failed:", sanitizeMongoUri(msg))
    return false
  }
}

// Register mongoose connection events
mongoose.connection.on("connected", () => {
  isConnected = true
  console.log("[Database Event] Mongoose connected to database.")
})

mongoose.connection.on("disconnected", () => {
  isConnected = false
  console.warn("[Database Event] Mongoose disconnected.")
})

mongoose.connection.on("reconnected", () => {
  isConnected = true
  console.log("[Database Event] Mongoose reconnected.")
})

mongoose.connection.on("error", (err) => {
  console.error("[Database Event] Mongoose error:", err?.message || err)
})

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
    message = "MONGODB_URI not provided; running with in-memory store"
  } else if (connected) {
    message = "Connected to MongoDB Atlas"
  } else if (readyState === 2) {
    message = "Connecting to MongoDB Atlas"
  } else {
    message = "Disconnected from MongoDB Atlas"
  }

  return {
    configured,
    connected,
    readyState,
    message,
  }
}
