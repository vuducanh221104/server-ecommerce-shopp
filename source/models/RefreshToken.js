import { Schema, model, Types } from "mongoose";

const RefreshTokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "RefreshTokens",
  }
);

// Không cần khai báo index riêng nữa vì đã khai báo trong schema field

const RefreshToken = model("RefreshToken", RefreshTokenSchema);
export default RefreshToken;
