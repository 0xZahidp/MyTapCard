export const runtime = "nodejs";

import { NextResponse } from "next/server";
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

export async function GET() {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  await dbConnect();

  const items = await Product.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  await dbConnect();

  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid JSON body");

  const name = String(body?.name || "").trim();
  const sku = String(body?.sku || "").trim();
  const description = String(body?.description || "").trim();
  const currency = String(body?.currency || "BDT").trim() || "BDT";
  const price = Number(body?.price);

  const images = normImages(body?.images);

  if (!name) return bad("name is required");
  if (!sku) return bad("sku is required");
  if (!Number.isFinite(price) || price < 0) return bad("price must be a non-negative number");

  try {
    const doc = await Product.create({
      name,
      sku,
      description,
      images,
      currency,
      price,
      isActive: Boolean(body?.isActive ?? true),
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (e: any) {
    // Duplicate SKU (unique index)
    if (e?.code === 11000) {
      return bad("SKU already exists", 400);
    }
    console.error("ADMIN PRODUCTS POST ERROR:", e);
    return bad("Something went wrong", 500);
  }
}
