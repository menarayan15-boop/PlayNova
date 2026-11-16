import { Request, Response, NextFunction } from "express"
import { verifyAccessToken, AccessTokenPayload } from "../utils/token.js"

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
    res.status(401).json({
      status: "error",
      message: "Authentication required. Please sign in to access this resource.",
    })
    return
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
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
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Authentication required",
      })
      return
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

