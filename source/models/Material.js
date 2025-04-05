import { model, Schema, Types } from "mongoose";

const MaterialSchema = new Schema(
  {
    parent_id: {
      type: Types.ObjectId,
      ref: "Material",
      default: null,
    },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
    collection: "Materials",
  }
);

export const Material = model("Material", MaterialSchema);
