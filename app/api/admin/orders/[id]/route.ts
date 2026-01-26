export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { getAuthedEmail } from "@/lib/auth-server";
import { isAdminEmail } from "@/lib/admin";
import Order from "@/models/Order";

function bad(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}
function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await dbConnect();

  const email = await getAuthedEmail();
  if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const oid = String(id || "");
  if (!isValidObjectId(oid)) return bad("Invalid id", 400);

  const order = await Order.findById(oid).lean();
  if (!order) return bad("Not found", 404);

  const isOwner = String(order.userEmail).toLowerCase() === email.toLowerCase();
  if (!isOwner && !isAdminEmail(email)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  return NextResponse.json(order);
}
