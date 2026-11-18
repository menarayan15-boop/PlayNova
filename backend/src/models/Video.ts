import mongoose, { Document, Schema } from "mongoose"

export type VideoCategoryType =
  | "Gaming"
  | "Music"
  | "Movies and Trailers"
  | "Entertainment"
  | "Comedy"
  | "Technology"
  | "AI and Programming"
  | "Science"
  | "Space"
  | "Nature"
  | "Travel and Vlogs"
  | "Food and Cooking"
  | "Fitness"
  | "Sports"
  | "Podcasts"
  | "Education"
  | "News"
  | "Documentaries"
  | "Short Videos"

export const VALID_VIDEO_CATEGORIES: VideoCategoryType[] = [
  "Gaming",
  "Music",
  "Movies and Trailers",
  "Entertainment",
  "Comedy",
  "Technology",
  "AI and Programming",
  "Science",
  "Space",
  "Nature",
  "Travel and Vlogs",
  "Food and Cooking",
  "Fitness",
  "Sports",
  "Podcasts",
  "Education",
  "News",
  "Documentaries",
  "Short Videos",
]

export type VideoSourceType = "native" | "youtube"

export type VideoPublicationStatus =
  | "published"
  | "draft"
  | "archived"
  | "duplicate_archived"
  | "broken"

export type VideoValidationStatus = "verified" | "pending" | "failed"

export interface IVideoValidationDetails {
  httpStatus?: number
  contentType?: string
  supportsRange?: boolean
  hasValidMediaHeader?: boolean
  thumbnailOk?: boolean
  contentLength?: number
  error?: string
}

export interface IVideo extends Document<string> {
  _id: string
  title: string
  description: string
  videoUrl: string
  normalizedSourceUrl: string
  sourceType: VideoSourceType
  externalVideoId?: string
  sourceKey?: string
  channelTitle?: string
  channelId?: string
  embeddable: boolean
  isShortForm: boolean
  publishedAt?: Date
  lastSyncedAt?: Date
  thumbnailUrl: string
  duration: number // Duration in seconds
  category: VideoCategoryType
  categories: VideoCategoryType[]
  views: number
  featured: boolean
  quality: string[]
  tags: string[]
  sourceProvider: string
  sourceAttribution: string
  license: string
  status: VideoPublicationStatus
  duplicateOf?: string
  validationStatus: VideoValidationStatus
  validatedAt?: Date
  validationDetails?: IVideoValidationDetails
  createdAt: Date
  updatedAt: Date
}

const VideoSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 220 },
    description: { type: String, required: true, maxlength: 2500 },
    videoUrl: { type: String, required: true, trim: true },
    normalizedSourceUrl: { type: String, trim: true, index: true },
    sourceType: {
      type: String,
      enum: ["native", "youtube"],
      default: "native",
      index: true,
    },
    externalVideoId: {
      type: String,
      trim: true,
      default: undefined,
    },
    sourceKey: { type: String, trim: true },
    channelTitle: { type: String, trim: true, default: undefined },
    channelId: { type: String, trim: true, default: undefined },
    embeddable: { type: Boolean, default: true },
    isShortForm: { type: Boolean, default: false },
    publishedAt: { type: Date, default: undefined },
    lastSyncedAt: { type: Date, default: undefined },
    thumbnailUrl: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: VALID_VIDEO_CATEGORIES,
      default: "Technology",
    },
    categories: {
      type: [String],
      enum: VALID_VIDEO_CATEGORIES,
      default: undefined,
    },
    views: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    quality: { type: [String], default: ["1080p", "720p"] },
    tags: { type: [String], default: [] },
    sourceProvider: { type: String, default: "PlayNova Catalog", trim: true },
    sourceAttribution: { type: String, default: "PlayNova", trim: true },
    license: { type: String, default: "Public Domain / Open License", trim: true },
    status: {
      type: String,
      enum: ["published", "draft", "archived", "duplicate_archived", "broken"],
      default: "published",
    },
    duplicateOf: { type: String, default: undefined },
    validationStatus: {
      type: String,
      enum: ["verified", "pending", "failed"],
      default: "pending",
    },
    validatedAt: { type: Date, default: undefined },
    validationDetails: {
      type: {
        httpStatus: Number,
        contentType: String,
        supportsRange: Boolean,
        hasValidMediaHeader: Boolean,
        thumbnailOk: Boolean,
        contentLength: Number,
        error: String,
      },
      _id: false,
      default: undefined,
    },
  },
  {
    timestamps: true,
    _id: false, // Custom string _id support
  }
)

// Normalize source URL and ensure categories array stays populated before save
VideoSchema.pre("save", function (next) {
  const doc = this as unknown as IVideo
  if (doc.videoUrl && !doc.normalizedSourceUrl) {
    doc.normalizedSourceUrl = doc.videoUrl.trim().toLowerCase().replace(/^http:\/\//, "https://")
  }
  if (!doc.categories || doc.categories.length === 0) {
    doc.categories = [doc.category]
  } else if (!doc.categories.includes(doc.category)) {
    doc.categories = [doc.category, ...doc.categories]
  }
  next()
})

// Canonical deduplication indexes
// Unique compound partial index on (sourceType, externalVideoId) for YouTube and external sources
VideoSchema.index(
  { sourceType: 1, externalVideoId: 1 },
  {
    unique: true,
    partialFilterExpression: { externalVideoId: { $type: "string" } },
  }
)
VideoSchema.index({ sourceKey: 1 }, { unique: true, sparse: true })
VideoSchema.index({ status: 1, category: 1, views: -1, _id: 1 })
VideoSchema.index({ status: 1, categories: 1, createdAt: -1, _id: 1 })
VideoSchema.index({ status: 1, featured: -1, views: -1, _id: 1 })
VideoSchema.index({ status: 1, createdAt: -1, _id: 1 })
VideoSchema.index({ status: 1, views: -1, _id: 1 })
VideoSchema.index({ title: "text", description: "text", tags: "text" })
VideoSchema.index({ duration: 1 })

export const Video = mongoose.model<IVideo>("Video", VideoSchema)
