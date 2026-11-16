import { Request, Response, NextFunction } from "express"
import { logger } from "../utils/logger.js"

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
  const message = err.message || "Internal Server Error"

  logger.error(`Error on ${req.method} ${req.url}:`, {
    statusCode,
    message,
    stack: err.stack,
  })

  res.status(statusCode).json({
    status: "error",
    message,
    ...(err.errors ? { errors: err.errors } : {}),
  })
}

