export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/require-admin";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET(req: Request) {
  await dbConnect();

  const admin = await requireAdmin(req);
  if (!admin.ok) return bad(admin.message || "Forbidden", admin.status || 403);

  const url = new URL(req.url);
  const q = String(url.searchParams.get("q") || "").trim();
  const status = String(url.searchParams.get("status") || "").trim(); // fulfillmentStatus
  const pay = String(url.searchParams.get("pay") || "").trim(); // paymentStatus
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || 50)));

  const filter: any = {};

  if (status) filter.fulfillmentStatus = status;
  if (pay) filter.paymentStatus = pay;

  // basic search: email or orderId suffix
  if (q) {
    const qLower = q.toLowerCase();
    filter.$or = [
      { userEmail: { $regex: qLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      // allow search by last chars of id
      { _id: q.length >= 6 ? q : undefined },
    ].filter(Boolean);
  }

  const orders = await Order.find(filter)
    .select(
      "userEmail items subtotal discount couponCode total currency paymentProvider paymentStatus fulfillmentStatus timeline createdAt updatedAt"
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ ok: true, orders });
}
