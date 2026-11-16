import rateLimit from "express-rate-limit"

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // Limit each IP to 20 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many authentication attempts from this IP. Please try again in 15 minutes.",
  },
})

export const apiGeneralLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
})

