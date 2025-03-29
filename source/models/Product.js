import { Schema, Types, model } from "mongoose";

const ProductSchema = new Schema(
  {
    product_type_id: { type: Types.ObjectId, required: true },
    material_id: {
      type: Types.ObjectId,
      ref: "Material",
      required: true,
    },
    category_id: {
      type: Types.ObjectId,
      ref: "Category",
      required: true,
    },
    order_id: {
      type: Types.ObjectId,
      ref: "Order",
    },
    name: { type: String, required: true },
    price: { type: Types.ObjectId, ref: "Price", required: true },
    thumb: { type: String, required: true },
    variants: [{ type: Types.ObjectId, ref: "Variant", required: true }],
    total_quantity: { type: Number, required: true },
    total_star: { type: Number, default: 0 },
    comment: [{ type: Types.ObjectId, ref: "Comment" }],
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
    collection: "Products",
  }
);

const Product = model("Product", ProductSchema);
export default Product;
