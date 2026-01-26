export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: Request) {
  await dbConnect();

  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid JSON body");

  const code = String(body?.code || "").trim().toUpperCase();
  const subtotal = Number(body?.subtotal || 0);

  if (!code) return bad("code is required");
  if (!Number.isFinite(subtotal) || subtotal <= 0) return bad("subtotal invalid"); // ✅ better

  const c: any = await Coupon.findOne({ code, isActive: true }).lean();
  if (!c) return bad("Invalid coupon", 404);

  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) {
    return bad("Coupon expired", 400);
  }

  if (c.maxUses && c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses) {
    return bad("Coupon usage limit reached", 400);
  }

  if (subtotal < Number(c.minOrderAmount || 0)) {
    return bad(`Minimum order amount is ${c.minOrderAmount}`, 400);
  }

  let discount = 0;

  if (c.type === "percent") discount = (subtotal * Number(c.value || 0)) / 100;
  else discount = Number(c.value || 0);

  // ✅ apply cap for percent/fixed (works for both)
  const cap = Number(c.maxDiscount || 0);
  if (cap > 0) discount = Math.min(discount, cap);

  // never exceed subtotal
  discount = Math.min(discount, subtotal);

  // ✅ round to 2 decimals
  discount = Math.round(discount * 100) / 100;

  return NextResponse.json({
    ok: true,
    code: c.code,
    type: c.type,
    value: c.value,
    discount,
  });
}
