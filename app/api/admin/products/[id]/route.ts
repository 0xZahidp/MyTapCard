export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import Product from "@/models/Product";

function normImages(input: any): string[] {
  const arr = Array.isArray(input) ? input : [];
  return arr
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ✅ NOTE: params is Promise in your Next.js, so we await it
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  const { id } = await ctx.params;
  const pid = String(id || "");
  if (!isValidObjectId(pid)) return bad("Invalid id", 400);

  await dbConnect();

  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid JSON body");

  const update: any = {};

  if (body?.name !== undefined) update.name = String(body.name || "").trim();
  if (body?.sku !== undefined) update.sku = String(body.sku || "").trim();
  if (body?.description !== undefined) update.description = String(body.description || "").trim();
  if (body?.currency !== undefined) update.currency = String(body.currency || "BDT").trim() || "BDT";
  if (body?.price !== undefined) update.price = Number(body.price);
  if (body?.isActive !== undefined) update.isActive = Boolean(body.isActive);
  if (body?.images !== undefined) update.images = normImages(body.images);

  // Validation if fields included
  if ("name" in update && !update.name) return bad("name cannot be empty");
  if ("sku" in update && !update.sku) return bad("sku cannot be empty");
  if ("price" in update && (!Number.isFinite(update.price) || update.price < 0)) {
    return bad("price must be a non-negative number");
  }

  try {
    const updated = await Product.findByIdAndUpdate(pid, update, { new: true }).lean();
    if (!updated) return bad("Not found", 404);
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 11000) return bad("SKU already exists", 400);
    console.error("ADMIN PRODUCTS PATCH ERROR:", e);
    return bad("Something went wrong", 500);
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  const { id } = await ctx.params;
  const pid = String(id || "");
  if (!isValidObjectId(pid)) return bad("Invalid id", 400);

  await dbConnect();

  try {
    const deleted = await Product.findByIdAndDelete(pid).lean();
    if (!deleted) return bad("Not found", 404);

    return NextResponse.json({ ok: true, id: pid });
  } catch (e: any) {
    console.error("ADMIN PRODUCTS DELETE ERROR:", e);
    return bad("Something went wrong", 500);
  }
}
