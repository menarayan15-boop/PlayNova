import mongoose, { Document, Schema } from "mongoose"

export interface IWatchProgress extends Document {
  userId: mongoose.Types.ObjectId
  videoId: mongoose.Types.ObjectId
  progressSeconds: number
  totalDuration: number
  completed: boolean
  lastWatchedAt: Date
}

const WatchProgressSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    videoId: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    progressSeconds: { type: Number, required: true, default: 0 },
    totalDuration: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    lastWatchedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
)

export const WatchProgress = mongoose.model<IWatchProgress>("WatchProgress", WatchProgressSchema)

