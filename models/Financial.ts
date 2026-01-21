import mongoose, { Schema, models } from "mongoose";

const FinancialSchema = new Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      index: true,
    },

    // ✅ new: only two categories
    type: {
      type: String,
      required: true,
      enum: ["mfs", "bank"],
    },

    // ✅ for mfs: bkash/nagad/rocket/upay/paypal/stripe/other
    provider: {
      type: String,
      default: "",
      trim: true,
    },

    // ✅ flexible structured fields
    fields: {
      type: Schema.Types.Mixed,
      default: {},
    },

    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

FinancialSchema.index({ profileId: 1, order: 1 });

export default models.Financial || mongoose.model("Financial", FinancialSchema);
