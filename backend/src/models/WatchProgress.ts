import mongoose, { Document, Schema } from "mongoose"

export interface IWatchProgress extends Document {
  userId: string
  videoId: string
  lastPositionSeconds: number
  durationSeconds: number
  furthestPositionSeconds: number
  watchedIntervals: [number, number][]
  completionPercentage: number
  isCompleted: boolean
  firstWatchedAt: Date
  lastWatchedAt: Date
  completedAt: Date | null
  version: number
  createdAt: Date
  updatedAt: Date
}

export interface WatchProgressDTO {
  id: string
  userId: string
  videoId: string
  lastPositionSeconds: number
  durationSeconds: number
  furthestPositionSeconds: number
  watchedIntervals: [number, number][]
  completionPercentage: number
  isCompleted: boolean
  firstWatchedAt: string
  lastWatchedAt: string
  completedAt: string | null
  version: number
}

/**
 * Merges overlapping and adjacent intervals into a canonical disjoint interval list
 */
export function mergeIntervals(intervals: [number, number][]): [number, number][] {
  if (!intervals || intervals.length <= 1) return intervals || []

  // Filter out invalid intervals where end <= start
  const valid = intervals
    .map(([s, e]) => [Math.max(0, s), Math.max(0, e)] as [number, number])
    .filter(([s, e]) => e > s)

  if (valid.length <= 1) return valid

  const sorted = [...valid].sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]

    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1])
    } else {
      merged.push(current)
    }
  }

  return merged
}

/**
 * Calculates actual unique coverage seconds from intervals
 */
export function calculateUniqueCoverageSeconds(intervals: [number, number][]): number {
  const merged = mergeIntervals(intervals)
  return merged.reduce((acc, [start, end]) => acc + (end - start), 0)
}

const WatchProgressSchema = new Schema<IWatchProgress>(
  {
    userId: { type: String, required: true, index: true },
    videoId: { type: String, required: true, index: true },
    lastPositionSeconds: { type: Number, required: true, min: 0, default: 0 },
    durationSeconds: { type: Number, required: true, min: 0 },
    furthestPositionSeconds: { type: Number, default: 0, min: 0 },
    watchedIntervals: {
      type: [[Number]],
      default: [],
    },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    isCompleted: { type: Boolean, default: false, index: true },
    firstWatchedAt: { type: Date, default: Date.now },
    lastWatchedAt: { type: Date, default: Date.now, index: true },
    completedAt: { type: Date, default: null },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
)

// Ensure compound unique index so a user has at most one record per video
WatchProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true })
WatchProgressSchema.index({ userId: 1, lastWatchedAt: -1 })
WatchProgressSchema.index({ userId: 1, isCompleted: 1 })

export const WatchProgress = mongoose.model<IWatchProgress>("WatchProgress", WatchProgressSchema)
