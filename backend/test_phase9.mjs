import assert from "node:assert/strict"

const BASE_URL = process.env.API_URL || "http://localhost:5001"

let cookieJar = ""

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  }
  if (cookieJar && options.useAuth !== false) {
    headers["Cookie"] = cookieJar
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  // Capture Set-Cookie headers
  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
      ? [res.headers.get("set-cookie")]
      : []

  if (setCookies.length > 0) {
    const cookieMap = new Map()
    if (cookieJar) {
      for (const pair of cookieJar.split("; ")) {
        const idx = pair.indexOf("=")
        if (idx > 0) cookieMap.set(pair.slice(0, idx), pair.slice(idx + 1))
      }
    }
    for (const sc of setCookies) {
      const firstPart = sc.split(";")[0]
      const idx = firstPart.indexOf("=")
      if (idx > 0) cookieMap.set(firstPart.slice(0, idx), firstPart.slice(idx + 1))
    }
    cookieJar = Array.from(cookieMap.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ")
  }

  const text = await res.text()
  let body = null
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  return { status: res.status, ok: res.ok, body }
}

async function runPhase9Tests() {
  console.log(`\n========================================`)
  console.log(`PlayNova Phase 9 E2E Verification Suite`)
  console.log(`Target API: ${BASE_URL}`)
  console.log(`========================================\n`)

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

  const testEmail = `phase9_qa_${Date.now()}@playnova.dev`
  const testPassword = "TestPassword!2026"

  await test("1. Health check confirms MongoDB Atlas connection (playnova)", async () => {
    const res = await api("/api/health", { useAuth: false })
    assert.equal(res.status, 200)
    assert.equal(res.body.database?.connected, true)
    assert.equal(res.body.database?.databaseName, "playnova")
  })

  await test("2. Register & authenticate Phase 9 QA user (HttpOnly cookies)", async () => {
    const reg = await api("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Phase 9 QA Reviewer",
        email: testEmail,
        password: testPassword,
      }),
    })
    assert.equal(reg.status, 201, `Expected 201, got ${reg.status}: ${JSON.stringify(reg.body)}`)
    assert.ok(cookieJar.includes("access_token"), `Expected HttpOnly access_token cookie, got: ${cookieJar}`)
  })

  await test("3. Record watch progress on Space & Technology videos", async () => {
    const r1 = await api("/api/v1/progress/nova-01", {
      method: "PUT",
      body: JSON.stringify({
        lastPositionSeconds: 240,
        durationSeconds: 734,
      }),
    })
    assert.equal(r1.ok, true, `Progress save failed: ${JSON.stringify(r1.body)}`)

    const r2 = await api("/api/v1/progress/nova-03", {
      method: "PUT",
      body: JSON.stringify({
        lastPositionSeconds: 180,
        durationSeconds: 420,
      }),
    })
    assert.equal(r2.ok, true, `Progress save 2 failed: ${JSON.stringify(r2.body)}`)
  })

  await test("4. Multi-shelf AI Recommendations (/api/v1/videos/recommendations/shelves)", async () => {
    const res = await api("/api/v1/videos/recommendations/shelves")
    assert.equal(res.status, 200)
    const shelves = res.body?.data
    assert.ok(Array.isArray(shelves?.recommended) && shelves.recommended.length > 0, "recommended shelf missing")
    assert.ok(shelves?.becauseYouWatched?.sourceVideo?.id, "becauseYouWatched sourceVideo missing")
    assert.ok(
      Array.isArray(shelves?.becauseYouWatched?.items) && shelves.becauseYouWatched.items.length > 0,
      "becauseYouWatched items missing"
    )
    assert.ok(
      Array.isArray(shelves?.trendingInInterests) && shelves.trendingInInterests.length > 0,
      "trendingInInterests shelf missing"
    )
    assert.ok(
      Array.isArray(shelves?.discoverNew) && shelves.discoverNew.length > 0,
      "discoverNew shelf missing"
    )
  })

  await test("5. Similar Videos endpoint (/api/v1/videos/nova-01/similar)", async () => {
    const res = await api("/api/v1/videos/nova-01/similar?limit=4", { useAuth: false })
    assert.equal(res.status, 200)
    const items = res.body?.data
    assert.ok(Array.isArray(items) && items.length > 0)
    assert.equal(
      items.some((v) => v.id === "nova-01"),
      false,
      "Similar videos must exclude source video"
    )
  })

  await test("6. Typo-tolerant Smart Search ('spce' -> Space, 'quantm' -> Quantum, 'blndr' -> Blender)", async () => {
    for (const typo of ["spce", "quantm", "blndr"]) {
      const res = await api(`/api/v1/videos/search?q=${encodeURIComponent(typo)}`, { useAuth: false })
      assert.equal(res.status, 200)
      const items = res.body?.data?.items || []
      assert.ok(items.length > 0, `Expected typo-tolerant matches for '${typo}', got 0`)
    }
  })

  await test("7. Smart Search Suggestions with typo tolerance ('quantm')", async () => {
    const res = await api("/api/v1/videos/suggestions?q=quantm", { useAuth: false })
    assert.equal(res.status, 200)
    assert.ok((res.body?.data?.videos?.length || 0) > 0, "Expected video suggestions for 'quantm'")
  })

  await test("8. Named Watchlist Collections (create custom collection, filter & search)", async () => {
    const addFav = await api("/api/v1/watchlist", {
      method: "POST",
      body: JSON.stringify({ videoId: "nova-01", collectionName: "Favorites" }),
    })
    assert.equal(addFav.status, 201, `addFav failed: ${JSON.stringify(addFav.body)}`)

    const addCustom = await api("/api/v1/watchlist", {
      method: "POST",
      body: JSON.stringify({ videoId: "nova-03", collectionName: "Sci-Fi Marathons" }),
    })
    assert.equal(addCustom.status, 201, `addCustom failed: ${JSON.stringify(addCustom.body)}`)

    const cols = await api("/api/v1/watchlist/collections")
    assert.equal(cols.status, 200)
    const colNames = (cols.body?.data || []).map((c) => (typeof c === "string" ? c : c.name))
    assert.ok(colNames.includes("Sci-Fi Marathons"), `Custom collection missing: ${JSON.stringify(colNames)}`)
    assert.ok(colNames.includes("Favorites"), `Favorites collection missing: ${JSON.stringify(colNames)}`)

    const filtered = await api("/api/v1/watchlist?collection=Sci-Fi%20Marathons")
    assert.equal(filtered.status, 200)
    assert.equal(filtered.body?.data?.length, 1)
    assert.equal(filtered.body?.data?.[0]?.videoId, "nova-03")

    const searched = await api("/api/v1/watchlist?search=Quantum")
    assert.equal(searched.status, 200)
    assert.equal(searched.body?.data?.length, 1)
    assert.equal(searched.body?.data?.[0]?.videoId, "nova-03")
  })

  await test("9. Notification Center (fetch default notifications, mark read, read-all, dismiss)", async () => {
    const list1 = await api("/api/v1/notifications")
    assert.equal(list1.status, 200)
    const items1 = list1.body?.data?.items || []
    const unread1 = list1.body?.data?.unreadCount || 0
    assert.ok(items1.length >= 2, `Expected >=2 seeded notifications, got ${items1.length}`)
    assert.ok(unread1 >= 2, `Expected unreadCount >= 2, got ${unread1}`)

    const firstId = items1[0].id
    const markOne = await api(`/api/v1/notifications/${firstId}/read`, {
      method: "PATCH",
    })
    assert.equal(markOne.status, 200)

    const list2 = await api("/api/v1/notifications")
    assert.equal(list2.body?.data?.unreadCount, unread1 - 1)

    const markAll = await api("/api/v1/notifications/read-all", {
      method: "PATCH",
    })
    assert.equal(markAll.status, 200)

    const list3 = await api("/api/v1/notifications")
    assert.equal(list3.body?.data?.unreadCount, 0)

    const delRes = await api(`/api/v1/notifications/${firstId}`, {
      method: "DELETE",
    })
    assert.equal(delRes.status, 200)

    const list4 = await api("/api/v1/notifications")
    assert.equal(list4.body?.data?.items?.length, items1.length - 1)
  })

  await test("10. Multilingual Subtitle Preference persistence in MongoDB", async () => {
    const upd = await api("/api/v1/users/me/preferences", {
      method: "PATCH",
      body: JSON.stringify({
        preferredSubtitle: "fr",
        preferredSpeed: 1.25,
      }),
    })
    assert.equal(upd.status, 200, `Update preferences failed: ${JSON.stringify(upd.body)}`)

    const me = await api("/api/v1/auth/me")
    assert.equal(me.status, 200)
    assert.equal(me.body?.data?.user?.preferences?.preferredSubtitle, "fr")
    assert.equal(me.body?.data?.user?.preferences?.preferredSpeed, 1.25)
  })

  console.log(`\n========================================`)
  console.log(`Phase 9 Results: ${passed} passed, ${failed} failed`)
  console.log(`========================================\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

runPhase9Tests().catch((err) => {
  console.error("Fatal test error:", err)
  process.exit(1)
})
