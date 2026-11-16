import mongoose, { Document, Schema } from "mongoose"

export interface IVideo extends Document {
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  duration: number // Duration in seconds
  category: "Technology" | "Education" | "Nature" | "Science" | "Space" | "Entertainment"
  views: number
  featured: boolean
  quality: string[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const VideoSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    duration: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ["Technology", "Education", "Nature", "Science", "Space", "Entertainment"],
      default: "Technology",
    },
    views: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    quality: { type: [String], default: ["1080p", "720p", "480p"] },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
)

export const Video = mongoose.model<IVideo>("Video", VideoSchema)

