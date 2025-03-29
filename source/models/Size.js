import { Schema, model } from "mongoose";

const SizeSchema = new Schema(
  {
    size: { type: String, required: true },
    stock: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: "Sizes",
  }
);
const Size = model("Size", SizeSchema);
export default Size;
