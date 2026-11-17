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

async function runCompleteUserJourney() {
  console.log("\n========================================================")
  console.log("PLAYNOVA PRODUCTION DEPLOYMENT & COMPLETE USER JOURNEY")
  console.log("========================================================\n")

  // Step 1: Open public PlayNova website
  console.log("[Step 1] Opening public PlayNova website (Desktop & Mobile)...")
  const homeRes = await request(`${FRONTEND_BASE}/`)
  console.log(` -> Homepage Desktop: HTTP ${homeRes.status}, size: ${homeRes.raw.length} bytes`)
  if (homeRes.status !== 200) throw new Error("Homepage failed to load")

  const homeMobileRes = await request(`${FRONTEND_BASE}/`, {
    headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148" },
  })
  console.log(` -> Homepage Mobile (iPhone User-Agent): HTTP ${homeMobileRes.status}`)
  if (homeMobileRes.status !== 200) throw new Error("Mobile homepage failed to load")

  // Step 2: Browse available videos
  console.log("\n[Step 2] Browsing available videos & channels...")
  const browseRes = await request(`${API_BASE}/api/v1/videos`)
  console.log(` -> Browse Catalog: HTTP ${browseRes.status}, count: ${browseRes.data?.data?.length || 0}`)
  if (!browseRes.data?.data?.length) throw new Error("Failed to browse videos")
  const firstVideo = browseRes.data.data[0]
  console.log(` -> First featured stream: "${firstVideo.title}" (${firstVideo.category}, ${firstVideo.duration}s)`)

  // Step 3: Register a new account
  const testEmail = `prod_journey_${Date.now()}@playnova.stream`
  const testPassword = "PlayNova2026!ProdSecure"
  console.log(`\n[Step 3] Registering new account: ${testEmail}...`)
  const regRes = await request(
    `${API_BASE}/api/auth/register`,
    { method: "POST", headers: { "Content-Type": "application/json" } },
    { fullName: "Production Journey User", email: testEmail, password: testPassword, confirmPassword: testPassword }
  )
  console.log(` -> Registration HTTP: ${regRes.status}, message: "${regRes.data?.message}"`)
  if (regRes.status !== 201) throw new Error(`Registration failed: ${regRes.data?.message}`)

  // Extract auth tokens & cookies
  const setCookies = regRes.headers["set-cookie"] || []
  let token = null
  for (const c of setCookies) {
    if (c.includes("access_token=")) {
      const match = c.match(/access_token=([^;]+)/)
      if (match) token = match[1]
    }
  }
  if (!token) throw new Error("Could not extract access_token cookie from registration response")
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    Cookie: `access_token=${token}`,
  }

  // Step 4: Verify account exists in MongoDB Atlas directly
  console.log("\n[Step 4] Verifying user persistence in MongoDB Atlas database 'playnova'...")
  await mongoose.connect(MONGODB_URI, { dbName: "playnova" })
  const db = mongoose.connection.db
  const userDoc = await db.collection("users").findOne({ email: testEmail })
  console.log(` -> Found user in Atlas 'users' collection? ${Boolean(userDoc)}`)
  console.log(` -> User ID: ${userDoc?._id}, Name: ${userDoc?.fullName}, Has bcrypt hash? ${Boolean(userDoc?.password && userDoc.password.startsWith("$2"))}`)
  if (!userDoc) throw new Error("User was not found in MongoDB Atlas")

  // Step 5: Sign in with credentials
  console.log("\n[Step 5] Signing in with registered credentials...")
  const loginRes = await request(
    `${API_BASE}/api/auth/login`,
    { method: "POST", headers: { "Content-Type": "application/json" } },
    { email: testEmail, password: testPassword }
  )
  console.log(` -> Sign in HTTP: ${loginRes.status}, user: ${loginRes.data?.data?.user?.email}`)
  if (loginRes.status !== 200) throw new Error("Login failed")

  // Step 6: Open video and verify playback streaming
  console.log(`\n[Step 6] Opening video: "${firstVideo.title}" (ID: ${firstVideo.id})...`)
  const watchPageRes = await request(`${FRONTEND_BASE}/watch?id=${firstVideo.id}`)
  console.log(` -> Watch page HTML: HTTP ${watchPageRes.status}, size: ${watchPageRes.raw.length} bytes`)
  if (watchPageRes.status !== 200) throw new Error("Watch page failed to load")

  // Verify MP4 streaming with Range request
  const videoStreamRes = await request(`${FRONTEND_BASE}${firstVideo.videoUrl}`, {
    headers: { Range: "bytes=0-2048" },
  })
  console.log(` -> Video Asset Partial Range Test: HTTP ${videoStreamRes.status}, Content-Range: ${videoStreamRes.headers["content-range"]}, Accept-Ranges: ${videoStreamRes.headers["accept-ranges"]}`)
  if (videoStreamRes.status !== 206) throw new Error("Video asset range stream failed")

  // Step 7 & 8: Simulate playing for 35 seconds then pause
  console.log("\n[Step 7 & 8] Simulating playback to 35 seconds, then pausing...")
  const progressPayload = {
    positionSeconds: 35.4,
    durationSeconds: firstVideo.duration,
    watchedInterval: [0, 35.4],
  }
  const syncRes = await request(
    `${API_BASE}/api/v1/progress/${firstVideo.id}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
    },
    progressPayload
  )
  console.log(` -> Progress sync HTTP: ${syncRes.status}, lastPositionSeconds: ${syncRes.data?.data?.progress?.lastPositionSeconds}`)
  if (syncRes.status !== 200) throw new Error("Failed to sync progress")

  // Step 9 & 10: Refresh page & verify resume position
  console.log("\n[Step 9 & 10] Reloading / simulating page refresh to resume playback...")
  const resumeRes = await request(
    `${API_BASE}/api/v1/progress/${firstVideo.id}`,
    { headers: authHeaders }
  )
  const savedPosition = resumeRes.data?.data?.progress?.lastPositionSeconds
  console.log(` -> Retrieved resume timestamp: ${savedPosition}s (matches ~35.4s? ${Math.abs(savedPosition - 35.4) < 1})`)
  if (!savedPosition || Math.abs(savedPosition - 35.4) >= 1) throw new Error("Resume position mismatch")

  // Step 11 & 12: Add video to watchlist and verify persistence in MongoDB Atlas
  console.log("\n[Step 11 & 12] Adding video to Watchlist & verifying Atlas persistence...")
  const addWlRes = await request(
    `${API_BASE}/api/v1/watchlist`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
    },
    { videoId: firstVideo.id }
  )
  console.log(` -> Add to Watchlist HTTP: ${addWlRes.status}, message: "${addWlRes.data?.message}"`)

  const wlAtlasDoc = await db.collection("watchlists").findOne({ userId: userDoc._id.toString(), videoId: firstVideo.id })
  console.log(` -> Direct Atlas query: Watchlist record in MongoDB Atlas? ${Boolean(wlAtlasDoc)}, ID: ${wlAtlasDoc?._id}`)
  if (!wlAtlasDoc) throw new Error("Watchlist document not found in MongoDB Atlas")

  // Step 13: Search for another video
  console.log("\n[Step 13] Searching catalog for 'quantum'...")
  const searchRes = await request(`${API_BASE}/api/v1/videos/search?q=quantum`)
  console.log(` -> Search results: HTTP ${searchRes.status}, found ${searchRes.data?.data?.total} videos matching 'quantum'`)
  if (!searchRes.data?.data?.items?.length) throw new Error("Search for 'quantum' yielded no results")
  console.log(` -> Top match: "${searchRes.data.data.items[0].title}"`)

  // Step 14: Test recommendations
  console.log("\n[Step 14] Testing multi-factor recommendation engine...")
  const recsRes = await request(`${API_BASE}/api/v1/videos/recommendations?limit=4`, {
    headers: authHeaders,
  })
  console.log(` -> Recommendations HTTP: ${recsRes.status}, count: ${recsRes.data?.data?.length}`)
  if (!recsRes.data?.data?.length) throw new Error("Recommendations returned empty")
  console.log(` -> Top recommendation: "${recsRes.data.data[0].title}" (${recsRes.data.data[0].category})`)

  // Step 15: Log out
  console.log("\n[Step 15] Logging out user...")
  const logoutRes = await request(
    `${API_BASE}/api/auth/logout`,
    { method: "POST", headers: authHeaders }
  )
  console.log(` -> Logout HTTP: ${logoutRes.status}, message: "${logoutRes.data?.message}"`)

  // Step 16: Sign in again
  console.log("\n[Step 16] Signing in again with credentials...")
  const reloginRes = await request(
    `${API_BASE}/api/auth/login`,
    { method: "POST", headers: { "Content-Type": "application/json" } },
    { email: testEmail, password: testPassword }
  )
  console.log(` -> Re-login HTTP: ${reloginRes.status}, token refreshed: ${Boolean(reloginRes.headers["set-cookie"])}`)
  if (reloginRes.status !== 200) throw new Error("Re-login failed")

  // Step 17: Verify user data, watch history & watchlist still intact
  console.log("\n[Step 17] Verifying user data, watch progress, and watchlist are intact...")
  const newSetCookies = reloginRes.headers["set-cookie"] || []
  let newToken = null
  for (const c of newSetCookies) {
    if (c.includes("access_token=")) {
      const match = c.match(/access_token=([^;]+)/)
      if (match) newToken = match[1]
    }
  }
  const newAuthHeaders = { Authorization: `Bearer ${newToken}`, Cookie: `access_token=${newToken}` }

  const historyVerify = await request(`${API_BASE}/api/v1/history`, { headers: newAuthHeaders })
  console.log(` -> Verified Watch History items: ${historyVerify.data?.data?.total || 0}`)

  const watchlistVerify = await request(`${API_BASE}/api/v1/watchlist`, { headers: newAuthHeaders })
  console.log(` -> Verified Watchlist items: ${watchlistVerify.data?.count || watchlistVerify.data?.data?.length || 0}`)

  if (!historyVerify.data?.data?.total || !(watchlistVerify.data?.count || watchlistVerify.data?.data?.length)) {
    throw new Error("User persisted data verification failed")
  }

  await mongoose.disconnect()

  console.log("\n========================================================")
  console.log(">>> SUCCESS: ALL 17 USER JOURNEY WORKFLOW STEPS PASSED! <<<")
  console.log("========================================================\n")
}

runCompleteUserJourney().catch((err) => {
  console.error("\n❌ User Journey Test Failed:", err)
  process.exit(1)
})
