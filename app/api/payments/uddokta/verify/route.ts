export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { getAuthedEmail } from "@/lib/auth-server";
import { isAdminEmail } from "@/lib/admin";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function normalizeStatus(raw: string) {
  const s = String(raw || "").trim().toUpperCase();
  if (["COMPLETED", "SUCCESS", "SUCCEEDED", "PAID"].includes(s)) return "paid" as const;
  if (["FAILED", "FAIL", "ERROR", "CANCELLED", "CANCELED", "EXPIRED"].includes(s)) return "failed" as const;
  return "pending" as const;
}

export async function POST(req: Request) {
  await dbConnect();

  const email = await getAuthedEmail();
  if (!email) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId || "");
  if (!orderId) return bad("orderId required", 400);

  const order: any = await Order.findById(orderId)
    .select("userEmail paymentProvider paymentStatus paymentRef")
    .lean();

  if (!order) return bad("Order not found", 404);

  const isOwner = String(order.userEmail).toLowerCase() === String(email).toLowerCase();
  if (!isOwner && !isAdminEmail(email)) return bad("Forbidden", 403);

  if (String(order.paymentProvider) !== "uddokta") {
    return bad("Not an UddoktaPay order", 400);
  }

  const invoice_id = String(order.paymentRef || "");
  if (!invoice_id) {
    return bad("Missing invoice_id (paymentRef). If webhook/return hasn’t set it yet, you can’t verify.", 400);
  }

  const UP_BASE = String(process.env.UDDOKTAPAY_BASE_URL || "")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
  const UP_KEY = String(process.env.UDDOKTAPAY_API_KEY || "");

  if (!UP_BASE || !UP_KEY) return bad("UddoktaPay env not set", 500);

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
  if (!vr.ok) return bad(v?.message || "Verify payment failed", 400);

  // Their verify response includes a status field (e.g. COMPLETED / ERROR / PENDING). We normalize it.
  const raw = String(v?.status || v?.payment_status || "");
  const next = normalizeStatus(raw);

  await Order.findByIdAndUpdate(orderId, {
    $set: { paymentStatus: next },
    $push: {
      timeline: {
        at: new Date(),
        status: `payment_${next}`,
        note: `Verify: ${raw || "UNKNOWN"}`,
        byAdminEmail: isAdminEmail(email) ? String(email) : "",
      },
    },
  });

  return NextResponse.json({ ok: true, paymentStatus: next, rawStatus: raw });
}
