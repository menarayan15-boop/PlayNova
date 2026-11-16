import { Request, Response } from "express"
import { getDatabaseStatus } from "../config/db.js"

export function getHealth(req: Request, res: Response) {
  const dbStatus = getDatabaseStatus()

  // Primary mandated response shape
  res.status(200).json({
    status: "ok",
    service: "PlayNova API",
    database: {
      connected: dbStatus.connected,
      configured: dbStatus.configured,
      message: dbStatus.message,
    },
    timestamp: new Date().toISOString(),
  })
}

