import e from "express";
import { Schema, Types, model } from "mongoose";

const CommentSchema = new Schema(
  {
    user_id: { type: Types.ObjectId, ref: "User", required: true },
    product_id: { type: Types.ObjectId, ref: "Product", required: true },
    user_name: { type: String, required: true },
    content: { type: String, required: true },
    rating: { type: Number, required: true },
    status: { type: Number, required: true },
    likes: [{ type: Types.ObjectId, ref: "User" }],
    issues: [{ type: String }],
    replies: [{ type: Types.ObjectId, ref: "Comment" }],
  },
  {
    timestamps: true,
    collection: "Comments",
  }
);
const Comment = model("Comment", CommentSchema);
export default Comment;
