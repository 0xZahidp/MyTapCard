export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";

import PaymentRequest from "@/models/PaymentRequest";
import Subscription from "@/models/Subscription";

export async function GET() {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  await dbConnect();

  const payments = await PaymentRequest.find({ status: "pending" })
    .populate("userId", "email")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  const authz = await requireAdmin();
  if (!authz.ok) return authz.res;

  await dbConnect();

  const { paymentId, userId } = await req.json();

  if (!paymentId || !userId) {
    return NextResponse.json(
      { message: "paymentId and userId are required" },
      { status: 400 }
    );
  }

  await PaymentRequest.findByIdAndUpdate(paymentId, { status: "approved" });

  await Subscription.findOneAndUpdate(
    { userId },
    { plan: "pro" },
    { upsert: true, new: true }
  );

  return NextResponse.json({ message: "User upgraded to Pro" });
}
