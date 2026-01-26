export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getAuthedEmail } from "@/lib/auth-server";
import Order from "@/models/Order";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function GET() {
  await dbConnect();

  const emailRaw = await getAuthedEmail();
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";

  if (!email) return bad("Unauthorized", 401);

  const orders = await Order.find({ userEmail: email })
    .select(
      "items total currency paymentStatus paymentProvider fulfillmentStatus createdAt"
    )
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ ok: true, orders });
}
