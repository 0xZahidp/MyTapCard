import mongoose, { Schema, models } from "mongoose";

const LinkGroupSchema = new Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LinkGroupSchema.index({ profileId: 1, order: 1 });

export default models.LinkGroup || mongoose.model("LinkGroup", LinkGroupSchema);
