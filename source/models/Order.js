import { Schema, Types, model } from "mongoose";

const OrderSchema = new Schema(
  {
    user_id: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    customer_email: { type: String, required: true },
    products: [{ type: Types.ObjectId, ref: "Product", required: true }],
    shipping_address: {
      type: Types.ObjectId,
      ref: "ShippingAddress",
      required: true,
    },
    payment_method: { type: String, required: true },
    total_amount: { type: Number, required: true },
    status: { type: String, required: true },
    notes: { type: String },
    admin_notes: { type: String },
    delivery_partner: { type: String },
    tracking_code: { type: String },
    estimated_delivery_date: { type: Date },
  },
  {
    timestamps: true,
    collection: "Orders",
  }
);

const Order = model("Order", OrderSchema);
export default Order;
