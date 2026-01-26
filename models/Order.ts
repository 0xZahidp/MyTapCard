import mongoose, { Schema, models } from "mongoose";

const OrderSchema = new Schema(
  {
    // user identity (simple + stable)
    userEmail: { type: String, required: true, lowercase: true, trim: true },

    // items (snapshot prices, not dynamic)
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        sku: { type: String, required: true },
        unitPrice: { type: Number, required: true },
        qty: { type: Number, required: true, min: 1 },
        image: { type: String, default: "" }, // main image snapshot
      },
    ],

    currency: { type: String, default: "BDT" },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: "" },
    total: { type: Number, required: true, min: 0 },

    paymentProvider: { type: String, enum: ["", "binance", "uddokta"], default: "" },
    paymentStatus: { type: String, enum: ["unpaid", "pending", "paid", "failed", "refunded"], default: "unpaid" },
    paymentRef: { type: String, default: "" },

    fulfillmentStatus: {
      type: String,
      enum: ["created", "printing", "packaging", "shipped", "delivered", "cancelled"],
      default: "created",
    },

    timeline: [
      {
        at: { type: Date, default: Date.now },
        status: { type: String, default: "" },
        note: { type: String, default: "" },
        byAdminEmail: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

export default models.Order || mongoose.model("Order", OrderSchema);
