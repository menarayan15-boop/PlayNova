import { Request, Response, NextFunction } from "express"

export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const page = parseInt(req.query.page as string, 10)
  const limit = parseInt(req.query.limit as string, 10)

  if (req.query.page && (isNaN(page) || page < 1)) {
    return res.status(400).json({ status: "error", message: "Page must be a positive integer" })
  }

  if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 50)) {
    return res.status(400).json({ status: "error", message: "Limit must be between 1 and 50" })
  }

  next()
}

