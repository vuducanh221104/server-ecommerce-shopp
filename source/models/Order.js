import { Schema, Types, model } from "mongoose";

// ShippingAddress schema (embedded)
const ShippingAddressSchema = new Schema(
  {
    full_name: { type: String, required: true },
    phone_number: { type: String, required: true },
    street: { type: String, required: true },
    ward: { type: String, required: true },
    district: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true, default: "Vietnam" },
  },
  { _id: false, timestamps: true }
);

// OrderItem schema (embedded)
const OrderItemSchema = new Schema(
  {
    product_id: { type: Types.ObjectId, ref: "Product", required: true },
    priceOrder: { type: Number, required: true },
    quantity: { type: Number, required: true },
    colorOrder: { type: String },
    sizeOrder: { type: String },
  },
  { _id: true, timestamps: true }
);

// Payment schema (embedded)
const PaymentSchema = new Schema(
  {
    method: {
      type: String,
      required: true,
      enum: ["COD", "BANK_TRANSFER", "CREDIT_CARD", "MOMO", "ZALOPAY"],
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    transaction_id: { type: String },
    payment_date: { type: Date },
  },
  { _id: false, timestamps: true }
);

const OrderSchema = new Schema(
  {
    user_id: { type: Types.ObjectId, ref: "User" }, // Optional for guest checkout
    customer_email: { type: String, required: true },

    // Embedded items array
    items: [OrderItemSchema],

    // Embedded shipping address
    shipping_address: { type: ShippingAddressSchema, required: true },

    // Embedded payment information
    payment: { type: PaymentSchema, required: true },

    total_amount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
      ],
      default: "PENDING",
      required: true,
    },
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

// Index for faster lookups
OrderSchema.index({ user_id: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ "items.product_id": 1 });

export const Order = model("Order", OrderSchema);
