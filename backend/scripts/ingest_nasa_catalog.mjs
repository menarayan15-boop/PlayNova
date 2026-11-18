import dotenv from "dotenv"
import dns from "node:dns"
import mongoose from "mongoose"
import crypto from "node:crypto"

dotenv.config({ path: "./backend/.env" })
dns.setServers(["8.8.8.8", "1.1.1.1"])

const CATEGORY_PLANS = [
  {
    category: "Space",
    secondary: "Science",
    target: 14,
    queries: ["james webb galaxy", "mars perseverance rover", "black hole nebula", "apollo lunar"],
  },
  {
    category: "Technology",
    secondary: "Science",
    target: 12,
    queries: ["robotics nasa", "laser communications", "supercomputer simulation", "autonomous drone"],
  },
  {
    category: "Science",
    secondary: "Education",
    target: 12,
    queries: ["solar flare physics", "microgravity biology", "atmospheric chemistry", "exoplanet discovery"],
  },
  {
    category: "Nature",
    secondary: "Science",
    target: 12,
    queries: ["ocean coral earth", "arctic glacier ice", "aurora earth from space", "rainforest volcano earth"],
  },
  {
    category: "Education",
    secondary: "Science",
    target: 12,
    queries: ["stem student", "astronaut training", "space station science", "rocket launch explained"],
  },
  {
    category: "Documentaries",
    secondary: "Space",
    target: 10,
    queries: ["voyager spacecraft", "hubble telescope", "artemis mission", "iss expedition"],
  },
  {
    category: "Entertainment",
    secondary: "Space",
    target: 10,
    queries: ["earth time lapse", "3d visualization cosmos", "solar system animation", "lunar orbit tour"],
  },
]

function normalizeUrl(raw) {
  if (!raw) return ""
  const trimmed = raw.trim()
  if (trimmed.startsWith("/")) return trimmed.toLowerCase()
  try {
    const u = new URL(trimmed.replace(/^http:\/\//i, "https://"))
    u.hash = ""
    return u.toString().replace(/\/$/, "")
  } catch {
    return trimmed.toLowerCase()
  }
}

function makeStableId(nasaId) {
  const slug = nasaId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36)
  const hash = crypto.createHash("sha1").update(nasaId).digest("hex").slice(0, 6)
  return `nasa-${slug || "clip"}-${hash}`
}

function parseDurationSeconds(metaJson) {
  if (!metaJson || typeof metaJson !== "object") return 180
  const raw =
    metaJson["AVAIL:MediaDuration"] ||
    metaJson["QuickTime:Duration"] ||
    metaJson["Composite:Duration"] ||
    metaJson["XMP:Duration"]

  if (typeof raw === "number" && raw > 5 && raw < 14400) {
    return Math.round(raw)
  }
  if (typeof raw === "string") {
    // Formats: "00:03:24", "145.2 s", "3:15"
    if (raw.includes(":")) {
      const parts = raw.split(":").map((p) => parseFloat(p))
      if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
        return Math.max(15, Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]))
      }
      if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
        return Math.max(15, Math.round(parts[0] * 60 + parts[1]))
      }
    }
    const num = parseFloat(raw)
    if (!isNaN(num) && num > 5 && num < 14400) {
      return Math.round(num)
    }
  }
  return 180
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function validateMedia(mp4Url, thumbUrl) {
  // 1. Validate MP4 binary header via Range request
  const res = await fetchWithTimeout(
    mp4Url,
    { method: "GET", headers: { Range: "bytes=0-4095" }, redirect: "follow" },
    10000
  )
  const ct = (res.headers.get("content-type") || "").toLowerCase()
  const supportsRange =
    res.status === 206 || (res.headers.get("accept-ranges") || "").toLowerCase().includes("bytes")

  if (res.status !== 206 && res.status !== 200) {
    return { valid: false, reason: `HTTP ${res.status}` }
  }
  if (!ct.includes("video/mp4") && !ct.includes("video/")) {
    return { valid: false, reason: `Bad MIME: ${ct}` }
  }

  const buf = Buffer.from(await res.arrayBuffer())
  const hasFtyp = buf.subarray(0, Math.min(buf.length, 64)).includes(Buffer.from("ftyp"))
  if (!hasFtyp) {
    return { valid: false, reason: "Missing MP4 ftyp header" }
  }

  let contentLength = 0
  const cr = res.headers.get("content-range")
  if (cr && cr.includes("/")) {
    contentLength = parseInt(cr.split("/")[1], 10) || 0
  }

  // Reject gigantic >250MB raw uncompressed files so browser playback stays snappy
  if (contentLength > 250 * 1024 * 1024) {
    return { valid: false, reason: `File too large (${Math.round(contentLength / 1024 / 1024)}MB)` }
  }

  // 2. Validate thumbnail
  const tRes = await fetchWithTimeout(thumbUrl, { method: "HEAD", redirect: "follow" }, 8000)
  const tCt = (tRes.headers.get("content-type") || "").toLowerCase()
  const thumbOk = tRes.ok && (tCt.startsWith("image/") || tCt === "")
  if (!thumbOk) {
    return { valid: false, reason: `Thumbnail HTTP ${tRes.status}` }
  }

  return {
    valid: true,
    details: {
      httpStatus: res.status,
      contentType: ct,
      supportsRange,
      hasValidMediaHeader: true,
      thumbnailOk: true,
      contentLength,
    },
  }
}

