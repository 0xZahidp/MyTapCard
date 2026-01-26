export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { getAuthedEmail } from "@/lib/auth-server";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "";
}

export async function POST(req: Request) {
  await dbConnect();

  const email = await getAuthedEmail();
  if (!email) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId || "");
  const provider = String(body.provider || "uddokta");

  if (!orderId) return bad("orderId required", 400);
  if (provider !== "uddokta") return bad("Only uddokta supported for now", 400);

  const order: any = await Order.findById(orderId)
    .select("userEmail total currency paymentStatus paymentProvider customer")
    .lean();

  if (!order) return bad("Order not found", 404);

  const isOwner = String(order.userEmail).toLowerCase() === String(email).toLowerCase();
  if (!isOwner) return bad("Forbidden", 403);

  if (String(order.paymentStatus) !== "unpaid") {
    return bad("Order already in payment flow", 400);
  }

  const UP_BASE = String(process.env.UDDOKTAPAY_BASE_URL || "").replace(/\/+$/, "");
  const UP_KEY = String(process.env.UDDOKTAPAY_API_KEY || "");
  if (!UP_BASE || !UP_KEY) return bad("UddoktaPay env not set", 500);

  const merchantBase = baseUrl();
  if (!merchantBase) return bad("NEXT_PUBLIC_BASE_URL missing", 500);

  const full_name =
    String(order?.customer?.name || "").trim() ||
    String(email).split("@")[0] ||
    "Customer";

  const amount = String(Number(order.total || 0));

  // We use return_type GET so invoice_id comes via query param. :contentReference[oaicite:1]{index=1}
  const payload = {
    full_name,
    email,
    amount,
    metadata: {
      order_id: String(orderId),
      user_email: String(email).toLowerCase(),
      provider: "uddokta",
    },
    redirect_url: `${merchantBase}/api/payments/uddokta/return`,
    return_type: "GET",
    cancel_url: `${merchantBase}/orders/${orderId}?pay=cancel`,
    webhook_url: `${merchantBase}/api/payments/uddokta/webhook`,
  };

  const r = await fetch(`${UP_BASE}/api/checkout-v2`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "RT-UDDOKTAPAY-API-KEY": UP_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await r.json().catch(() => ({} as any));

  // Expected: { status: true, payment_url: "..." } :contentReference[oaicite:2]{index=2}
  if (!r.ok || !data?.status || !data?.payment_url) {
    return bad(data?.message || "Failed to create payment", 400);
  }

  // Mark order as pending + provider
  await Order.findByIdAndUpdate(orderId, {
    $set: { paymentProvider: "uddokta", paymentStatus: "pending" },
  });

  return NextResponse.json({ ok: true, paymentUrl: String(data.payment_url) });
}
