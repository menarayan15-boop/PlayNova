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

  // Prevent connecting to placeholder URIs
  if (config.mongodbUri.includes("YOUR_CLUSTER") || config.mongodbUri.includes("<username>")) {
    console.warn(
      "[Database] MONGODB_URI contains placeholder host ('YOUR_CLUSTER'). Database running in in-memory fallback mode until actual MongoDB Atlas cluster is configured."
    )
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
      dbName: "playnova", // Explicitly ensure playnova database is targeted (not defaulting to 'test')
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      autoIndex: true, // Builds unique indexes like User.email in development
    })

    isConnected = true
    console.log(`[Database] MongoDB Atlas connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`)
    return true
  } catch (error) {
    isConnected = false
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[Database] MongoDB connection failed:", sanitizeMongoUri(msg))
    // Disconnect Mongoose to halt background reconnection attempts that crash Node
    try {
      await mongoose.disconnect()
    } catch {
      // ignore
    }
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
  databaseName?: string
  host?: string
} {
  const readyState = mongoose.connection.readyState
  const configured = Boolean(config.mongodbUri)
  const connected = readyState === 1
  const databaseName = mongoose.connection.name || mongoose.connection.db?.databaseName
  const host = mongoose.connection.host

  let message = "Database unconfigured"
  if (!configured) {
    message = "MONGODB_URI not provided; running with in-memory store"
  } else if (config.mongodbUri.includes("YOUR_CLUSTER") || config.mongodbUri.includes("<username>")) {
    message = "MONGODB_URI contains placeholder host (YOUR_CLUSTER); running with in-memory store"
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
    databaseName,
    host,
  }
}
