import jwt from "jsonwebtoken"
import crypto from "crypto"
import { config } from "../config/env.js"

export interface AccessTokenPayload {
  userId: string
  email: string
  role: "user" | "admin"
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  // @ts-expect-error jsonwebtoken types mismatch on StringValue
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiration,
  })
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret) as AccessTokenPayload
    return decoded
  } catch {
    return null
  }
}

export function generateRefreshTokenString(): string {
  return crypto.randomBytes(40).toString("hex")
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function getRefreshTokenExpiry(): Date {
  const date = new Date()
  date.setDate(date.getDate() + 7) // 7 days default
  return date
}

