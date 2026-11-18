import assert from "node:assert/strict"

const API_URL = process.env.API_URL || "http://localhost:5001"
const WEB_URL = process.env.FRONTEND_URL || "http://localhost:3000"

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers })
  const body = await res.json().catch(() => null)
  return { status: res.status, ok: res.ok, body }
}

async function runTests() {
  console.log(`\n=============================================================`)
  console.log(`PlayNova Catalog Deduplication & Expansion Verification Suite`)
  console.log(`API: ${API_URL} | Frontend: ${WEB_URL}`)
  console.log(`=============================================================\n`)

  let passed = 0
  let failed = 0

  async function test(name, fn) {
    try {
      await fn()
      console.log(`  [PASS] ${name}`)
      passed++
    } catch (err) {
      console.error(`  [FAIL] ${name}`)
      console.error(`         ${err.message || err}`)
      failed++
    }
  }

  let allVideos = []

  await test("1. Published catalog contains >= 80 unique videos with 0 duplicate IDs or videoUrls", async () => {
    const res = await getJson(`${API_URL}/api/v1/videos`)
    assert.equal(res.status, 200)
    allVideos = res.body?.data || []
    assert.ok(allVideos.length >= 80, `Expected >= 80 published videos, got ${allVideos.length}`)

    const idSet = new Set(allVideos.map((v) => v.id))
    const urlSet = new Set(allVideos.map((v) => (v.normalizedSourceUrl || v.videoUrl).toLowerCase()))
    assert.equal(idSet.size, allVideos.length, "Duplicate video IDs found in /api/v1/videos")
    assert.equal(urlSet.size, allVideos.length, "Duplicate videoUrls found in /api/v1/videos")
  })

  await test("2. Unified Homepage Feed has ZERO repeated videos across all sections & category rows", async () => {
    const res = await getJson(`${API_URL}/api/v1/videos/homepage?seed=qa-seed-1`)
    assert.equal(res.status, 200)
    const feed = res.body?.data
    assert.equal(feed.featured.length, 4, "Expected 4 featured videos")
    assert.equal(feed.trending.length, 4, "Expected 4 trending videos")
    assert.equal(feed.recentlyAdded.length, 4, "Expected 4 recently added videos")
    assert.equal(feed.recommended.length, 4, "Expected 4 recommended videos")
    assert.ok(feed.categoryRows.length >= 5, `Expected >= 5 category rows, got ${feed.categoryRows.length}`)

    const combined = [
      ...feed.featured,
      ...feed.trending,
      ...feed.recentlyAdded,
      ...feed.recommended,
      ...feed.categoryRows.flatMap((r) => r.items),
    ]
    const seenIds = new Set()
    const seenUrls = new Set()
    for (const v of combined) {
      assert.equal(seenIds.has(v.id), false, `Repeated video ID '${v.id}' across homepage sections`)
      const u = (v.normalizedSourceUrl || v.videoUrl).toLowerCase()
      assert.equal(seenUrls.has(u), false, `Repeated videoUrl '${u}' across homepage sections`)
      seenIds.add(v.id)
      seenUrls.add(u)
    }
    console.log(`         Verified ${combined.length} unique videos across ${4 + feed.categoryRows.length} homepage sections (0 repeats)`)
  })

  await test("3. Category filtering returns strictly relevant, distinct lists per category", async () => {
    const categories = ["Technology", "Science", "Space", "Nature", "Education", "Documentaries", "Entertainment"]
    const firstIdByCat = new Map()

    for (const cat of categories) {
      const res = await getJson(`${API_URL}/api/v1/videos/search?category=${encodeURIComponent(cat)}&limit=20`)
      assert.equal(res.status, 200)
      const items = res.body?.data?.items || []
      assert.ok(items.length >= 10, `Expected >= 10 videos in ${cat}, got ${items.length}`)
      for (const v of items) {
        const matchesCat =
          v.category === cat || (Array.isArray(v.categories) && v.categories.includes(cat))
        assert.equal(matchesCat, true, `Video '${v.title}' (${v.category}) leaked into '${cat}'`)
      }
      firstIdByCat.set(cat, items.map((v) => v.id).join(","))
    }

    assert.equal(new Set(firstIdByCat.values()).size, categories.length, "Two categories returned identical lists")
  })

  await test("4. Multi-page server pagination returns zero duplicate videos across pages 1..5", async () => {
    const seen = new Set()
    for (let p = 1; p <= 5; p++) {
      const res = await getJson(`${API_URL}/api/v1/videos/search?page=${p}&limit=12&sort=recent`)
      assert.equal(res.status, 200)
      const items = res.body?.data?.items || []
      assert.ok(items.length > 0, `Page ${p} returned 0 items`)
      for (const v of items) {
        assert.equal(seen.has(v.id), false, `Pagination repeated video '${v.id}' on page ${p}`)
        seen.add(v.id)
      }
    }
    assert.equal(seen.size, 60, `Expected 60 unique paginated videos across 5 pages, got ${seen.size}`)
  })

  await test("5. Recommendations & Similar Videos have zero duplicates and strong category diversity", async () => {
    const recRes = await getJson(`${API_URL}/api/v1/videos/recommendations?limit=8`)
    assert.equal(recRes.status, 200)
    const recs = recRes.body?.data || []
    assert.equal(recs.length, 8)
    assert.equal(new Set(recs.map((v) => v.id)).size, 8, "Duplicate recommendations returned")
    const distinctCats = new Set(recs.map((v) => v.category))
    assert.ok(distinctCats.size >= 4, `Expected >= 4 categories in recommendations, got ${distinctCats.size}`)

    const shelvesRes = await getJson(`${API_URL}/api/v1/videos/recommendations/shelves`)
    assert.equal(shelvesRes.status, 200)
    const s = shelvesRes.body?.data
    const shelfAll = [
      ...(s.recommended || []),
      ...(s.becauseYouWatched?.items || []),
      ...(s.trendingInInterests || []),
      ...(s.discoverNew || []),
    ]
    assert.equal(new Set(shelfAll.map((v) => v.id)).size, shelfAll.length, "Duplicate IDs across recommendation shelves")

    const sampleNasa = allVideos.find((v) => v.id.startsWith("nasa-"))
    const simRes = await getJson(`${API_URL}/api/v1/videos/${sampleNasa.id}/similar?limit=6`)
    assert.equal(simRes.status, 200)
    const sims = simRes.body?.data || []
    assert.equal(sims.some((v) => v.id === sampleNasa.id), false, "Similar videos included currently playing video")
    assert.equal(new Set(sims.map((v) => v.id)).size, sims.length, "Duplicate similar videos")
  })

  await test("6. Live playback (HTTP 206 + video/mp4 + MP4 ftyp header) & thumbnails on 5 imported NASA videos", async () => {
    const nasaVideos = allVideos.filter((v) => v.id.startsWith("nasa-"))
    const sample = [
      nasaVideos[0],
      nasaVideos[15],
      nasaVideos[30],
      nasaVideos[50],
      nasaVideos[nasaVideos.length - 1],
    ].filter(Boolean)

    for (const v of sample) {
      const mRes = await fetch(v.videoUrl, { headers: { Range: "bytes=0-4095" } })
      assert.ok(mRes.status === 206 || mRes.status === 200, `${v.id} video HTTP ${mRes.status}`)
      assert.ok((mRes.headers.get("content-type") || "").includes("video/mp4"), `${v.id} bad MIME`)
      const buf = Buffer.from(await mRes.arrayBuffer())
      assert.ok(buf.includes(Buffer.from("ftyp")), `${v.id} missing MP4 ftyp box`)

      const tRes = await fetch(v.thumbnailUrl, { method: "HEAD" })
      assert.equal(tRes.ok, true, `${v.id} thumbnail failed HTTP ${tRes.status}`)
    }
  })

  await test("7. Legacy user-referenced IDs (nova-01, nova-02, nova-03) remain directly resolvable", async () => {
    for (const id of ["nova-01", "nova-02", "nova-03"]) {
      const res = await getJson(`${API_URL}/api/v1/videos/${id}`)
      assert.equal(res.status, 200, `Legacy referenced video ${id} broke (HTTP ${res.status})`)
      assert.equal(res.body?.data?.id, id)
    }
  })

  await test("8. Admin Content Management endpoint rejects unauthenticated requests (401)", async () => {
    const res = await getJson(`${API_URL}/api/v1/admin/videos`)
    assert.equal(res.status, 401)
  })

  await test("9. Frontend pages (/, /explore?category=Technology, /watch?id=<nasa>, /admin/videos) render HTTP 200", async () => {
    const nasaId = allVideos.find((v) => v.id.startsWith("nasa-")).id
    for (const p of [
      "/",
      "/explore?category=Technology",
      "/explore?category=Space",
      `/watch?id=${encodeURIComponent(nasaId)}`,
      "/admin/videos",
    ]) {
      const res = await fetch(`${WEB_URL}${p}`)
      assert.equal(res.status, 200, `Frontend route ${p} returned ${res.status}`)
      const html = await res.text()
      assert.equal(html.includes("__next_error__"), false, `Frontend route ${p} hit error boundary`)
    }
  })

  console.log(`\n=============================================================`)
  console.log(`Catalog & Deduplication Results: ${passed} passed, ${failed} failed`)
  console.log(`=============================================================\n`)

  if (failed > 0) process.exit(1)
}

runTests().catch((err) => {
  console.error("Fatal test error:", err)
  process.exit(1)
})

