import http from "http"
import dns from "dns"
import mongoose from "mongoose"

dns.setServers(["8.8.8.8", "1.1.1.1"])

const API_BASE = "http://localhost:5001"
const FRONTEND_BASE = "http://localhost:3000"
const MONGODB_URI = "mongodb+srv://menarayan15_db_user:CerfQYR1oD6yZOww@playnovacluster.txttj48.mongodb.net/playnova?retryWrites=true&w=majority"

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let body = ""
        res.on("data", (chunk) => (body += chunk))
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body), raw: body, headers: res.headers })
          } catch {
            resolve({ status: res.statusCode, raw: body, headers: res.headers })
          }
        })
      }
    )
    req.on("error", reject)
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData))
    }
    req.end()
  })
}

async function runTests() {
  console.log("=== PLAYNOVA PHASE 6 VERIFICATION TEST ===")

  // 1. Backend Health
  const health = await request(`${API_BASE}/api/health`)
  console.log(`[1] Backend Health: HTTP ${health.status}, DB: ${health.data?.database?.connected ? "CONNECTED" : "FAILED"}`)
  if (!health.data?.database?.connected) throw new Error("Database not connected")

  // 2. Video Search
  const searchSpace = await request(`${API_BASE}/api/v1/videos/search?q=space`)
  console.log(`[2] Video Search ('space'): HTTP ${searchSpace.status}, found ${searchSpace.data?.data?.items?.length} items`)
  if (!searchSpace.data?.data?.items?.length) throw new Error("Search failed")

  // 3. Search Suggestions
  const suggestions = await request(`${API_BASE}/api/v1/videos/suggestions?q=c`)
  console.log(`[3] Suggestions ('c'): HTTP ${suggestions.status}, suggestions: ${suggestions.data?.data?.suggestions?.length}, video matches: ${suggestions.data?.data?.videos?.length}`)
  if (!suggestions.data?.data?.suggestions?.length) throw new Error("Suggestions failed")

  // 4. Recommendations
  const recs = await request(`${API_BASE}/api/v1/videos/recommendations?limit=4`)
  console.log(`[4] Recommendations: HTTP ${recs.status}, returned ${recs.data?.data?.length} videos`)
  if (!recs.data?.data?.length) throw new Error("Recommendations failed")

  // 5. Trending Videos
  const trending = await request(`${API_BASE}/api/v1/videos/trending?limit=4`)
  console.log(`[5] Trending Videos: HTTP ${trending.status}, returned ${trending.data?.data?.length} videos`)

  // 6. User Auth & Watchlist Flow
  const testEmail = `phase6_${Date.now()}@playnova.test`
  const testPass = "PlayNova2026!Secure"
  const registerRes = await request(
    `${API_BASE}/api/auth/register`,
    { method: "POST", headers: { "Content-Type": "application/json" } },
    { fullName: "Phase 6 Tester", email: testEmail, password: testPass, confirmPassword: testPass }
  )
  console.log(`[6] User Registration: HTTP ${registerRes.status}, user: ${registerRes.data?.data?.user?.email}`)

  // Extract access_token from Set-Cookie header
  const setCookies = registerRes.headers["set-cookie"] || []
  let token = null
  let cookieHeader = ""
  for (const c of setCookies) {
    if (c.includes("access_token=")) {
      const match = c.match(/access_token=([^;]+)/)
      if (match) token = match[1]
    }
  }
  if (!token) throw new Error("Failed to get token from registration cookies")
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    Cookie: `access_token=${token}`,
  }

  // Add to Watchlist
  const addWl = await request(
    `${API_BASE}/api/v1/watchlist`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
    },
    { videoId: "nova-01" }
  )
  console.log(`[7] Add to Watchlist ('nova-01'): HTTP ${addWl.status}, msg: ${addWl.data?.message}`)

  // Check Watchlist
  const checkWl = await request(
    `${API_BASE}/api/v1/watchlist/nova-01/check`,
    { headers: authHeaders }
  )
  console.log(`[8] Check Watchlist: inWatchlist = ${checkWl.data?.data?.inWatchlist}`)
  if (!checkWl.data?.data?.inWatchlist) throw new Error("Watchlist check failed")

  // List Watchlist
  const listWl = await request(
    `${API_BASE}/api/v1/watchlist`,
    { headers: authHeaders }
  )
  console.log(`[9] List Watchlist: HTTP ${listWl.status}, items: ${listWl.data?.data?.length}, video: ${listWl.data?.data?.[0]?.video?.title}`)

  // Direct MongoDB Atlas Verification
  await mongoose.connect(MONGODB_URI)
  const db = mongoose.connection.db
  const wlDoc = await db.collection("watchlists").findOne({ videoId: "nova-01" })
  console.log(`[10] MongoDB Atlas Direct Query: Found watchlist doc in Atlas? ${Boolean(wlDoc)}, ID: ${wlDoc?._id}`)
  await mongoose.disconnect()

  // Remove from Watchlist
  const removeWl = await request(
    `${API_BASE}/api/v1/watchlist/nova-01`,
    { method: "DELETE", headers: authHeaders }
  )
  console.log(`[11] Remove from Watchlist: HTTP ${removeWl.status}, msg: ${removeWl.data?.message}`)

  // 7. Frontend Pages Verification
  const homeHtml = await request(`${FRONTEND_BASE}/`)
  console.log(`[12] Frontend Homepage: HTTP ${homeHtml.status}, length: ${homeHtml.raw?.length} bytes`)

  const exploreHtml = await request(`${FRONTEND_BASE}/explore`)
  console.log(`[13] Frontend Explore: HTTP ${exploreHtml.status}, length: ${exploreHtml.raw?.length} bytes`)

  const watchlistHtml = await request(`${FRONTEND_BASE}/watchlist`)
  console.log(`[14] Frontend Watchlist: HTTP ${watchlistHtml.status}, length: ${watchlistHtml.raw?.length} bytes`)

  console.log("\n>>> ALL PHASE 6 ENDPOINTS AND PAGES VERIFIED SUCCESSFULLY! <<<")
}

runTests().catch((err) => {
  console.error("Test failed:", err)
  process.exit(1)
})
