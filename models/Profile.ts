import mongoose, { Schema, models } from "mongoose";

const ProfileSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ONE profile per user (creates index)
    },

    username: {
      type: String,
      required: true,
      unique: true, // public URL (creates index)
      lowercase: true,
      trim: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },

    avatar: {
      type: String,
      default: "",
      trim: true,
    },

    showFinancialTab: {
      type: Boolean,
      default: true,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default models.Profile || mongoose.model("Profile", ProfileSchema);
