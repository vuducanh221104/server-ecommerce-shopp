import { Schema, model, Types } from "mongoose";

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: {
      type: String,
      enum: ["WEBSITE", "GOOGLE", "FACEBOOK"],
      required: true,
    },
    role: { type: Number, enum: [0, 1, 2], required: true },
    gender: { type: String },
    phone_number: { type: String },
    address: { type: String },
    avatar: { type: String },
    dateOfBirth: { type: String },
    status: { type: Number, enum: [0, 1, 2], required: true },
    wishlist: [{ type: Types.ObjectId, ref: "Wishlist" }],
    cart: [{ type: Types.ObjectId, ref: "Cart" }],
  },
  {
    timestamps: true,
    collection: "Users",
  }
);

const User = model("User", UserSchema);
export default User;
