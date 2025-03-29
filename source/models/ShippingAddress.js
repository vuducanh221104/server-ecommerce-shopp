import { Schema, Types, model } from "mongoose";

const ShippingAddressSchema = new Schema(
  {
    full_name: { type: String, required: true },
    phone_number: { type: String, required: true },
    street: { type: String, required: true },
    ward: { type: String, required: true },
    district: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
  },
  {
    collection: "ShippingAddresses",
  }
);

const ShippingAddress = model("ShippingAddress", ShippingAddressSchema);
export default ShippingAddress;
