export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

function ok() {
  return NextResponse.json({ ok: true });
}
function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function normalizeStatus(raw: string) {
  const s = String(raw || "").trim().toUpperCase();

  // Most common patterns from gateways
  if (["COMPLETED", "SUCCESS", "SUCCEEDED", "PAID"].includes(s)) return "paid" as const;
  if (["FAILED", "FAIL", "ERROR", "CANCELLED", "CANCELED", "EXPIRED"].includes(s)) return "failed" as const;

  // Otherwise keep pending (PENDING, PROCESSING, INITIATED etc.)
  return "pending" as const;
}

export async function POST(req: Request) {
  await dbConnect();

  const UP_KEY = String(process.env.UDDOKTAPAY_API_KEY || "");
  if (!UP_KEY) return bad("Server missing UDDOKTAPAY_API_KEY", 500);

  // Header name can arrive in different casing; use get() with lowercase
  const headerKey =
    req.headers.get("rt-uddoktapay-api-key") ||
    req.headers.get("RT-UDDOKTAPAY-API-KEY") ||
    req.headers.get("Rt-Uddoktapay-Api-Key");

  if (!headerKey || headerKey !== UP_KEY) {
    return bad("Unauthorized", 401);
  }

  const payload: any = await req.json().catch(() => null);
  if (!payload) return bad("Invalid JSON", 400);

  // invoice id sometimes comes as invoice_id OR invoiceId
  const invoice_id = String(payload.invoice_id || payload.invoiceId || "");

  // metadata may be object or JSON string (some providers send string)
  let meta: any = payload?.metadata;
  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta);
    } catch {
      // ignore
    }
  }

  const orderId = String(meta?.order_id || meta?.orderId || "");

  if (!orderId) {
    // Can't map to a specific order → acknowledge (don’t keep retrying)
    return ok();
  }

  const rawStatus = String(payload.status || payload.payment_status || payload.paymentStatus || "");
  const paymentStatus = normalizeStatus(rawStatus);

  // Always store invoice_id when we have it
  const update: any = {
    $set: {
      paymentProvider: "uddokta",
      paymentStatus,
    },
    $push: {
      timeline: {
        at: new Date(),
        status: `payment_${paymentStatus}`,
        note: `UddoktaPay webhook: ${String(rawStatus || "UNKNOWN")}`,
        byAdminEmail: "",
      },
    },
  };

  if (invoice_id) update.$set.paymentRef = invoice_id;

  await Order.findByIdAndUpdate(orderId, update);

  return ok();
}
