import dotenv from "dotenv"
import dns from "node:dns"
import mongoose from "mongoose"
import fs from "node:fs"
import path from "node:path"

dotenv.config({ path: "./backend/.env" })
dns.setServers(["8.8.8.8", "1.1.1.1"])

async function runAudit() {
  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db
  const videos = await db.collection("videos").find({}).toArray()
  const progs = await db.collection("watchprogresses").find({}).toArray()
  const wls = await db.collection("watchlists").find({}).toArray()

  const urlMap = {}
  const catMap = {}
  const playableCheck = []

  for (const v of videos) {
    const u = (v.videoUrl || "").trim()
    urlMap[u] = urlMap[u] || []
    urlMap[u].push({ id: String(v._id), title: v.title, category: v.category })
    catMap[v.category] = (catMap[v.category] || 0) + 1

    let localExists = null
    let fileSize = 0
    if (u.startsWith("/sample-videos/")) {
      const fp = path.join(process.cwd(), "frontend", "public", u)
      localExists = fs.existsSync(fp)
      if (localExists) fileSize = fs.statSync(fp).size
    }
    playableCheck.push({
      id: String(v._id),
      title: v.title,
      category: v.category,
      videoUrl: u,
      localExists,
      fileSize,
      thumbnailUrl: v.thumbnailUrl,
    })
  }

  const dupUrls = Object.entries(urlMap).filter(([, list]) => list.length > 1)
  console.log(
    JSON.stringify(
      {
        databaseName: db.databaseName,
        totalVideos: videos.length,
        uniqueIds: new Set(videos.map((v) => String(v._id))).size,
        uniqueVideoUrls: Object.keys(urlMap).length,
        duplicateVideoUrlsCount: dupUrls.length,
        duplicateVideoUrls: dupUrls,
        categoryCounts: catMap,
        watchProgressVideoIds: [...new Set(progs.map((p) => p.videoId))],
        watchlistVideoIds: [...new Set(wls.map((w) => w.videoId))],
        videos: playableCheck,
      },
      null,
      2
    )
  )

  await mongoose.disconnect()
}

runAudit().catch((e) => {
  console.error(e)
  process.exit(1)
})

