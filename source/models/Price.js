import { Schema, Types, model } from "mongoose";

const PriceSchema = new Schema(
  {
    original: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    discount_quantity: { type: Number, default: 0 },

    currency: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "Prices",
  }
);

const Price = model("Price", PriceSchema);
export default Price;
