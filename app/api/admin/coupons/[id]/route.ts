export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import Coupon from "@/models/Coupon";

function bad(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  const { id } = await ctx.params;
  const cid = String(id || "");
  if (!isValidObjectId(cid)) return bad("Invalid id", 400);

  await dbConnect();
  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid JSON body");

  const update: any = {};

  if (body?.type !== undefined) update.type = body.type === "fixed" ? "fixed" : "percent";
  if (body?.value !== undefined) update.value = Number(body.value);
  if (body?.minOrderAmount !== undefined) update.minOrderAmount = Number(body.minOrderAmount || 0);
  if (body?.maxUses !== undefined) update.maxUses = Number(body.maxUses || 0);
  if (body?.expiresAt !== undefined) update.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (body?.isActive !== undefined) update.isActive = Boolean(body.isActive);

  if ("value" in update) {
    if (!Number.isFinite(update.value) || update.value <= 0) return bad("value must be > 0");
    if (update.type === "percent" && update.value > 100) return bad("percent value cannot exceed 100");
  }

  try {
    const doc = await Coupon.findByIdAndUpdate(cid, update, { new: true }).lean();
    if (!doc) return bad("Not found", 404);
    return NextResponse.json(doc);
  } catch (e: any) {
    console.error("ADMIN COUPONS PATCH ERROR:", e);
    return bad("Something went wrong", 500);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  const { id } = await ctx.params;
  const cid = String(id || "");
  if (!isValidObjectId(cid)) return bad("Invalid id", 400);

  await dbConnect();

  try {
    const doc = await Coupon.findByIdAndDelete(cid).lean();
    if (!doc) return bad("Not found", 404);
    return NextResponse.json({ ok: true, id: cid });
  } catch (e: any) {
    console.error("ADMIN COUPONS DELETE ERROR:", e);
    return bad("Something went wrong", 500);
  }
}
