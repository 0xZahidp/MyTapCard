export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "";
}

export async function GET(req: Request) {
  await dbConnect();

  const url = new URL(req.url);
  const invoice_id = url.searchParams.get("invoice_id") || "";
  if (!invoice_id) {
    return NextResponse.redirect(`${baseUrl()}/orders?pay=missing_invoice`);
  }

  const UP_BASE = String(process.env.UDDOKTAPAY_BASE_URL || "").replace(/\/+$/, "");
  const UP_KEY = String(process.env.UDDOKTAPAY_API_KEY || "");

  const vr = await fetch(`${UP_BASE}/api/verify-payment`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "RT-UDDOKTAPAY-API-KEY": UP_KEY,
    },
    body: JSON.stringify({ invoice_id }),
  });

  const v = await vr.json().catch(() => ({} as any));

  // Verify response includes metadata + status like COMPLETED/PENDING/ERROR :contentReference[oaicite:5]{index=5}
  const orderId = String(v?.metadata?.order_id || "");
  if (!orderId) {
    return NextResponse.redirect(`${baseUrl()}/orders?pay=no_order`);
  }

  const status = String(v?.status || "").toUpperCase();

  let paymentStatus: "pending" | "paid" | "failed" = "pending";
  if (status === "COMPLETED") paymentStatus = "paid";
  else if (status === "ERROR") paymentStatus = "failed";

  await Order.findByIdAndUpdate(orderId, {
    $set: {
      paymentProvider: "uddokta",
      paymentStatus,
      paymentRef: invoice_id,
    },
    $push: {
      timeline: {
        at: new Date(),
        status: `payment_${paymentStatus}`,
        note: `UddoktaPay: ${status}`,
        byAdminEmail: "",
      },
    },
  });

  return NextResponse.redirect(`${baseUrl()}/orders/${orderId}?pay=${paymentStatus}`);
}
