import { Request, Response, NextFunction } from "express"
import { verifyAccessToken } from "../utils/token.js"
import { User } from "../models/User.js"
import { isDatabaseConnected } from "../config/db.js"
import { recordAuthFailure } from "../utils/metrics.js"

export function extractToken(req: Request): string | null {
  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies.access_token) {
    return req.cookies.access_token
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1]
  }

  return null
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req)

  if (!token) {
    recordAuthFailure()
    res.status(401).json({
      status: "error",
      message: "Authentication required. Please sign in to access this resource.",
    })
    return
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    recordAuthFailure()
    res.status(401).json({
      status: "error",
      message: "Session expired or invalid token. Please sign in again.",
    })
    return
  }

  req.user = payload
  next()
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req)
  if (token) {
    const payload = verifyAccessToken(token)
    if (payload) {
      req.user = payload
    }
  }
  next()
}

export function requireRole(role: "user" | "admin") {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      recordAuthFailure()
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      })
      return
    }

    // For admin endpoints, verify live role from MongoDB so revoked admins cannot use old JWTs
    if (role === "admin" && isDatabaseConnected()) {
      try {
        const dbUser = await User.findById(req.user.userId).select("role").maxTimeMS(4000).lean()
        if (!dbUser || dbUser.role !== "admin") {
          res.status(403).json({
            status: "error",
            message: "Access forbidden: administrator privileges required.",
          })
          return
        }
        next()
        return
      } catch {
        res.status(500).json({
          status: "error",
          message: "Unable to verify authorization permissions.",
        })
        return
      }
    }

    if (req.user.role !== role) {
      res.status(403).json({
        status: "error",
        message: "Access forbidden: insufficient permissions",
      })
      return
    }

    next()
  }
}

export const requireAdmin = requireRole("admin")
