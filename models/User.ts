import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // ✅ allow OAuth users (no password needed)
    password: { type: String, default: "", select: false },

    avatar: { type: String, default: "" },

    // ✅ forgot-password fields
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

export default models.User || mongoose.model("User", UserSchema);
