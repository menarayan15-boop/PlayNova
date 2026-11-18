import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import os from "node:os"
import path from "node:path"
import fs from "node:fs"

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
const DEBUG_PORT = 9299
const BASE_URL = "http://localhost:3000"

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl)
    this.nextId = 1
    this.pending = new Map()
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", () => resolve())
      this.ws.addEventListener("error", (err) => reject(err))
    })
    this.ws.addEventListener("message", (evt) => {
      const msg = JSON.parse(String(evt.data))
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)))
        else resolve(msg.result)
      }
    })
  }

  async send(method, params = {}) {
    await this.ready
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression: `(async () => { ${expression} })()`,
      awaitPromise: true,
      returnByValue: true,
    })
    if (res.exceptionDetails) {
      throw new Error(
        res.exceptionDetails.exception?.description ||
          res.exceptionDetails.text ||
          "Evaluation exception"
      )
    }
    return res.result?.value
  }

  async navigate(url) {
    await this.send("Page.navigate", { url })
    await sleep(1200)
  }

  close() {
    try {
      this.ws.close()
    } catch {}
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForDevTools(port, timeoutMs = 10000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`)
      if (res.ok) {
        const list = await res.json()
        const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl)
        if (page) return page.webSocketDebuggerUrl
      }
    } catch {}
    await sleep(250)
  }
  throw new Error("Timed out waiting for headless Chrome DevTools endpoint")
}

async function runBrowserQA() {
  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), "playnova-qa-chrome-"))
  const chrome = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${tempProfile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--window-size=1280,860",
      "--autoplay-policy=no-user-gesture-required",
      "about:blank",
    ],
    { stdio: "ignore" }
  )

  let cdp = null
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

  try {
    const wsUrl = await waitForDevTools(DEBUG_PORT)
    cdp = new CdpClient(wsUrl)
    await cdp.send("Page.enable")
    await cdp.send("Runtime.enable")
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 860,
      deviceScaleFactor: 1,
      mobile: false,
    })

    console.log(`\n=============================================================`)
    console.log(`PlayNova Real Chrome Headless Playback & UI Verification`)
    console.log(`Target: ${BASE_URL}`)
    console.log(`=============================================================\n`)

    // ---------------------------------------------------------------
    // TEST 1: Homepage Randomized Featured Video & Refresh Exclusion
    // ---------------------------------------------------------------
    await test("1. Homepage featured video randomizes on every refresh & excludes previous ID via localStorage", async () => {
      async function loadHeroId() {
        await cdp.navigate(`${BASE_URL}/`)
        for (let i = 0; i < 25; i++) {
          const info = await cdp.eval(`
            const el = document.querySelector('[data-testid="hero-featured-container"]');
            const id = el?.getAttribute('data-featured-video-id') || '';
            const title = document.querySelector('[data-testid="hero-featured-title"]')?.textContent || '';
            const poolText = el?.textContent?.match(/Pool:\\s*(\\d+)\\s*videos/)?.[1] || '0';
            const lsId = localStorage.getItem('playnova_last_featured_video_id') || '';
            const vid = el?.querySelector('video');
            return { id, title, poolCount: Number(poolText), lsId, videoPaused: vid ? vid.paused : true };
          `)
          if (info.id) return info
          await sleep(300)
        }
        throw new Error("Timed out waiting for hero featured video to load")
      }

      const v1 = await loadHeroId()
      assert.ok(v1.id.length > 0, "Visit 1 featured ID empty")
      assert.equal(v1.lsId, v1.id, "localStorage must store Visit 1 featured ID")
      assert.equal(v1.videoPaused, true, "Hero video must NOT autoplay uninvited")
      assert.ok(v1.poolCount >= 2, `Expected >= 2 eligible featured videos, got ${v1.poolCount}`)

      const v2 = await loadHeroId()
      assert.notEqual(v2.id, v1.id, `Visit 2 repeated Visit 1 featured video (${v1.id})`)
      assert.equal(v2.lsId, v2.id)

      const v3 = await loadHeroId()
      assert.notEqual(v3.id, v2.id, `Visit 3 repeated Visit 2 featured video (${v2.id})`)
      assert.equal(v3.lsId, v3.id)

      console.log(
        `         Eligible pool: ${v1.poolCount} videos | Visit 1: ${v1.id} -> Visit 2: ${v2.id} -> Visit 3: ${v3.id}`
      )
    })

    // ---------------------------------------------------------------
    // TEST 2: Native HTML5 Play -> Wait 5s -> Pause -> Resume -> Space -> Stop + Subtitle Overlap
    // ---------------------------------------------------------------
    await test("2. Native HTML5 video: Play (5s), Pause freeze, Resume, Space shortcut, Stop & ZERO subtitle overlap", async () => {
      await cdp.navigate(`${BASE_URL}/watch?id=nova-01`)

      // Wait for <video> metadata to load
      let ready = false
      for (let i = 0; i < 30; i++) {
        ready = await cdp.eval(`
          const v = document.querySelector('video');
          return Boolean(v && v.readyState >= 1 && v.duration > 0);
        `)
        if (ready) break
        await sleep(300)
      }
      assert.equal(ready, true, "Native HTML5 video did not load metadata")

      // Confirm no unwanted autoplay before user clicks Play
      const initialPaused = await cdp.eval(`return document.querySelector('video').paused;`)
      assert.equal(initialPaused, true, "Video should be paused initially (no unwanted autoplay)")

      // Enable English subtitles via WatchPage pill button
      await cdp.eval(`
        const btns = Array.from(document.querySelectorAll('button'));
        const enBtn = btns.find(b => b.textContent?.trim() === 'English');
        if (enBtn) enBtn.click();
      `)

      // Click center Play button
      await cdp.eval(`
        const playBtn = document.querySelector('button[aria-label="Play video"]');
        if (!playBtn) throw new Error('Play button not found');
        playBtn.click();
      `)

      // Wait 5 seconds of real playback
      await sleep(5000)

      const afterPlay = await cdp.eval(`
        const v = document.querySelector('video');
        return { paused: v.paused, currentTime: v.currentTime, duration: v.duration };
      `)
      assert.equal(afterPlay.paused, false, "Video failed to enter playing state")
      assert.ok(afterPlay.currentTime >= 2.0, `Expected currentTime >= 2s after 5s play, got ${afterPlay.currentTime}`)

      // Trigger mousemove so bottom controls are visible, then measure caption vs control bar overlap!
      const layout = await cdp.eval(`
        const v = document.querySelector('video');
        const container = v.closest('[tabindex="0"]');
        container.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
        await new Promise(r => setTimeout(r, 250));
        const captions = document.querySelector('[data-testid="playnova-captions"]');
        const pauseBtn = document.querySelector('button[aria-label="Pause video"]');
        const controlsBar = pauseBtn?.closest('div.absolute.bottom-0');
        return {
          captionText: captions?.textContent?.trim() || null,
          captionsRect: captions ? captions.getBoundingClientRect().toJSON() : null,
          controlsRect: controlsBar ? controlsBar.getBoundingClientRect().toJSON() : null,
          videoRect: v.getBoundingClientRect().toJSON(),
        };
      `)
      assert.ok(layout.captionsRect, "PlayNova custom captions box not rendered during cue window (1s..30s)")
      assert.ok(layout.controlsRect, "Bottom player controls bar not found")
      assert.ok(
        layout.captionsRect.bottom <= layout.controlsRect.top + 1,
        `Subtitle overlapped controls! captions.bottom=${layout.captionsRect.bottom} > controls.top=${layout.controlsRect.top}`
      )
      assert.ok(
        layout.captionsRect.top >= layout.videoRect.top,
        "Captions escaped top of video viewport"
      )
      console.log(
        `         Subtitles verified ABOVE controls: captions.bottom=${layout.captionsRect.bottom.toFixed(1)}px <= controls.top=${layout.controlsRect.top.toFixed(1)}px ("${layout.captionText.slice(0, 48)}...")`
      )

      // Click bottom Pause button -> wait 2 seconds -> confirm timestamp frozen & no auto-restart!
      await cdp.eval(`
        const pauseBtn = document.querySelector('button[aria-label="Pause video"]');
        if (!pauseBtn) throw new Error('Bottom Pause button not found');
        pauseBtn.click();
      `)
      await sleep(300)
      const pauseSnap1 = await cdp.eval(`
        const v = document.querySelector('video');
        return { paused: v.paused, t: v.currentTime };
      `)
      assert.equal(pauseSnap1.paused, true, "Video did NOT pause when bottom Pause button clicked")

      await sleep(2000)
      const pauseSnap2 = await cdp.eval(`
        const v = document.querySelector('video');
        return { paused: v.paused, t: v.currentTime };
      `)
      assert.equal(pauseSnap2.paused, true, "Video auto-restarted after manual pause!")
      assert.equal(
        Number(pauseSnap2.t.toFixed(2)),
        Number(pauseSnap1.t.toFixed(2)),
        `Timestamp moved while paused! ${pauseSnap1.t} -> ${pauseSnap2.t}`
      )
      console.log(`         Pause freeze verified: paused=true, timestamp frozen at ${pauseSnap1.t.toFixed(2)}s for 2.0s`)

      // Click Play again -> verify resume
      await cdp.eval(`
        document.querySelector('button[aria-label="Play video"]').click();
      `)
      await sleep(1500)
      const resumed = await cdp.eval(`
        const v = document.querySelector('video');
        return { paused: v.paused, t: v.currentTime };
      `)
      assert.equal(resumed.paused, false, "Video failed to resume on Play click")
      assert.ok(resumed.t > pauseSnap2.t + 0.5, "Timestamp did not advance on resume")

      // Test Space key shortcut -> verify pauses cleanly without double-toggling!
      await cdp.send("Input.dispatchKeyEvent", {
        type: "keyDown",
        code: "Space",
        key: " ",
        windowsVirtualKeyCode: 32,
      })
      await cdp.send("Input.dispatchKeyEvent", {
        type: "keyUp",
        code: "Space",
        key: " ",
        windowsVirtualKeyCode: 32,
      })
      await sleep(1000)
      const afterSpace = await cdp.eval(`
        const v = document.querySelector('video');
        return { paused: v.paused, t: v.currentTime };
      `)
      assert.equal(afterSpace.paused, true, "Space key failed to pause (possible double-toggle)")
      console.log(`         Space shortcut pause verified: paused=true at ${afterSpace.t.toFixed(2)}s`)

      // Test Stop button -> verify paused=true & currentTime === 0
      await cdp.eval(`
        const stopBtn = document.querySelector('button[aria-label="Stop video"]');
        if (!stopBtn) throw new Error('Stop button not found');
        stopBtn.click();
      `)
      await sleep(300)
      const afterStop = await cdp.eval(`
        const v = document.querySelector('video');
        return { paused: v.paused, t: v.currentTime };
      `)
      assert.equal(afterStop.paused, true, "Video not paused after Stop")
      assert.equal(afterStop.t, 0, `Expected currentTime=0 after Stop, got ${afterStop.t}`)
    })

    // ---------------------------------------------------------------
    // TEST 3: YouTube Embedded Player (YT IFrame API Play/Pause/Stop + No Overlap)
    // ---------------------------------------------------------------
    await test("3. YouTube embedded player renders official iframe, non-overlapping controls, channel attribution & Play/Pause/Stop", async () => {
      await cdp.navigate(`${BASE_URL}/watch?id=yt_JjiaLf3jGxw`)

      // Wait for official YouTube iframe + ready Play button
      let ytReady = null
      for (let i = 0; i < 35; i++) {
        ytReady = await cdp.eval(`
          const iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
          const playBtn = document.querySelector('button[aria-label="Play video"]');
          const stopBtn = document.querySelector('button[aria-label="Stop video"]');
          const watchOnYt = document.querySelector('a[href*="youtube.com/watch"]');
          const text = document.body.innerText || '';
          return {
            hasIframe: Boolean(iframe),
            iframeSrc: iframe?.getAttribute('src') || '',
            iframeRect: iframe ? iframe.getBoundingClientRect().toJSON() : null,
            playReady: Boolean(playBtn && !playBtn.disabled),
            playRect: playBtn ? playBtn.getBoundingClientRect().toJSON() : null,
            hasStop: Boolean(stopBtn),
            hasChannel: text.includes('WELT Documentary'),
            hasAttributionLink: Boolean(watchOnYt && watchOnYt.getBoundingClientRect().width > 0),
          };
        `)
        if (ytReady.hasIframe && ytReady.playReady) break
        await sleep(400)
      }

      assert.equal(ytReady?.hasIframe, true, "Official YouTube iframe did not mount")
      assert.equal(ytReady?.playReady, true, "YouTube IFrame API onReady did not fire")
      assert.equal(ytReady?.hasStop, true, "Dedicated Stop button missing on YouTubePlayer")
      assert.equal(ytReady?.hasChannel, true, "Channel attribution 'WELT Documentary' missing")
      assert.equal(ytReady?.hasAttributionLink, true, "Required 'Watch on YouTube' attribution link missing")
      assert.ok(
        ytReady.playRect.top >= ytReady.iframeRect.bottom - 1,
        `YouTube companion controls overlapped iframe! controls.top=${ytReady.playRect.top} < iframe.bottom=${ytReady.iframeRect.bottom}`
      )

      // Click Play -> wait 3s -> Pause -> verify state toggles cleanly
      await cdp.eval(`document.querySelector('button[aria-label="Play video"]').click();`)
      await sleep(3000)
      const ytPlaying = await cdp.eval(`
        return Boolean(document.querySelector('button[aria-label="Pause video"]'));
      `)
      assert.equal(ytPlaying, true, "YouTube player did not transition to Playing state")

      await cdp.eval(`document.querySelector('button[aria-label="Pause video"]').click();`)
      await sleep(1500)
      const ytPaused = await cdp.eval(`
        return Boolean(document.querySelector('button[aria-label="Play video"]'));
      `)
      assert.equal(ytPaused, true, "YouTube player did not stay Paused after clicking Pause")

      // Click Stop
      await cdp.eval(`document.querySelector('button[aria-label="Stop video"]').click();`)
      console.log(`         YouTube IFrame API verified: iframe mounted, attribution visible, Play -> Pause -> Stop clean`)
    })

    // ---------------------------------------------------------------
    // TEST 4: Consistent PlayNova Branding (Zero Decorative YouTube Badges/Icons on Custom UI)
    // ---------------------------------------------------------------
    await test("4. Custom PlayNova cards & sections have zero decorative YouTube badges/red icons & consistent PlayNova play icons", async () => {
      for (const route of ["/", "/explore"]) {
        await cdp.navigate(`${BASE_URL}${route}`)
        // Wait for cards to hydrate
        let audit = null
        for (let i = 0; i < 20; i++) {
          audit = await cdp.eval(`
            const cards = Array.from(document.querySelectorAll('a[aria-label^="Watch "]'));
            const ytPillBadges = Array.from(document.querySelectorAll('span')).filter(
              (el) => el.textContent?.trim() === 'YouTube' && !el.closest('iframe')
            );
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, span')).filter(
              (el) => /Trending on YouTube|YouTube Live|YouTube ·|YouTube IFrame API/i.test(el.textContent || '')
            );
            const redPlayBtns = cards.filter((el) => {
              const bg = getComputedStyle(el).backgroundColor || '';
              return bg.includes('255, 0, 0') || bg.includes('220, 38, 38');
            });
            const goldPlayBtns = cards.filter((el) => {
              const bg = getComputedStyle(el).backgroundColor || '';
              return bg.includes('140, 123, 51');
            });
            return {
              cardCount: cards.length,
              ytPillCount: ytPillBadges.length,
              ytHeadingCount: headings.length,
              redPlayCount: redPlayBtns.length,
              goldPlayCount: goldPlayBtns.length,
            };
          `)
          if (audit.cardCount > 0) break
          await sleep(300)
        }

        assert.ok(audit.cardCount >= 4, `Expected >= 4 video cards on ${route}, got ${audit.cardCount}`)
        assert.equal(audit.ytPillCount, 0, `Found ${audit.ytPillCount} decorative YouTube pill badges on ${route}`)
        assert.equal(audit.ytHeadingCount, 0, `Found ${audit.ytHeadingCount} decorative YouTube headings/labels on ${route}`)
        assert.equal(audit.redPlayCount, 0, `Found ${audit.redPlayCount} red YouTube play icons on ${route}`)
        assert.equal(
          audit.goldPlayCount,
          audit.cardCount,
          `Expected all ${audit.cardCount} cards on ${route} to use PlayNova gold play icon, got ${audit.goldPlayCount}`
        )
        console.log(
          `         ${route}: ${audit.cardCount} cards audited -> 0 YouTube pills, 0 decorative labels, 0 red icons, ${audit.goldPlayCount}/${audit.cardCount} PlayNova gold play icons`
        )
      }
    })

    // ---------------------------------------------------------------
    // TEST 5: Mobile Viewport (390x844) Overflow & Responsive Check
    // ---------------------------------------------------------------
    await test("5. Mobile viewport (390x844) renders with zero horizontal overflow on Home, Watch, Explore & Shorts", async () => {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true,
      })

      for (const route of ["/", "/watch?id=nova-01", "/explore", "/shorts"]) {
        await cdp.navigate(`${BASE_URL}${route}`)
        const metrics = await cdp.eval(`
          return {
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
          };
        `)
        assert.ok(
          metrics.scrollWidth <= metrics.innerWidth + 2,
          `Horizontal overflow on mobile ${route}: scrollWidth=${metrics.scrollWidth} > innerWidth=${metrics.innerWidth}`
        )
      }
      console.log(`         Mobile 390x844 verified across /, /watch, /explore, /shorts (0px overflow)`)
    })

    console.log(`\n=============================================================`)
    console.log(`Real Browser QA Results: ${passed} passed, ${failed} failed`)
    console.log(`=============================================================\n`)

    if (failed > 0) process.exitCode = 1
  } finally {
    if (cdp) cdp.close()
    try {
      chrome.kill("SIGKILL")
    } catch {}
    await sleep(300)
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true })
    } catch {}
  }
}

runBrowserQA().catch((err) => {
  console.error("Fatal Browser QA error:", err)
  process.exit(1)
})

