import mongoose, { Schema, models } from "mongoose";

const LinkSchema = new Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      index: true,
    },

    // ✅ still supports old: url/phone/email
    // ✅ adds new: sms/social/messaging/video/vcard
    type: {
      type: String,
      enum: ["url", "phone", "email", "sms", "social", "messaging", "video", "vcard"],
      required: true,
    },

    // ✅ group support (null/undefined means "no group")
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LinkGroup",
      default: null,
      index: true,
    },

    // ✅ platform support (whatsapp/telegram/facebook/x/instagram/linkedin etc)
    platform: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },

    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    value: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ optional behavior flags / extra info
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },

    order: {
      type: Number,
      default: 0,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

LinkSchema.index({ profileId: 1, groupId: 1, order: 1 });

export default models.Link || mongoose.model("Link", LinkSchema);
