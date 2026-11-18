import { createApp } from "./app.js"
import { config } from "./config/env.js"
import { connectDB } from "./config/db.js"
import { logger } from "./utils/logger.js"

const app = createApp()

async function startServer() {
  // Connect to database if URI is provided
  if (config.mongodbUri) {
    logger.info("Attempting connection to MongoDB Atlas...")
    await connectDB()
  } else {
    logger.warn("MONGODB_URI not configured. Video catalog endpoints require a live MongoDB connection.")
  }

  const server = app.listen(config.port, "0.0.0.0", () => {
    logger.info(`PlayNova Backend API running on port ${config.port} in ${config.nodeEnv} mode`)
    logger.info(`Health check available at http://localhost:${config.port}/api/health`)
  })

  // Graceful shutdown
  const shutdown = () => {
    logger.info("Shutting down PlayNova server...")
    server.close(() => {
      logger.info("Server closed successfully.")
      process.exit(0)
    })
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    logger.error("Failed to start server:", err)
    process.exit(1)
  })
}

export default app

