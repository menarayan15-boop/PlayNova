const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "cookie",
  "set-cookie",
  "authorization",
  "secret",
  "mongodburi",
  "jwt_secret",
  "jwt_refresh_secret",
])

export function redactString(input: string): string {
  return input
    // Redact MongoDB connection strings with credentials
    .replace(/mongodb(\+srv)?:\/\/[^@\s]+@[^\s"']+/gi, "mongodb$1://[REDACTED]")
    // Redact Bearer tokens
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]")
    // Redact JWTs (three base64url segments)
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, "[REDACTED_JWT]")
}

export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[MaxDepth]"
  if (value === null || value === undefined) return value
  if (typeof value === "string") return redactString(value)
  if (typeof value === "number" || typeof value === "boolean") return value

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
    }
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeForLog(item, depth + 1))
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        out[key] = "[REDACTED]"
      } else {
        out[key] = sanitizeForLog(val, depth + 1)
      }
    }
    return out
  }

  return String(value)
}

function formatLog(level: "INFO" | "WARN" | "ERROR", msg: string, args: unknown[]) {
  const safeMsg = redactString(msg)
  const safeArgs = args.map((a) => sanitizeForLog(a))
  const timestamp = new Date().toISOString()

  if (process.env.NODE_ENV === "production") {
    return JSON.stringify({
      level,
      timestamp,
      message: safeMsg,
      ...(safeArgs.length > 0 ? { meta: safeArgs.length === 1 ? safeArgs[0] : safeArgs } : {}),
    })
  }

  return `[${level}] [${timestamp}] ${safeMsg}`
}

export const logger = {
  info: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "production") {
      console.log(formatLog("INFO", msg, args))
    } else {
      console.log(formatLog("INFO", msg, args), ...args.map((a) => sanitizeForLog(a)))
    }
  },
  warn: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "production") {
      console.warn(formatLog("WARN", msg, args))
    } else {
      console.warn(formatLog("WARN", msg, args), ...args.map((a) => sanitizeForLog(a)))
    }
  },
  error: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "production") {
      console.error(formatLog("ERROR", msg, args))
    } else {
      console.error(formatLog("ERROR", msg, args), ...args.map((a) => sanitizeForLog(a)))
    }
  },
}
