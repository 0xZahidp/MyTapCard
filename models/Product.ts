import mongoose, { Schema, models } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "", trim: true },

    // ✅ up to 3 images (store links)
    images: { type: [String], default: [] },

    currency: { type: String, default: "BDT" },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ safety: enforce max 3 on create/save (NO next callback)
ProductSchema.pre("save", async function () {
  const self: any = this;
  if (Array.isArray(self.images) && self.images.length > 3) {
    self.images = self.images.slice(0, 3);
  }
});

// ✅ safety: enforce max 3 on updates (findOneAndUpdate / findByIdAndUpdate)
ProductSchema.pre("findOneAndUpdate", async function () {
  const update: any = this.getUpdate() || {};

  const direct = update.images;
  const inSet = update.$set?.images;

  const images = Array.isArray(direct)
    ? direct
    : Array.isArray(inSet)
    ? inSet
    : null;

  if (images && images.length > 3) {
    const trimmed = images.slice(0, 3);

    if (Array.isArray(update.images)) update.images = trimmed;
    if (update.$set && Array.isArray(update.$set.images)) update.$set.images = trimmed;

    this.setUpdate(update);
  }
});

export default models.Product || mongoose.model("Product", ProductSchema);
