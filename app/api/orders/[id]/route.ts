export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { getAuthedEmail } from "@/lib/auth-server";
import { isAdminEmail } from "@/lib/admin";
import Order from "@/models/Order";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await dbConnect();

  const email = await getAuthedEmail();
  if (!email) return bad("Unauthorized", 401);

  const { id } = await ctx.params;
  const oid = String(id || "");
  if (!mongoose.Types.ObjectId.isValid(oid)) return bad("Invalid id", 400);

  const order: any = await Order.findById(oid)
    .select(
      "userEmail items subtotal discount couponCode total currency paymentProvider paymentStatus paymentRef fulfillmentStatus timeline customer createdAt updatedAt"
    )
    .lean();

  if (!order) return bad("Not found", 404);

  const viewer = String(email).toLowerCase();
  const owner = String(order.userEmail).toLowerCase();

  const isOwner = owner === viewer;
  const isAdmin = isAdminEmail(email);

  if (!isOwner && !isAdmin) return bad("Forbidden", 403);

  if (!isAdmin) delete order.userEmail;

  return NextResponse.json({ ok: true, order });
}
