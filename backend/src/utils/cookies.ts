import { Response } from "express"
import { config } from "../config/env.js"

const isProd = config.nodeEnv === "production"

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  // Access Token Cookie (15 minutes)
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  })

  // Refresh Token Cookie (7 days)
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  })
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  })

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  })
}

