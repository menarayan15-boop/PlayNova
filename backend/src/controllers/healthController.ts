import { Request, Response } from "express"
import { getDatabaseStatus } from "../config/db.js"
import { getRuntimeMetrics } from "../utils/metrics.js"

export function getHealth(_req: Request, res: Response) {
  const dbStatus = getDatabaseStatus()
  const metrics = getRuntimeMetrics()

  res.status(200).json({
    status: "ok",
    service: "PlayNova API",
    uptimeSeconds: metrics.uptimeSeconds,
    database: {
      connected: dbStatus.connected,
      configured: dbStatus.configured,
      message: dbStatus.message,
      databaseName: dbStatus.databaseName,
      host: dbStatus.host,
    },
    timestamp: new Date().toISOString(),
  })
}

export function getHealthMetrics(_req: Request, res: Response) {
  const dbStatus = getDatabaseStatus()
  const metrics = getRuntimeMetrics()

  res.status(200).json({
    status: "success",
    data: {
      service: "PlayNova API",
      database: {
        connected: dbStatus.connected,
        databaseName: dbStatus.databaseName,
      },
      metrics,
      timestamp: new Date().toISOString(),
    },
  })
}
