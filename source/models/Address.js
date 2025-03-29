import { Schema, model } from "mongoose";

const AddressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    district: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "Addresses",
  }
);
const Address = model("Address", AddressSchema);
export default Address;
