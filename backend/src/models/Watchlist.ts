import mongoose, { Document, Schema } from "mongoose"

export interface IWatchlist extends Document {
  userId: string
  videoId: string
  addedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface WatchlistDTO {
  id: string
  userId: string
  videoId: string
  addedAt: string
}

const WatchlistSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    videoId: { type: String, required: true, index: true },
    addedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
)

// Ensure compound unique index so a user cannot duplicate a video in their watchlist
WatchlistSchema.index({ userId: 1, videoId: 1 }, { unique: true })
WatchlistSchema.index({ userId: 1, addedAt: -1 })

export const Watchlist = mongoose.model<IWatchlist>("Watchlist", WatchlistSchema)
