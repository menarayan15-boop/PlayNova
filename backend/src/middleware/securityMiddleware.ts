import { Request, Response, NextFunction } from "express"
import { config } from "../config/env.js"
import { logger } from "../utils/logger.js"
import { recordRequestMetrics, recordAuthFailure } from "../utils/metrics.js"

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"])

function containsUnsafeOperators(obj: unknown, depth = 0): boolean {
  if (depth > 8 || obj === null || obj === undefined || typeof obj !== "object") {
    return false
  }

  if (Array.isArray(obj)) {
    return obj.some((item) => containsUnsafeOperators(item, depth + 1))
  }

  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (key.startsWith("$") || FORBIDDEN_KEYS.has(key)) {
      return true
    }
    if (containsUnsafeOperators(val, depth + 1)) {
      return true
    }
  }
  return false
}

/**
 * Prevents NoSQL injection (e.g. { "$ne": "" }) and prototype pollution in body/query/params
 */
export function noSqlSanitizer(req: Request, res: Response, next: NextFunction): void {
  if (
    containsUnsafeOperators(req.body) ||
    containsUnsafeOperators(req.query) ||
    containsUnsafeOperators(req.params)
  ) {
    logger.warn("Blocked unsafe operator / NoSQL injection attempt", {
      method: req.method,
      path: req.path,
      ip: req.ip,
    })
    res.status(400).json({
      status: "error",
      message: "Malformed input: unsafe query operators are not permitted.",
    })
    return
  }
  next()
}

/**
 * Validates Origin/Referer on cookie-authenticated state-changing requests (CSRF defense-in-depth)
 */
export function csrfOriginGuard(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase()
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next()
    return
  }

  // Only enforce origin check when authentication cookies are attached
  const hasAuthCookie = Boolean(req.cookies?.access_token || req.cookies?.refresh_token)
  if (!hasAuthCookie) {
    next()
    return
  }

  const originHeader = req.headers.origin || req.headers.referer
  if (!originHeader) {
    // Non-browser API clients (curl, server-to-server, Node test suites) omit Origin
    next()
    return
  }

  try {
    const parsedOrigin = new URL(originHeader).origin.replace(/\/$/, "")
    const allowedOrigins = config.frontendUrl
      ? config.frontendUrl.split(",").map((u) => u.trim().replace(/\/$/, ""))
      : []

    const isAllowed =
      allowedOrigins.includes(parsedOrigin) ||
      parsedOrigin.endsWith(".vercel.app") ||
      (config.nodeEnv === "development" &&
        (parsedOrigin.startsWith("http://localhost:") || parsedOrigin.startsWith("http://127.0.0.1:")))

    if (!isAllowed) {
      logger.warn("Blocked cross-origin state-changing request (CSRF protection)", {
        origin: parsedOrigin,
        path: req.path,
      })
      res.status(403).json({
        status: "error",
        message: "Forbidden: cross-origin request rejected.",
      })
      return
    }
  } catch {
    res.status(403).json({
      status: "error",
      message: "Forbidden: invalid origin header.",
    })
    return
  }

  next()
}

// Per-account + IP login brute-force tracker
interface AttemptRecord {
  count: number
  lockedUntil: number
  lastAttempt: number
}

const MAX_FAILED_LOGINS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes
const failedLoginStore = new Map<string, AttemptRecord>()

function buildLoginKey(email: string, ip: string): string {
  return `${email.trim().toLowerCase()}::${ip || "unknown"}`
}

export function checkLoginLockout(email: string, ip: string): { locked: boolean; retryAfterSeconds: number } {
  const key = buildLoginKey(email, ip)
  const record = failedLoginStore.get(key)
  if (!record) return { locked: false, retryAfterSeconds: 0 }

  const now = Date.now()
  if (record.lockedUntil > now) {
    return {
      locked: true,
      retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    }
  }

  // Clear stale expired lockout
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    failedLoginStore.delete(key)
  }

  return { locked: false, retryAfterSeconds: 0 }
}

export function recordFailedLogin(email: string, ip: string): void {
  recordAuthFailure()
  const key = buildLoginKey(email, ip)
  const now = Date.now()
  const existing = failedLoginStore.get(key)

  if (!existing || now - existing.lastAttempt > LOCKOUT_MS) {
    failedLoginStore.set(key, { count: 1, lockedUntil: 0, lastAttempt: now })
    return
  }

  existing.count += 1
  existing.lastAttempt = now
  if (existing.count >= MAX_FAILED_LOGINS) {
    existing.lockedUntil = now + LOCKOUT_MS
    logger.warn("Account login temporarily locked due to repeated failed attempts", {
      ip,
      attempts: existing.count,
    })
  }
}

export function clearFailedLogin(email: string, ip: string): void {
  failedLoginStore.delete(buildLoginKey(email, ip))
}

/**
 * Validates that route identifier params contain only safe alphanumeric/slug characters
 */
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{2,64}$/

export function validateSafeId(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const val = req.params[paramName]
    if (!val || !SAFE_ID_REGEX.test(val)) {
      res.status(400).json({
        status: "error",
        message: `Invalid identifier format for '${paramName}'.`,
      })
      return
    }
    next()
  }
}

/**
 * Measures API response time, adds X-Response-Time header, and updates observability metrics
 */
export function requestObservabilityMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = performance.now()

  const originalEnd = res.end.bind(res)
  // Set header right before headers are flushed
  res.on("finish", () => {
    const durationMs = performance.now() - start
    recordRequestMetrics(res.statusCode, durationMs)
    if (res.statusCode >= 500) {
      logger.error("HTTP 5xx response", {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
      })
    }
  })

  res.end = ((...args: Parameters<Response["end"]>) => {
    if (!res.headersSent) {
      const durationMs = (performance.now() - start).toFixed(2)
      res.setHeader("X-Response-Time", `${durationMs}ms`)
    }
    return originalEnd(...args)
  }) as Response["end"]

  next()
}

