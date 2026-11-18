import { Request, Response, NextFunction } from "express"
import { logger, redactString } from "../utils/logger.js"
import { config } from "../config/env.js"
import { recordDbFailure } from "../utils/metrics.js"

export interface ApiError extends Error {
  statusCode?: number
  errors?: unknown
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const statusCode = err.statusCode || 500
  const isProd = config.nodeEnv === "production"
  const rawMessage = err.message || "Internal Server Error"
  const safeRawMessage = redactString(rawMessage)

  if (
    rawMessage.toLowerCase().includes("mongo") ||
    rawMessage.toLowerCase().includes("topology") ||
    rawMessage.toLowerCase().includes("econnrefused")
  ) {
    recordDbFailure()
  }

  // Never leak raw database connection errors or stack traces to clients
  const clientMessage =
    statusCode === 500 && isProd
      ? "An internal server error occurred"
      : safeRawMessage.includes("[REDACTED]")
      ? "A database service error occurred. Please try again shortly."
      : safeRawMessage

  logger.error(`Error on ${req.method} ${req.path}`, {
    statusCode,
    message: safeRawMessage,
    ...(isProd ? {} : { stack: err.stack ? redactString(err.stack) : undefined }),
  })

  res.status(statusCode).json({
    status: "error",
    message: clientMessage,
    ...(err.errors ? { errors: err.errors } : {}),
  })
}
