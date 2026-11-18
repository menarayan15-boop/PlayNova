import assert from "node:assert/strict"

const BASE_URL = process.env.API_URL || "http://localhost:5001"

function createClient() {
  let cookieJar = ""

  return {
    getCookies: () => cookieJar,
    clearCookies: () => {
      cookieJar = ""
    },
    async request(path, options = {}) {
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
          if (idx > 0) {
            const key = firstPart.slice(0, idx)
            const val = firstPart.slice(idx + 1)
            if (val === "") {
              cookieMap.delete(key)
            } else {
              cookieMap.set(key, val)
            }
          }
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
      return { status: res.status, ok: res.ok, headers: res.headers, body }
    },
  }
}

async function runPhase10Suite() {
  console.log(`\n=========================================================`)
  console.log(`PlayNova Phase 10: Security, E2E & Readiness Suite`)
  console.log(`Target API: ${BASE_URL}`)
  console.log(`=========================================================\n`)

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

  const anon = createClient()
  const userA = createClient()
  const userB = createClient()

  const ts = Date.now()
  const emailA = `phase10_a_${ts}@playnova.dev`
  const emailB = `phase10_b_${ts}@playnova.dev`
  const passA = "Phase10Strong!PassA"
  const passB = "Phase10Strong!PassB"

  await test("1. Health check, MongoDB Atlas 'playnova', security headers & X-Response-Time", async () => {
    const res = await anon.request("/api/health", { useAuth: false })
    assert.equal(res.status, 200)
    assert.equal(res.body.database?.connected, true)
    assert.equal(res.body.database?.databaseName, "playnova")
    assert.equal(res.headers.get("x-content-type-options"), "nosniff")
    assert.equal(res.headers.get("x-frame-options"), "SAMEORIGIN")
    assert.equal(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin")
    assert.equal(res.headers.get("x-powered-by"), null, "X-Powered-By must be disabled")
    assert.ok(res.headers.get("x-response-time"), "X-Response-Time header missing")
  })

  await test("2. Unauthorized access to protected & admin endpoints returns 401", async () => {
    for (const path of [
      "/api/v1/auth/me",
      "/api/v1/users/me/sessions",
      "/api/v1/users/me/export",
      "/api/v1/analytics/dashboard",
      "/api/v1/health/metrics",
    ]) {
      const res = await anon.request(path, { useAuth: false })
      assert.equal(res.status, 401, `Expected 401 for ${path}, got ${res.status}`)
    }
  })

  await test("3. NoSQL injection payload blocked with 400 Bad Request", async () => {
    const res = await anon.request("/api/v1/auth/login", {
      method: "POST",
      useAuth: false,
      body: JSON.stringify({
        email: { $ne: "" },
        password: { $gt: "" },
      }),
    })
    assert.equal(res.status, 400, `Expected 400 for NoSQL injection, got ${res.status}`)
  })

  await test("4. Malformed video identifier rejected with 400 Bad Request", async () => {
    const res = await anon.request("/api/v1/videos/bad$id!attack", { useAuth: false })
    assert.equal(res.status, 400, `Expected 400 for invalid ID, got ${res.status}`)
  })

  await test("5. User A registration & duplicate email protection (409)", async () => {
    const reg = await userA.request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName: "Phase 10 User A", email: emailA, password: passA }),
    })
    assert.equal(reg.status, 201, `Reg A failed: ${JSON.stringify(reg.body)}`)
    assert.ok(userA.getCookies().includes("access_token"))

    const dup = await anon.request("/api/v1/auth/register", {
      method: "POST",
      useAuth: false,
      body: JSON.stringify({ fullName: "Duplicate User", email: emailA.toUpperCase(), password: passA }),
    })
    assert.equal(dup.status, 409, `Expected 409 on duplicate registration, got ${dup.status}`)
  })

  await test("6. Cross-account data isolation between User A and User B", async () => {
    // User A saves video & watch progress
    const wlA = await userA.request("/api/v1/watchlist", {
      method: "POST",
      body: JSON.stringify({ videoId: "nova-01", collectionName: "Private List A" }),
    })
    assert.equal(wlA.status, 201)

    const progA = await userA.request("/api/v1/progress/nova-01", {
      method: "PUT",
      body: JSON.stringify({ lastPositionSeconds: 195, durationSeconds: 734 }),
    })
    assert.equal(progA.ok, true)

    // Register User B and ensure User B sees 0 of User A's items
    const regB = await userB.request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName: "Phase 10 User B", email: emailB, password: passB }),
    })
    assert.equal(regB.status, 201)

    const wlB = await userB.request("/api/v1/watchlist")
    assert.equal(wlB.status, 200)
    assert.equal(wlB.body?.data?.length, 0, "User B must not see User A's watchlist")

    const progB = await userB.request("/api/v1/progress/nova-01")
    assert.equal(progB.status, 200)
    assert.equal(progB.body?.data?.progress, null, "User B must not see User A's watch progress")
  })

  await test("7. Ordinary user blocked from admin analytics & metrics (403 Forbidden)", async () => {
    const dash = await userA.request("/api/v1/analytics/dashboard")
    assert.equal(dash.status, 403, `Expected 403 for non-admin analytics, got ${dash.status}`)

    const metrics = await userA.request("/api/v1/health/metrics")
    assert.equal(metrics.status, 403, `Expected 403 for non-admin metrics, got ${metrics.status}`)
  })

  await test("8. CSRF Origin Guard blocks spoofed cross-origin cookie mutation (403)", async () => {
    const forged = await userA.request("/api/v1/watchlist", {
      method: "POST",
      headers: { Origin: "https://evil-attacker.example" },
      body: JSON.stringify({ videoId: "nova-02", collectionName: "Forged" }),
    })
    assert.equal(forged.status, 403, `Expected 403 for CSRF origin mismatch, got ${forged.status}`)
  })

  await test("9. Video Analytics real-event ingestion & 30m duplicate-view deduplication", async () => {
    const sid = `test_sid_${ts}`
    const ev1 = await userA.request("/api/v1/analytics/events", {
      method: "POST",
      body: JSON.stringify({ videoId: "nova-01", eventType: "view", sessionId: sid }),
    })
    assert.equal(ev1.status, 202)
    assert.equal(ev1.body?.data?.recorded, true)

    // Immediate duplicate view must be deduplicated
    const ev2 = await userA.request("/api/v1/analytics/events", {
      method: "POST",
      body: JSON.stringify({ videoId: "nova-01", eventType: "view", sessionId: sid }),
    })
    assert.equal(ev2.status, 202)
    assert.equal(ev2.body?.data?.recorded, false)
    assert.equal(ev2.body?.data?.reason, "duplicate_view_deduped")

    const wt = await userA.request("/api/v1/analytics/events", {
      method: "POST",
      body: JSON.stringify({ videoId: "nova-01", eventType: "watch_time", watchSeconds: 60, sessionId: sid }),
    })
    assert.equal(wt.status, 202)
    assert.equal(wt.body?.data?.recorded, true)
  })

  await test("10. Full E2E Resume, Search & Notification Preferences Persistence", async () => {
    const resume = await userA.request("/api/v1/progress/nova-01")
    assert.equal(resume.status, 200)
    assert.equal(resume.body?.data?.progress?.lastPositionSeconds, 195)

    const search = await userA.request("/api/v1/videos/search?q=quantm", { useAuth: false })
    assert.equal(search.status, 200)
    assert.ok((search.body?.data?.items?.length || 0) > 0)

    const pref = await userA.request("/api/v1/users/me/preferences", {
      method: "PATCH",
      body: JSON.stringify({
        preferredSubtitle: "fr",
        notificationPreferences: {
          recommendations: true,
          newReleases: false,
          systemUpdates: true,
        },
      }),
    })
    assert.equal(pref.status, 200)
    assert.equal(pref.body?.data?.preferences?.notificationPreferences?.newReleases, false)
  })

  await test("11. Active Sessions listing omits sensitive token hashes", async () => {
    const sess = await userA.request("/api/v1/users/me/sessions")
    assert.equal(sess.status, 200)
    const list = sess.body?.data?.sessions || []
    assert.ok(list.length >= 1, "Expected at least 1 active session")
    const serialized = JSON.stringify(list)
    assert.equal(serialized.includes("tokenHash"), false, "Must never expose tokenHash")
  })

  await test("12. Account Data Export returns safe JSON without secrets", async () => {
    const exp = await userA.request("/api/v1/users/me/export")
    assert.equal(exp.status, 200)
    const data = exp.body?.data
    assert.equal(data?.account?.email, emailA)
    assert.ok(Array.isArray(data?.watchHistory) && data.watchHistory.length >= 1)
    assert.ok(Array.isArray(data?.watchlist) && data.watchlist.length >= 1)
    const serialized = JSON.stringify(data)
    assert.equal(serialized.includes("passwordHash"), false, "Export must never expose passwordHash")
    assert.equal(serialized.includes("refreshTokens"), false, "Export must never expose refreshTokens")
  })

  await test("13. Session token rotation via /api/v1/auth/refresh", async () => {
    const ref = await userA.request("/api/v1/auth/refresh", { method: "POST" })
    assert.equal(ref.status, 200, `Refresh failed: ${JSON.stringify(ref.body)}`)
    assert.equal(ref.body?.data?.user?.email, emailA)
  })

  await test("14. Logout clears session & re-login restores access", async () => {
    const out = await userA.request("/api/v1/auth/logout", { method: "POST" })
    assert.equal(out.status, 200)
    userA.clearCookies()

    const meAfterOut = await userA.request("/api/v1/auth/me")
    assert.equal(meAfterOut.status, 401)

    const loginAgain = await userA.request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: emailA, password: passA }),
    })
    assert.equal(loginAgain.status, 200)
  })

  await test("15. Brute-force login lockout triggers 429 after 5 failed attempts", async () => {
    for (let i = 0; i < 5; i++) {
      const bad = await anon.request("/api/v1/auth/login", {
        method: "POST",
        useAuth: false,
        body: JSON.stringify({ email: emailB, password: "WrongPassword#123" }),
      })
      assert.equal(bad.status, 401, `Attempt ${i + 1} expected 401, got ${bad.status}`)
    }

    const locked = await anon.request("/api/v1/auth/login", {
      method: "POST",
      useAuth: false,
      body: JSON.stringify({ email: emailB, password: passB }),
    })
    assert.equal(locked.status, 429, `Expected 429 lockout on 6th attempt, got ${locked.status}`)
    assert.ok(locked.headers.get("retry-after"), "Expected Retry-After header on 429")
  })

  await test("16. Re-authenticated Account Deletion (rejects wrong password/phrase, deletes on valid confirmation)", async () => {
    // Reject wrong password
    const badPass = await userA.request("/api/v1/users/me/delete", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "NotMyPassword1!", confirmation: "DELETE" }),
    })
    assert.equal(badPass.status, 401)

    // Reject missing confirmation phrase
    const badPhrase = await userA.request("/api/v1/users/me/delete", {
      method: "POST",
      body: JSON.stringify({ currentPassword: passA, confirmation: "yes" }),
    })
    assert.equal(badPhrase.status, 400)

    // Delete isolated QA User A cleanly
    const delA = await userA.request("/api/v1/users/me/delete", {
      method: "POST",
      body: JSON.stringify({ currentPassword: passA, confirmation: "DELETE" }),
    })
    assert.equal(delA.status, 200)

    // Verify deleted account cannot sign in
    const loginDeleted = await anon.request("/api/v1/auth/login", {
      method: "POST",
      useAuth: false,
      body: JSON.stringify({ email: emailA, password: passA }),
    })
    assert.equal(loginDeleted.status, 401)

    // Clean up isolated QA User B via its active cookie session
    const delB = await userB.request("/api/v1/users/me/delete", {
      method: "POST",
      body: JSON.stringify({ currentPassword: passB, confirmation: "DELETE" }),
    })
    assert.equal(delB.status, 200)
  })

  console.log(`\n=========================================================`)
  console.log(`Phase 10 Results: ${passed} passed, ${failed} failed`)
  console.log(`=========================================================\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

runPhase10Suite().catch((err) => {
  console.error("Fatal Phase 10 test error:", err)
  process.exit(1)
})

