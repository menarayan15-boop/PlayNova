import express, { Express, Request, Response } from "express"
import cors from "cors"
import healthRoutes from "./routes/healthRoutes.js"
import videoRoutes from "./routes/videoRoutes.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { config } from "./config/env.js"

export function createApp(): Express {
  const app = express()

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
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Routes
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

