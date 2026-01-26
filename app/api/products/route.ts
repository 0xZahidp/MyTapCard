export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  await dbConnect();

  const items = await Product.find({ isActive: true })
    .select("name sku description images currency price isActive createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(items);
}
