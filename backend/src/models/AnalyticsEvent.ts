import mongoose, { Document, Schema } from "mongoose"

export type AnalyticsEventType = "view" | "watch_time" | "complete" | "playback_error"

export interface IAnalyticsEvent extends Document {
  videoId: string
  eventType: AnalyticsEventType
  sessionKey: string
  userId?: string
  watchSeconds: number
  completionPercentage: number
  errorMessage?: string
  createdAt: Date
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    videoId: {
      type: String,
      required: true,
      index: true,
      maxlength: 64,
    },
    eventType: {
      type: String,
      enum: ["view", "watch_time", "complete", "playback_error"],
      required: true,
      index: true,
    },
    sessionKey: {
      type: String,
      required: true,
      maxlength: 128,
    },
    userId: {
      type: String,
      default: undefined,
    },
    watchSeconds: {
      type: Number,
      default: 0,
      min: 0,
      max: 7200,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    errorMessage: {
      type: String,
      maxlength: 200,
      default: undefined,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

// Compound indexes for aggregation pipelines and view deduplication
AnalyticsEventSchema.index({ createdAt: -1 })
AnalyticsEventSchema.index({ videoId: 1, eventType: 1, createdAt: -1 })
AnalyticsEventSchema.index({ sessionKey: 1, videoId: 1, eventType: 1, createdAt: -1 })

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>("AnalyticsEvent", AnalyticsEventSchema)

