import mongoose, { Schema, models } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    expiresAt: {
      type: Date,
      default: null, // null = lifetime / manual control
    },
  },
  { timestamps: true }
);

export default models.Subscription ||
  mongoose.model("Subscription", SubscriptionSchema);
