import mongoose, { Document, Schema } from "mongoose"

export interface INotification extends Document {
  userId: string
  title: string
  message: string
  type: "recommendation" | "category" | "watchlist" | "system"
  link?: string
  read: boolean
  createdAt: Date
  updatedAt: Date
}

export interface NotificationDTO {
  id: string
  userId: string
  title: string
  message: string
  type: "recommendation" | "category" | "watchlist" | "system"
  link?: string
  read: boolean
  createdAt: string
}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["recommendation", "category", "watchlist", "system"],
      default: "system",
    },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
)

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 })
NotificationSchema.index({ userId: 1, createdAt: -1 })

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema)

