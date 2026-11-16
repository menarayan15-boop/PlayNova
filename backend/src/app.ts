import express, { Express, Request, Response } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import healthRoutes from "./routes/healthRoutes.js"
import videoRoutes from "./routes/videoRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { config } from "./config/env.js"

export function createApp(): Express {
  const app = express()

  // Security Headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff")
    res.setHeader("X-Frame-Options", "SAMEORIGIN")
    res.setHeader("X-XSS-Protection", "1; mode=block")
    next()
  })

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman) or matching frontend
        if (!origin || origin === config.frontendUrl || config.nodeEnv === "development") {
          callback(null, true)
        } else {
          callback(new Error("Not allowed by CORS"))
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
  )

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser(config.cookieSecret))

  // Versioned v1 Routes
  app.use("/api/v1/auth", authRoutes)
  app.use("/api/v1/users", userRoutes)

  // Backward-compatible unversioned route aliases
  app.use("/api/auth", authRoutes)
  app.use("/api/users", userRoutes)
  app.use("/api", healthRoutes)
  app.use("/api", videoRoutes)

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      status: "error",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    })
  })

  // Central error handler
  app.use(errorHandler)

  return app
}
