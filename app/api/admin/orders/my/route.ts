export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getAuthedEmail } from "@/lib/auth-server";
import Order from "@/models/Order";

export async function GET() {
  await dbConnect();

  const email = await getAuthedEmail();
  if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const orders = await Order.find({ userEmail: email.toLowerCase() })
    .select("items total currency paymentStatus fulfillmentStatus createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(orders);
}
