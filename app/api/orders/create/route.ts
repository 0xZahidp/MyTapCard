export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import { auth } from "@/lib/auth";
import { getUserFromToken } from "@/lib/auth-legacy";

async function getAuthedEmail(req: Request) {
  const session = await auth();
  const sessionEmail =
    (session?.user as any)?.email || (session?.user as any)?.emailAddress;
  if (sessionEmail) return sessionEmail;

  const legacy = await getUserFromToken(req);
  return legacy?.email || null;
}

function toStr(v: any) {
  return v == null ? "" : String(v);
}

function bad(message: string, status = 400, extra?: any) {
  return NextResponse.json({ message, ...(extra || {}) }, { status });
}

export async function POST(req: Request) {
  await dbConnect();

  const email = await getAuthedEmail(req);
  if (!email) return bad("Unauthorized", 401);

  const body = await req.json().catch(() => ({} as any));

  // Accept either `items` or `cartItems` from client (and old `cart` if present)
  const incoming = Array.isArray(body.items)
    ? body.items
    : Array.isArray(body.cartItems)
    ? body.cartItems
    : Array.isArray(body.cart)
    ? body.cart
    : [];

  if (!incoming.length) return bad("Cart is empty", 400);

  // Normalize to [{ productId, qty }]
  const cart = incoming
    .map((x: any) => ({
      productId: toStr(x.productId || x._id || x.id),
      qty: Number(x.qty ?? x.quantity ?? 1),
    }))
    .filter((x: any) => x.productId && Number.isFinite(x.qty) && x.qty > 0);

  if (!cart.length) return bad("Invalid cart items", 400);

  // Fetch products and build snapshot items
  const ids = [...new Set(cart.map((c) => c.productId))];

  const products = await Product.find({
    _id: { $in: ids },
    isActive: true,
  })
    .select("name sku price currency images")
    .lean();

  const byId = new Map(products.map((p: any) => [String(p._id), p]));

  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    return bad("Some products are unavailable", 400, { missingProductIds: missing });
  }

  const currency = products[0]?.currency || "USD";

  const items = cart.map((c) => {
    const p: any = byId.get(c.productId);
    return {
      productId: p._id,
      name: p.name,
      sku: p.sku,
      unitPrice: Number(p.price),
      qty: c.qty,
      image: Array.isArray(p.images) && p.images.length ? p.images[0] : "",
    };
  });

  const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);

  // Shipping optional
  const shipping = Number(body.shipping ?? 0) || 0;

  // ✅ Coupon: validate + compute discount server-side
  let discount = 0;
  let couponCode = "";

  const rawCode = String(body.couponCode || "").trim().toUpperCase();
  if (rawCode) {
    const c: any = await Coupon.findOne({ code: rawCode, isActive: true }).lean();
    if (!c) return bad("Invalid coupon", 400);

    if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) {
      return bad("Coupon expired", 400);
    }

    if (subtotal < Number(c.minOrderAmount || 0)) {
      return bad(`Minimum order amount is ${c.minOrderAmount}`, 400);
    }

    if (c.maxUses && c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses) {
      return bad("Coupon usage limit reached", 400);
    }

    if (c.type === "percent") {
      // optional guard
      const pct = Number(c.value || 0);
      if (pct < 0 || pct > 100) return bad("Invalid coupon config", 400);
      discount = (subtotal * pct) / 100;
    } else {
      discount = Number(c.value || 0);
    }

    // ✅ optional maxDiscount cap (works only if field exists; otherwise it becomes 0)
    const cap = Number(c.maxDiscount || 0);
    if (cap > 0) discount = Math.min(discount, cap);

    discount = Math.min(discount, subtotal);
    discount = Math.round(discount * 100) / 100;

    couponCode = c.code;

    // ✅ increment usedCount only when order is created
    // simple + safe-enough check so it won't exceed maxUses
    if (c.maxUses && c.maxUses > 0) {
      const updated = await Coupon.updateOne(
        { _id: c._id, usedCount: { $lt: c.maxUses } },
        { $inc: { usedCount: 1 } }
      );
      if (!updated.modifiedCount) {
        return bad("Coupon usage limit reached", 400);
      }
    } else {
      await Coupon.updateOne({ _id: c._id }, { $inc: { usedCount: 1 } });
    }
  }

  const total = Math.max(0, subtotal - discount + shipping);

  const order = await Order.create({
    userEmail: email,
    items,
    subtotal,
    discount,
    couponCode,
    total,
    currency,

    paymentProvider: ["binance", "uddokta"].includes(String(body.paymentProvider || ""))
      ? String(body.paymentProvider)
      : "",

    paymentStatus: ["unpaid", "pending", "paid", "failed", "refunded"].includes(
      String(body.paymentStatus || "")
    )
      ? String(body.paymentStatus)
      : "unpaid",

    paymentRef: body.paymentRef || "",

    fulfillmentStatus: "created",
    timeline: [
      { at: new Date(), status: "created", note: "Order created", byAdminEmail: "" },
    ],

    // keep customer snapshot if your schema supports it (optional)
    customer: body.customer || undefined,
  });

  return NextResponse.json({ orderId: String(order._id) });
}
