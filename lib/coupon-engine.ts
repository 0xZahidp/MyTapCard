import Coupon from "@/models/Coupon";

export async function computeCouponDiscount(codeRaw: string, subtotal: number) {
  const code = String(codeRaw || "").trim().toUpperCase();
  const sub = Number(subtotal || 0);

  if (!code) return { ok: false, message: "Coupon code is required." };
  if (!Number.isFinite(sub) || sub <= 0) return { ok: false, message: "Invalid subtotal." };

  const coupon = await Coupon.findOne({ code, isActive: true }).lean();
  if (!coupon) return { ok: false, message: "Invalid coupon." };

  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { ok: false, message: "Coupon expired." };
  }

  if (coupon.minOrderAmount && sub < Number(coupon.minOrderAmount)) {
    return {
      ok: false,
      message: `Minimum order is ${coupon.minOrderAmount}.`,
    };
  }

  if (coupon.maxUses && Number(coupon.maxUses) > 0) {
    const used = Number(coupon.usedCount || 0);
    if (used >= Number(coupon.maxUses)) {
      return { ok: false, message: "Coupon usage limit reached." };
    }
  }

  let discount = 0;

  if (coupon.type === "percent") {
    discount = (sub * Number(coupon.value || 0)) / 100;
  } else {
    discount = Number(coupon.value || 0);
  }

  // cap by maxDiscount if set
  const cap = Number(coupon.maxDiscount || 0);
  if (cap > 0) discount = Math.min(discount, cap);

  // never exceed subtotal
  discount = Math.min(discount, sub);

  // keep 2 decimals (optional)
  discount = Math.round(discount * 100) / 100;

  return {
    ok: true,
    code: coupon.code,
    couponId: String(coupon._id),
    discount,
  };
}
