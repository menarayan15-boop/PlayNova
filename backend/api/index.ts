import { createApp } from "../src/app.js"
import { connectDB } from "../src/config/db.js"
import { VideoService } from "../src/services/videoService.js"

const app = createApp()

let isInitialized = false

/**
 * Vercel Serverless Function handler for PlayNova Express API.
 * Reuses Mongoose connection across warm invocations without persistent listener.
 */
export default async function handler(req: any, res: any) {
  if (!isInitialized) {
    try {
      await connectDB()
      await VideoService.ensureSeedVideos()
      isInitialized = true
    } catch (err) {
      console.error("[Serverless Init Error]", err)
    }
  } else {
    // Fast path: verifies cached mongoose connection state
    await connectDB()
  }

  return app(req, res)
}
