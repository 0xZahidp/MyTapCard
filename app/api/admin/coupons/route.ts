export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import Coupon from "@/models/Coupon";

function bad(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function GET() {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  await dbConnect();
  const items = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  await dbConnect();
  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid JSON body");

  const code = String(body?.code || "").trim().toUpperCase();
  const type = body?.type === "fixed" ? "fixed" : "percent";
  const value = Number(body?.value);
  const minOrderAmount = Number(body?.minOrderAmount || 0);
  const maxUses = Number(body?.maxUses || 0);
  const isActive = Boolean(body?.isActive ?? true);
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null;

  if (!code) return bad("code is required");
  if (!Number.isFinite(value) || value <= 0) return bad("value must be > 0");
  if (type === "percent" && value > 100) return bad("percent value cannot exceed 100");
  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) return bad("minOrderAmount invalid");
  if (!Number.isFinite(maxUses) || maxUses < 0) return bad("maxUses invalid");

  try {
    const doc = await Coupon.create({
      code,
      type,
      value,
      minOrderAmount,
      maxUses,
      isActive,
      expiresAt,
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (e: any) {
    if (e?.code === 11000) return bad("Coupon code already exists", 400);
    console.error("ADMIN COUPONS POST ERROR:", e);
    return bad("Something went wrong", 500);
  }
}
