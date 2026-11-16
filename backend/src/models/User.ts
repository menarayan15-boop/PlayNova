import mongoose, { Document, Schema } from "mongoose"

export interface IUser extends Document {
  email: string
  name: string
  avatar?: string
  role: "user" | "admin"
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    avatar: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  {
    timestamps: true,
  }
)

export const User = mongoose.model<IUser>("User", UserSchema)

