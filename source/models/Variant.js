import { Schema, model, Types } from "mongoose";

const VariantSchema = new Schema(
  {
    color: { type: String, required: true },
    sizes: [{ type: Types.ObjectId, ref: "Size", required: true }],
    images: { type: [String], required: true },
  },
  {
    timestamps: true,
    collection: "Variants",
  }
);

const Variant = model("Variant", VariantSchema);
export default Variant;
