import { Schema, Types, model } from "mongoose";

const WishlistSchema = new Schema(
  {
    product_id: {
      type: Types.ObjectId,
      ref: "Product",
      required: true,
    },
    category_id: {
      type: Types.ObjectId,
      ref: "Category",
      required: true,
    },
    name: { type: String, required: true },
    thumb: { type: String },
    price: { type: Number, required: true },
    category_name: { type: String },
    color: { type: String },
    size: { type: String },
  },
  {
    timestamps: true,
    collection: "Wishlists",
  }
);

const Wishlist = model("Wishlist", WishlistSchema);
export default Wishlist;