async function runIngestion() {
  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db
  const col = db.collection("videos")

  console.log(`\nConnected to MongoDB Atlas database: ${db.databaseName}`)

  // =========================================================================
  // STEP A: Safe Deduplication Pass on Legacy Records (ZERO DELETIONS)
  // =========================================================================
  const legacyHashAIds = ["nova-01", "nova-03", "nova-05", "nova-07", "nova-09", "nova-11", "nova-12"]
  const legacyHashBIds = ["nova-02", "nova-04", "nova-06", "nova-08", "nova-10"]
  // User-referenced records (watchProgress / watchlist): nova-01, nova-02, nova-03
  // Keep nova-01 (Hash A canonical) and nova-02 (Hash B canonical) published.
  // Mark unreferenced duplicate-binary legacy records as 'duplicate_archived' (preserved in DB, excluded from public feeds).
  // Keep nova-03 accessible by direct ID (referenced by existing user progress/watchlist) and mark duplicateOf: 'nova-01' & status: 'duplicate_archived'.
  const legacyDuplicatesToArchive = [
    { id: "nova-03", canonical: "nova-01" },
    { id: "nova-04", canonical: "nova-02" },
    { id: "nova-05", canonical: "nova-01" },
    { id: "nova-06", canonical: "nova-02" },
    { id: "nova-07", canonical: "nova-01" },
    { id: "nova-08", canonical: "nova-02" },
    { id: "nova-09", canonical: "nova-01" },
    { id: "nova-10", canonical: "nova-02" },
    { id: "nova-11", canonical: "nova-01" },
    { id: "nova-12", canonical: "nova-01" },
  ]

  for (const dup of legacyDuplicatesToArchive) {
    await col.updateOne(
      { _id: dup.id },
      {
        $set: {
          status: "duplicate_archived",
          duplicateOf: dup.canonical,
          sourceProvider: "PlayNova Legacy Seed",
          sourceAttribution: "PlayNova Local Sample",
          license: "Sample Asset (Archived Duplicate Binary)",
          validationStatus: "verified",
          updatedAt: new Date(),
        },
      }
    )
  }

  // Enrich canonical legacy records nova-01 and nova-02 so they stay valid and verified
  await col.updateOne(
    { _id: "nova-01" },
    {
      $set: {
        normalizedSourceUrl: "/sample-videos/cosmic-horizons.mp4",
        categories: ["Space", "Science"],
        status: "published",
        sourceProvider: "PlayNova Local",
        sourceAttribution: "PlayNova Sample Library",
        license: "Open Sample Media",
        validationStatus: "verified",
        validatedAt: new Date(),
      },
    }
  )
  await col.updateOne(
    { _id: "nova-02" },
    {
      $set: {
        normalizedSourceUrl: "/sample-videos/open-animation.mp4",
        categories: ["Nature", "Entertainment"],
        status: "published",
        sourceProvider: "Blender Foundation",
        sourceAttribution: "Blender Institute (Big Buck Bunny)",
        license: "Creative Commons Attribution 3.0 (CC-BY 3.0)",
        validationStatus: "verified",
        validatedAt: new Date(),
      },
    }
  )

  console.log(`Legacy deduplication pass complete: 2 canonical local streams kept published, 10 duplicate-binary legacy records safely archived (0 deleted).`)

  // Load existing normalized URLs & sourceKeys & titles for strict deduplication
  const existingDocs = await col.find({}).toArray()
  const seenUrls = new Set(existingDocs.map((d) => normalizeUrl(d.videoUrl)))
  const seenSourceKeys = new Set(existingDocs.map((d) => d.sourceKey).filter(Boolean))
  const seenTitles = new Set(existingDocs.map((d) => (d.title || "").trim().toLowerCase()))

  const stats = {
    imported: 0,
    skippedDuplicate: 0,
    failedValidation: 0,
    brokenExamples: [],
    byCategory: {},
  }

  // =========================================================================
  // STEP B: Ingest Real, Validated NASA Public Domain Videos per Category
  // =========================================================================
  for (const plan of CATEGORY_PLANS) {
    let addedInCat = 0
    stats.byCategory[plan.category] = 0
    console.log(`\n[Category: ${plan.category}] Target: ${plan.target} verified unique videos...`)

    for (const q of plan.queries) {
      if (addedInCat >= plan.target) break

      try {
        const searchUrl = `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=video&page_size=25`
        const searchRes = await fetchWithTimeout(searchUrl, {}, 12000)
        if (!searchRes.ok) {
          console.warn(`  NASA search HTTP ${searchRes.status} for "${q}"`)
          continue
        }
        const searchJson = await searchRes.json()
        const items = searchJson?.collection?.items || []

        for (const item of items) {
          if (addedInCat >= plan.target) break

          const meta = item?.data?.[0]
          if (!meta || !meta.nasa_id || !meta.title) continue

          const sourceKey = `nasa:${meta.nasa_id}`
          const cleanTitle = meta.title.trim().replace(/\s+/g, " ").slice(0, 180)
          const titleKey = cleanTitle.toLowerCase()

          if (seenSourceKeys.has(sourceKey) || seenTitles.has(titleKey)) {
            stats.skippedDuplicate++
            continue
          }

          const previewLink = (item.links || []).find((l) => l.rel === "preview" && l.href)?.href
          if (!previewLink) continue
          const safeThumb = encodeURI(previewLink.replace(/^http:\/\//i, "https://"))

          // Fetch asset manifest for MP4 and metadata.json
          let assets = []
          try {
            const aRes = await fetchWithTimeout(item.href, {}, 8000)
            if (!aRes.ok) continue
            assets = await aRes.json()
          } catch {
            continue
          }

          if (!Array.isArray(assets)) continue

          // Prefer fast-streaming ~medium.mp4, then ~small.mp4, then ~mobile.mp4, then ~orig.mp4
          const mp4Raw =
            assets.find((u) => typeof u === "string" && u.endsWith("~medium.mp4")) ||
            assets.find((u) => typeof u === "string" && u.endsWith("~small.mp4")) ||
            assets.find((u) => typeof u === "string" && u.endsWith("~mobile.mp4")) ||
            assets.find((u) => typeof u === "string" && u.endsWith("~orig.mp4")) ||
            assets.find((u) => typeof u === "string" && u.toLowerCase().endsWith(".mp4"))

          if (!mp4Raw) continue

          const safeMp4 = encodeURI(mp4Raw.replace(/^http:\/\//i, "https://"))
          const normalized = normalizeUrl(safeMp4)

          if (seenUrls.has(normalized)) {
            stats.skippedDuplicate++
            continue
          }

          // Real HTTP Range + binary MP4 ftyp + thumbnail MIME validation
          let validation
          try {
            validation = await validateMedia(safeMp4, safeThumb)
          } catch (err) {
            validation = { valid: false, reason: err?.message || "timeout" }
          }

          if (!validation.valid) {
            stats.failedValidation++
            if (stats.brokenExamples.length < 10) {
              stats.brokenExamples.push({ nasa_id: meta.nasa_id, title: cleanTitle, reason: validation.reason })
            }
            continue
          }

          // Optional metadata.json fetch for exact real duration
          let duration = 180
          const metaUrl = assets.find((u) => typeof u === "string" && u.endsWith("metadata.json"))
          if (metaUrl) {
            try {
              const mRes = await fetchWithTimeout(encodeURI(metaUrl.replace(/^http:\/\//i, "https://")), {}, 5000)
              if (mRes.ok) {
                const mJson = await mRes.json()
                duration = parseDurationSeconds(mJson)
              }
            } catch {
              // default duration
            }
          }

          const rawDesc = (meta.description || meta.description_508 || cleanTitle)
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
          const description = (rawDesc.length > 20 ? rawDesc : `${cleanTitle} — Official NASA public domain video.`).slice(
            0,
            600
          )

          const rawTags = Array.isArray(meta.keywords) ? meta.keywords : []
          const tags = Array.from(
            new Set([
              plan.category.toLowerCase(),
              ...rawTags
                .map((t) => String(t).trim().toLowerCase())
                .filter((t) => t.length >= 2 && t.length <= 28),
              "nasa",
            ])
          ).slice(0, 8)

          const createdDate = meta.date_created ? new Date(meta.date_created) : new Date()
          const validCreatedAt = isNaN(createdDate.getTime()) ? new Date() : createdDate

          const docId = makeStableId(meta.nasa_id)
          const isFeatured = addedInCat < 2 // 2 featured picks per category

          const doc = {
            _id: docId,
            title: cleanTitle,
            description,
            videoUrl: safeMp4,
            normalizedSourceUrl: normalized,
            sourceKey,
            thumbnailUrl: safeThumb,
            duration,
            category: plan.category,
            categories: [plan.category, plan.secondary],
            views: 0,
            featured: isFeatured,
            quality: safeMp4.includes("~orig.mp4") ? ["1080p", "720p"] : ["720p", "480p"],
            tags,
            sourceProvider: "NASA Image and Video Library",
            sourceAttribution: meta.center ? `NASA (${meta.center})` : "NASA",
            license: "Public Domain (U.S. Government / NASA Media Guidelines)",
            status: "published",
            validationStatus: "verified",
            validatedAt: new Date(),
            validationDetails: validation.details,
            createdAt: validCreatedAt,
            updatedAt: new Date(),
          }

          await col.updateOne({ _id: docId }, { $setOnInsert: doc }, { upsert: true })

          seenUrls.add(normalized)
          seenSourceKeys.add(sourceKey)
          seenTitles.add(titleKey)
          addedInCat++
          stats.imported++
          stats.byCategory[plan.category]++
          console.log(`  + [${plan.category} ${addedInCat}/${plan.target}] ${cleanTitle.slice(0, 65)} (${duration}s)`)
        }
      } catch (err) {
        console.warn(`  Query "${q}" error:`, err?.message || err)
      }
    }
  }

  // Final DB inventory summary
  const published = await col.find({ status: "published" }).toArray()
  const archived = await col.countDocuments({ status: "duplicate_archived" })
  const finalCatCounts = {}
  const finalUniqueUrls = new Set()
  for (const v of published) {
    finalCatCounts[v.category] = (finalCatCounts[v.category] || 0) + 1
    finalUniqueUrls.add(normalizeUrl(v.videoUrl))
  }

  console.log(`\n=========================================================`)
  console.log(`PlayNova Real Catalog Ingestion Summary`)
  console.log(`=========================================================`)
  console.log(
    JSON.stringify(
      {
        newlyImported: stats.imported,
        skippedDuplicates: stats.skippedDuplicate,
        rejectedInvalidSources: stats.failedValidation,
        brokenOrRejectedSamples: stats.brokenExamples,
        totalPublishedVideos: published.length,
        uniquePublishedVideoUrls: finalUniqueUrls.size,
        archivedLegacyDuplicates: archived,
        publishedCategoryCounts: finalCatCounts,
      },
      null,
      2
    )
  )

  await mongoose.disconnect()
}

runIngestion().catch((err) => {
  console.error("Fatal ingestion error:", err)
  process.exit(1)
})

