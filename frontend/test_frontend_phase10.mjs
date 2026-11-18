import assert from "node:assert/strict"

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"

async function runFrontendChecks() {
  console.log(`\n=========================================================`)
  console.log(`PlayNova Phase 10: Frontend Route, A11y & Media Suite`)
  console.log(`Target Frontend: ${FRONTEND_URL}`)
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

  const pages = [
    "/",
    "/explore",
    "/login",
    "/register",
    "/watchlist",
    "/history",
    "/profile",
    "/settings",
    "/admin/analytics",
    "/watch?id=nova-01",
    "/privacy",
    "/terms",
  ]

  await test("1. All 12 core Next.js routes return HTTP 200 without runtime errors", async () => {
    for (const p of pages) {
      const res = await fetch(`${FRONTEND_URL}${p}`)
      assert.equal(res.status, 200, `Route ${p} returned HTTP ${res.status}`)
      const html = await res.text()
      assert.equal(html.includes("__next_error__"), false, `Route ${p} rendered Next.js error boundary`)
      assert.equal(res.headers.get("x-powered-by"), null, `X-Powered-By leaked on ${p}`)
    }
  })

  await test("2. Accessibility landmarks (lang='en', skip-to-content link, main-content landmark)", async () => {
    const res = await fetch(`${FRONTEND_URL}/`)
    const html = await res.text()
    assert.ok(html.includes('lang="en"'), "Missing html lang='en'")
    assert.ok(html.includes('href="#main-content"'), "Missing Skip to main content link")
    assert.ok(html.includes('id="main-content"'), "Missing #main-content landmark")
  })

  await test("3. Login & Registration forms render semantic inputs and labels", async () => {
    const loginHtml = await (await fetch(`${FRONTEND_URL}/login`)).text()
    assert.ok(loginHtml.includes('type="email"'), "Login email input missing")
    assert.ok(loginHtml.includes('type="password"'), "Login password input missing")

    const regHtml = await (await fetch(`${FRONTEND_URL}/register`)).text()
    assert.ok(regHtml.includes('type="email"'), "Register email input missing")
    assert.ok(regHtml.includes('type="password"'), "Register password input missing")
  })

  await test("4. HTML5 Video HTTP Range Request (206 Partial Content + video/mp4)", async () => {
    const res = await fetch(`${FRONTEND_URL}/sample-videos/cosmic-horizons.mp4`, {
      headers: { Range: "bytes=0-1023" },
    })
    assert.equal(res.status, 206, `Expected 206 Partial Content, got ${res.status}`)
    assert.ok(
      (res.headers.get("content-type") || "").includes("video/mp4"),
      `Expected video/mp4 MIME type, got ${res.headers.get("content-type")}`
    )
    assert.ok(res.headers.get("content-range")?.startsWith("bytes 0-1023/"), "Missing/invalid Content-Range")
    const buf = await res.arrayBuffer()
    assert.equal(buf.byteLength, 1024, "Expected exactly 1024 bytes for range 0-1023")
  })

  await test("5. Multilingual WebVTT subtitle tracks (en, es, fr) served validly", async () => {
    for (const file of ["english.vtt", "spanish.vtt", "french.vtt"]) {
      const res = await fetch(`${FRONTEND_URL}/captions/${file}`)
      assert.equal(res.status, 200, `${file} returned HTTP ${res.status}`)
      const text = await res.text()
      assert.ok(text.startsWith("WEBVTT"), `${file} missing WEBVTT header`)
    }
  })

  console.log(`\n=========================================================`)
  console.log(`Frontend Phase 10 Results: ${passed} passed, ${failed} failed`)
  console.log(`=========================================================\n`)

  if (failed > 0) {
    process.exit(1)
  }
}

runFrontendChecks().catch((err) => {
  console.error("Fatal frontend test error:", err)
  process.exit(1)
})

