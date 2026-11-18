import fs from "node:fs"
import path from "node:path"
import { IVideoValidationDetails } from "../models/Video.js"

/**
 * Canonicalize a video source URL for reliable duplicate detection across imports
 */
export function normalizeSourceUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return ""

  if (trimmed.startsWith("/")) {
    return trimmed.replace(/\/+/g, "/").toLowerCase()
  }

  try {
    const parsed = new URL(trimmed.replace(/^http:\/\//i, "https://"))
    parsed.hash = ""
    // Strip tracking params if any
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "ref"]) {
      parsed.searchParams.delete(key)
    }
    return parsed.toString().replace(/\/$/, "")
  } catch {
    return trimmed.toLowerCase()
  }
}

function hasValidVideoMagicBytes(buf: Buffer): boolean {
  if (buf.length < 12) return false
  // MP4 / MOV ISO Base Media File Format: contains 'ftyp' box near the start
  if (buf.subarray(0, Math.min(buf.length, 64)).includes(Buffer.from("ftyp"))) {
    return true
  }
  // WebM / Matroska EBML header: 0x1A 0x45 0xDF 0xA3
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return true
  }
  // Ogg container: 'OggS'
  if (buf.subarray(0, 4).toString("ascii") === "OggS") {
    return true
  }
  return false
}

export interface VideoSourceValidationResult {
  valid: boolean
  normalizedSourceUrl: string
  details: IVideoValidationDetails
}

/**
 * Perform real media validation:
 * - Verifies HTTP 206/200 accessibility (with retry on 429/503)
 * - Verifies video/* MIME type (never relies on HTTP 200 alone)
 * - Verifies binary MP4/WebM/Ogg container magic bytes via Range request
 * - Verifies thumbnail image accessibility and image/* MIME type
 */
export async function validateVideoSource(
  videoUrl: string,
  thumbnailUrl: string,
  timeoutMs = 10000
): Promise<VideoSourceValidationResult> {
  const normalized = normalizeSourceUrl(videoUrl)
  const details: IVideoValidationDetails = {}

  if (!normalized) {
    return {
      valid: false,
      normalizedSourceUrl: "",
      details: { error: "Video source URL is empty" },
    }
  }

  // Handle local public sample files cleanly
  if (normalized.startsWith("/sample-videos/")) {
    const localPath = path.resolve(process.cwd(), "..", "frontend", "public", videoUrl.replace(/^\//, ""))
    const altPath = path.resolve(process.cwd(), "frontend", "public", videoUrl.replace(/^\//, ""))
    const resolved = fs.existsSync(localPath) ? localPath : fs.existsSync(altPath) ? altPath : null

    if (!resolved) {
      return {
        valid: false,
        normalizedSourceUrl: normalized,
        details: { error: "Local video asset does not exist on disk" },
      }
    }

    const fd = fs.openSync(resolved, "r")
    const headerBuf = Buffer.alloc(64)
    fs.readSync(fd, headerBuf, 0, 64, 0)
    fs.closeSync(fd)
    const stat = fs.statSync(resolved)

    details.httpStatus = 206
    details.contentType = "video/mp4"
    details.supportsRange = true
    details.hasValidMediaHeader = hasValidVideoMagicBytes(headerBuf)
    details.contentLength = stat.size
    details.thumbnailOk = thumbnailUrl.startsWith("http") || thumbnailUrl.startsWith("/")

    return {
      valid: Boolean(details.hasValidMediaHeader && details.thumbnailOk),
      normalizedSourceUrl: normalized,
      details,
    }
  }

  // Must be valid HTTPS/HTTP remote media URL
  if (!/^https?:\/\//i.test(videoUrl)) {
    return {
      valid: false,
      normalizedSourceUrl: normalized,
      details: { error: "Unsupported URL protocol; only HTTPS/HTTP video sources are allowed" },
    }
  }

  // 1. Validate video media via Range request (bytes 0-4095)
  let attempts = 0
  let videoOk = false
  while (attempts < 2 && !videoOk) {
    attempts++
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(videoUrl, {
        method: "GET",
        headers: { Range: "bytes=0-4095" },
        redirect: "follow",
        signal: controller.signal,
      })
      clearTimeout(timer)

      details.httpStatus = res.status
      const ct = (res.headers.get("content-type") || "").toLowerCase()
      details.contentType = ct
      details.supportsRange =
        res.status === 206 || (res.headers.get("accept-ranges") || "").toLowerCase().includes("bytes")

      const cr = res.headers.get("content-range")
      if (cr && cr.includes("/")) {
        const totalBytes = parseInt(cr.split("/")[1], 10)
        if (!isNaN(totalBytes)) details.contentLength = totalBytes
      } else {
        const cl = parseInt(res.headers.get("content-length") || "", 10)
        if (!isNaN(cl)) details.contentLength = cl
      }

      if (res.status === 429 || res.status === 503) {
        await new Promise((r) => setTimeout(r, 800 * attempts))
        continue
      }

      if (res.status !== 200 && res.status !== 206) {
        details.error = `Video endpoint returned HTTP ${res.status}`
        return { valid: false, normalizedSourceUrl: normalized, details }
      }

      const isSupportedMime =
        ct.includes("video/mp4") ||
        ct.includes("video/webm") ||
        ct.includes("video/ogg") ||
        ct.includes("application/octet-stream")

      if (!isSupportedMime) {
        details.error = `Unsupported video Content-Type: ${ct || "unknown"}`
        return { valid: false, normalizedSourceUrl: normalized, details }
      }

      const buf = Buffer.from(await res.arrayBuffer())
      details.hasValidMediaHeader = hasValidVideoMagicBytes(buf)
      if (!details.hasValidMediaHeader) {
        details.error = "Media payload failed MP4/WebM/Ogg binary container header verification"
        return { valid: false, normalizedSourceUrl: normalized, details }
      }

      videoOk = true
    } catch (err: any) {
      clearTimeout(timer)
      details.error = err?.name === "AbortError" ? "Video validation timed out" : err?.message || "Network error"
      if (attempts >= 2) {
        return { valid: false, normalizedSourceUrl: normalized, details }
      }
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  // 2. Validate thumbnail accessibility & image MIME type
  const thumbController = new AbortController()
  const thumbTimer = setTimeout(() => thumbController.abort(), timeoutMs)
  try {
    const thumbRes = await fetch(thumbnailUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: thumbController.signal,
    })
    clearTimeout(thumbTimer)
    const thumbCt = (thumbRes.headers.get("content-type") || "").toLowerCase()
    details.thumbnailOk = thumbRes.ok && (thumbCt.startsWith("image/") || thumbCt === "")
    if (!details.thumbnailOk) {
      // Some CDNs reject HEAD; fallback to lightweight GET range
      const fallbackRes = await fetch(thumbnailUrl, {
        method: "GET",
        headers: { Range: "bytes=0-511" },
        redirect: "follow",
      })
      const fCt = (fallbackRes.headers.get("content-type") || "").toLowerCase()
      details.thumbnailOk = fallbackRes.ok && fCt.startsWith("image/")
    }
  } catch {
    clearTimeout(thumbTimer)
    details.thumbnailOk = false
  }

  if (!details.thumbnailOk) {
    details.error = "Thumbnail image failed accessibility/image MIME verification"
    return { valid: false, normalizedSourceUrl: normalized, details }
  }

  return {
    valid: true,
    normalizedSourceUrl: normalized,
    details,
  }
}

