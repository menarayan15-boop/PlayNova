import express, { Express, Request, Response } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import healthRoutes from "./routes/healthRoutes.js"
import videoRoutes from "./routes/videoRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import progressRoutes from "./routes/progressRoutes.js"
import historyRoutes from "./routes/historyRoutes.js"
import watchlistRoutes from "./routes/watchlistRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import analyticsRoutes from "./routes/analyticsRoutes.js"
import adminVideoRoutes from "./routes/adminVideoRoutes.js"
import youtubeRoutes from "./routes/youtubeRoutes.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { apiGeneralLimiter } from "./middleware/rateLimiter.js"
import {
  noSqlSanitizer,
  csrfOriginGuard,
  requestObservabilityMiddleware,
} from "./middleware/securityMiddleware.js"
import { config } from "./config/env.js"

export function createApp(): Express {
  const app = express()

  // Hide Express fingerprint
  app.disable("x-powered-by")

  // Request latency & observability tracking
  app.use(requestObservabilityMiddleware)

  // Security Headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff")
    res.setHeader("X-Frame-Options", "SAMEORIGIN")
    res.setHeader("X-XSS-Protection", "1; mode=block")
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if (config.nodeEnv === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    }
    next()
  })

  // CORS configuration
  const allowedOrigins = config.frontendUrl
    ? config.frontendUrl.split(",").map((u) => u.trim().replace(/\/$/, ""))
    : []

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-side fetch)
        if (!origin) {
          return callback(null, true)
        }

        const normalizedOrigin = origin.replace(/\/$/, "")

        // Check configured frontend URLs or development localhost
        if (
          allowedOrigins.includes(normalizedOrigin) ||
          config.nodeEnv === "development" ||
          normalizedOrigin.endsWith(".vercel.app")
        ) {
          return callback(null, true)
        }

        callback(new Error(`Origin ${origin} not allowed by CORS`))
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
  )

  // Bounded body parsing & cookies
  app.use(express.json({ limit: "100kb" }))
  app.use(express.urlencoded({ extended: true, limit: "100kb" }))
  app.use(cookieParser(config.cookieSecret))

  // Global rate limiting, NoSQL injection sanitization & CSRF origin verification
  app.use("/api", apiGeneralLimiter)
  app.use(noSqlSanitizer)
  app.use(csrfOriginGuard)

  // Versioned v1 Routes
  app.use("/api/v1/auth", authRoutes)
  app.use("/api/v1/users", userRoutes)
  app.use("/api/v1/progress", progressRoutes)
  app.use("/api/v1/history", historyRoutes)
  app.use("/api/v1/watchlist", watchlistRoutes)
  app.use("/api/v1/notifications", notificationRoutes)
  app.use("/api/v1/analytics", analyticsRoutes)
  app.use("/api/v1/admin/videos", adminVideoRoutes)
  app.use("/api/v1/youtube", youtubeRoutes)
  app.use("/api/v1", healthRoutes)
  app.use("/api/v1", videoRoutes)

  // Backward-compatible unversioned route aliases
  app.use("/api/auth", authRoutes)
  app.use("/api/users", userRoutes)
  app.use("/api/progress", progressRoutes)
  app.use("/api/history", historyRoutes)
  app.use("/api/watchlist", watchlistRoutes)
  app.use("/api/notifications", notificationRoutes)
  app.use("/api/analytics", analyticsRoutes)
  app.use("/api/admin/videos", adminVideoRoutes)
  app.use("/api/youtube", youtubeRoutes)
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
