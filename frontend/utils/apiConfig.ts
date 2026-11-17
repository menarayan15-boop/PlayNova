/**
 * Production-ready API URL resolver and builder for PlayNova.
 * Prioritizes NEXT_PUBLIC_API_URL from environment.
 * In production browser mode without an explicit host, falls back to relative "" to leverage Next.js API rewrites.
 * In development, falls back to http://localhost:5001.
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
  }
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    return ""
  }
  return "http://localhost:5001"
}

export function buildApiUrl(endpoint: string): string {
  const base = getApiBaseUrl()
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  if (!base) return cleanEndpoint
  return `${base}${cleanEndpoint}`
}
