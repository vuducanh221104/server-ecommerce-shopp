import { Schema, Types, model } from "mongoose";

const cartSchema = new Schema(
  {
    product_id: { type: Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    thumb: { type: String },
    slug: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    color: { type: String },
    size: { type: String },
  },
  {
    timestamps: true,
    collection: "Carts",
  }
);

const Cart = model("Cart", cartSchema);
export default Cart;
