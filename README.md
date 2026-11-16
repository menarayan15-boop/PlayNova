# PlayNova — Phase 1

> **A Smarter Way to Watch.**

PlayNova is a modern HTML5 video streaming platform built with Next.js (App Router), TypeScript, Tailwind CSS, GSAP ScrollTrigger, Zustand, Express.js, and MongoDB Atlas.

Its visual architecture is adapted from the premium editorial design language of the Treasury Fintech template (designed on cream paper with deep teal typography, olive-gold accents, and lilac secondary highlights), completely redesigned from the ground up for video streaming.

---

## 1. Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Library:** React 18, TypeScript
- **Styling:** Tailwind CSS with custom palette configuration
- **Animation:** GSAP 3.12 & ScrollTrigger
- **Player State:** Zustand
- **Media Engine:** HTML5 Video API (with architecture ready for HLS.js)

### Backend
- **Server:** Node.js & Express.js (ES Modules, TypeScript)
- **Architecture:** Modular (Config, Controllers, Routes, Models, Middleware, Services, Utils)
- **Database:** MongoDB Atlas with Mongoose
- **API Protocol:** REST (JSON) with CORS support

---

## 2. Phase 1 Features

### Homepage Experience
1. **Sticky Frosted Navigation:**
   - PlayNova logo combining modern geometric play badge and wordmark
   - Dynamic top-level links: Home, Explore, Features, About, Sign In, Get Started
   - Gold scroll progress indicator along the bottom
   - Frosted glass backdrop-blur transition upon scroll
   - Animated mobile drawer menu

2. **Editorial Hero Section:**
   - Masked animated headline reveal: *"Your Videos. Your Experience."*
   - 3D perspective device frame tilted at `22deg` that smoothly straightens to `0deg` on scroll
   - Embedded real, working HTML5 Video Player inside the device frame
   - Parallax animated floating cards:
     - **Card 1: Continue Watching** (video title, progress tracker, progress bar)
     - **Card 2: Smart Playback** (speed 1.5x, 4K UHD 60fps, subtitles, enhanced audio)

3. **Reusable Basic HTML5 Video Player (`VideoPlayer.tsx`):**
   - Native browser controls disabled
   - Play / Pause button
   - Volume slider with mute/unmute toggle
   - Interactive progress bar with hover timestamp preview and scrub support
   - Current playback time & total video duration counters
   - Forward 10s and Rewind 10s seeking buttons
   - Full-screen button utilizing the HTML5 Fullscreen API
   - Buffering spinner and error fallback overlay with retry option
   - Pure client-side state synchronized through Zustand

4. **GSAP Sticky Feature Stage:**
   - Desktop: Sticky visual stage morphing across 3 feature scenes:
     - **Scene 1 — Total Playback Control:** Simulated audio waveform, seeker cursor, and play/pause controls.
     - **Scene 2 — Watch Your Way:** Interactive demonstration of Fullscreen, Theater Mode, and Picture-in-Picture.
     - **Scene 3 — Never Lose Your Progress:** Multi-device session continuity demonstration across MacBook, iPad, and Phone.
   - Mobile: Responsive stacked presentation of feature scenes.

5. **Video Showcase Section:**
   - Filterable video gallery by category (All, Space, Nature, Technology, Science, Education, Entertainment)
   - Video cards with duration badges, view counts, hover play actions, and responsive layout
   - Clicking videos opens the player on the dedicated watch page

6. **Benefits Section:**
   - Headline: *"More Control. Better Viewing. Zero Distractions."*
   - Statement text with scrubbed word-by-word ink reveal animation
   - Benefit cards: Seamless Playback, Personalized Experience, Watch Anywhere
   - Performance metrics counters with expanding rule animations

7. **Call-to-Action Section:**
   - Interactive pointer-following glow blobs powered by GSAP `quickTo`
   - Gradient backing with grain texture
   - Direct action buttons navigating to active player and explore channels

8. **Footer:**
   - Logo, tagline, navigation columns, and social links
   - Required MIT license attribution
   - Oversized animated `PLAYNOVA` footer wordmark rising on scroll

---

## 3. Project Structure

```
PlayNova/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with Navbar & Footer
│   │   ├── page.tsx           # Homepage assembling all sections
│   │   ├── explore/page.tsx   # Video channels & explore gallery
│   │   ├── watch/page.tsx     # Dedicated watch page with HTML5 player
│   │   ├── privacy/page.tsx   # Draft privacy notice
│   │   ├── terms/page.tsx     # Draft terms of service
│   │   └── globals.css        # Global CSS & Tailwind configuration
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── player/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── PlayerControls.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── sections/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── VideoShowcase.tsx
│   │   │   ├── BenefitsSection.tsx
│   │   │   └── CtaSection.tsx
│   │   └── ui/
│   │       ├── PlayNovaLogo.tsx
│   │       ├── FloatingCard.tsx
│   │       └── VideoCard.tsx
│   ├── hooks/
│   │   └── useReducedMotion.ts
│   ├── stores/
│   │   └── usePlayerStore.ts
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── public/
│   │   ├── favicon.svg
│   │   └── ...
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts         # Environment validation
│   │   │   └── db.ts          # MongoDB connection with status tracking
│   │   ├── controllers/
│   │   │   ├── healthController.ts
│   │   │   └── videoController.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   └── validateRequest.ts
│   │   ├── models/
│   │   │   ├── Video.ts       # Phase 1 Mongoose schema
│   │   │   ├── User.ts        # Phase 2 foundation
│   │   │   └── WatchProgress.ts # Phase 2 foundation
│   │   ├── routes/
│   │   │   ├── healthRoutes.ts
│   │   │   └── videoRoutes.ts
│   │   ├── services/
│   │   │   └── videoService.ts
│   │   ├── utils/
│   │   │   └── logger.ts
│   │   ├── app.ts             # Express app setup & CORS
│   │   └── server.ts          # Server entry point
│   ├── tsconfig.json
│   └── package.json
├── LICENSE
└── README.md
```

---

## 4. Running the Project Locally

### Prerequisites
- Node.js v18+ (tested with Node v24)
- npm or pnpm

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
Health endpoint will be available at [http://localhost:5000/api/health](http://localhost:5000/api/health).

---

## 5. Verification Commands

### Frontend Verification
```bash
cd frontend
npm run typecheck   # Validates all TypeScript types
npm run build       # Creates optimized Next.js production bundle
```

### Backend Verification
```bash
cd backend
npm run typecheck   # Validates backend TypeScript types
npm run build       # Compiles TypeScript into dist/
```

---

## 6. Deployment Preparation

### Frontend (Vercel)
- **Framework Preset:** Next.js
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL` (URL of deployed backend, e.g. `https://playnova-api.onrender.com`)

### Backend (Render)
- **Environment:** Node
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `PORT`: `5000`
  - `NODE_ENV`: `production`
  - `FRONTEND_URL`: (URL of deployed frontend, e.g. `https://playnova.vercel.app`)
  - `MONGODB_URI`: (MongoDB Atlas connection string)

---

## 7. Deferred to Phase 2 (Waiting for User Approval)
- User authentication & session cookies (JWT / OAuth)
- Watch history sync & automatic resume across user accounts
- Dynamic HLS streaming (`.m3u8` playlists via HLS.js)
- Cloudinary video upload & transcoding pipelines
- Theater mode & Picture-in-Picture window management
- Timeline preview thumbnails on hover
- Keyboard shortcuts modal
- Video recommendation algorithm
- Multi-quality bitrate selector

