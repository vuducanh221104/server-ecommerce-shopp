import { Schema, Types, model } from "mongoose";

// Address schema (embedded)
const AddressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

// RefreshToken schema (embedded)
const RefreshTokenSchema = new Schema(
  {
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    isRevoked: { type: Boolean, default: false },
    ipAddress: { type: String },
    userAgent: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Create an index for the token field for faster lookups
// This accomplishes similar functionality to the unique constraint in the original

// Cart item schema (embedded)
const CartItemSchema = new Schema(
  {
    product_id: { type: Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, default: 1 },
    sizeOrder: { type: String, required: true },
    colorOrder: { type: String, required: true },
  },
  { _id: true, timestamps: true }
);

// Wishlist item schema (embedded)
const WishlistItemSchema = new Schema(
  {
    product_id: { type: Types.ObjectId, ref: "Product", required: true },
    category_id: { type: Types.ObjectId, ref: "Category" },
    name: { type: String, required: true },
    thumb: { type: String },
    price: { type: Number, required: true },
    category_name: { type: String },
    color: { type: String },
    size: { type: String },
  },
  { _id: true, timestamps: true }
);

const UserSchema = new Schema(
  {
    username: { type: String, unique: true },
    fullName: { type: String },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    type: {
      type: String,
      enum: ["WEBSITE", "GOOGLE", "FACEBOOK", "local"],
      required: true,
      default: "WEBSITE",
    },
    role: {
      type: Number,
      enum: [0, 1, 2],
      required: true,
      default: 0,
    },
    gender: { type: String, default: "male" },
    phoneNumber: { type: String },
    addresses: [AddressSchema],
    avatar: { type: String },
    dateOfBirth: { type: Date },
    refreshTokens: [RefreshTokenSchema],
    cart: [CartItemSchema],
    wishlist: [WishlistItemSchema],
    orders: [{ type: Types.ObjectId, ref: "Order" }],
    status: {
      type: Number,
      enum: [0, 1, 2],
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: "Users",
  }
);

// Index for faster token lookups in the embedded array
UserSchema.index({ "refreshTokens.token": 1 });

export const User = model("User", UserSchema);
