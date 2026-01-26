export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/require-admin";

const ALLOWED = ["created", "printing", "packaging", "shipped", "delivered", "cancelled"] as const;
type Fulfillment = (typeof ALLOWED)[number];

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;

  const { id } = await ctx.params;
  const oid = String(id || "");
  if (!isValidObjectId(oid)) return bad("Invalid id", 400);

  const body = await req.json().catch(() => ({}));
  const nextStatus = String(body.status || "").trim() as Fulfillment;
  const note = String(body.note || "").trim();

  if (!ALLOWED.includes(nextStatus)) {
    return bad(`Invalid status. Allowed: ${ALLOWED.join(", ")}`, 400);
  }

  const update: any = {
    $set: { fulfillmentStatus: nextStatus },
    $push: {
      timeline: {
        at: new Date(),
        status: nextStatus,
        note: note || `Status changed to ${nextStatus}`,
        byAdminEmail: String(admin.email || ""),
      },
    },
  };

  const updated = await Order.findByIdAndUpdate(oid, update, { new: true })
    .select(
      "userEmail items subtotal discount couponCode total currency paymentProvider paymentStatus fulfillmentStatus timeline createdAt updatedAt"
    )
    .lean();

  if (!updated) return bad("Order not found", 404);

  return NextResponse.json({ ok: true, order: updated });
}
