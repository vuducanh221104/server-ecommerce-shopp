import { Schema, model, Types } from "mongoose";

const CategorySchema = new Schema(
  {
    parent_id: {
      type: Types.ObjectId,
      ref: "Category",
      default: null,
    },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
    collection: "Categories",
  }
);

const Category = model("Category", CategorySchema);
export default Category;
