"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";

type Product = {
  _id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
};

function money(n: any, currency = "BDT") {
  const num = Number(n || 0);
  if (currency === "BDT") return `৳${num.toFixed(2).replace(/\.00$/, "")}`;
  return `${currency} ${num.toFixed(2).replace(/\.00$/, "")}`;
}

export default function CheckoutClient() {
  const { items, clear } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [placing, setPlacing] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const pageBg =
    "min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100";
  const card =
    "rounded-3xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]";
  const primaryBtn =
    "inline-flex items-center justify-center rounded-2xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60";
  const softBtn =
    "inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60";

  useEffect(() => {
    (async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch("/api/products", { credentials: "same-origin" });
        const data = await res.json().catch(() => []);
        setProducts(Array.isArray(data) ? data : []);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(String(p._id), p);
    return m;
  }, [products]);

  const lines = useMemo(() => {
    return items
      .map((ci) => {
        const p = byId.get(ci.productId);
        if (!p) return null;
        const qty = Number(ci.qty || 1);
        const lineTotal = qty * Number(p.price || 0);
        return { ...ci, p, qty, lineTotal };
      })
      .filter(Boolean) as any[];
  }, [items, byId]);

  const subtotal = useMemo(
    () => lines.reduce((a, b) => a + Number(b.lineTotal || 0), 0),
    [lines]
  );

  const total = useMemo(() => {
    const t = subtotal - Number(couponDiscount || 0);
    return Math.max(0, t);
  }, [subtotal, couponDiscount]);

  const applyCoupon = async () => {
    setCouponMsg(null);
    setCouponDiscount(0);

    const code = couponCode.trim();
    if (!code) {
      setCouponMsg("Enter a coupon code.");
      return;
    }

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      setCouponMsg("Add items first, then apply coupon.");
      return;
    }

    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ code, subtotal }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      setCouponMsg(data?.message || "Invalid coupon");
      return;
    }

    setCouponDiscount(Number(data.discount || 0));
    setCouponMsg(`Applied: ${String(data.code)} (-${money(data.discount, "BDT")})`);
  };

  const placeOrder = async () => {
    setPlacedOrderId(null);
    setPlacing(true);

    try {
      if (!items.length) {
        alert("Cart is empty");
        return;
      }

      if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
        alert("Please fill name, phone, and address.");
        return;
      }

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          items,
          couponCode: couponCode.trim(),
          customer,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message || "Order failed");
        return;
      }

      const orderId = String(data.orderId || "");
      setPlacedOrderId(orderId);

      // clear cart once (after successful order create)
      clear();

      // redirect to payment flow
      const payRes = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ orderId, provider: "uddokta" }),
      });

      const payData = await payRes.json().catch(() => ({}));
      if (payRes.ok && payData?.paymentUrl) {
        window.location.href = payData.paymentUrl;
        return;
      }

      // fallback: go to tracking
      window.location.href = `/orders/${orderId}`;
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main className={pageBg}>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Checkout
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Confirm details and place your order.
            </p>
          </div>
          <a href="/cart" className={softBtn}>
            Back to cart
          </a>
        </div>

        <section className={card}>
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="text-sm font-semibold text-gray-900">Order</div>
          </div>

          <div className="p-6 space-y-6">
            {/* Items */}
            <div>
              <div className="text-sm font-semibold text-gray-900">Items</div>
              {loadingProducts ? (
                <div className="mt-3 h-16 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse" />
              ) : lines.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                  <div className="text-sm font-semibold text-gray-900">
                    Cart is empty
                  </div>
                  <a href="/cart" className={`${primaryBtn} mt-4`}>
                    Go to cart
                  </a>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {lines.map((x) => (
                    <div
                      key={x.productId}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {x.p.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {x.qty} × {money(x.p.price, x.p.currency)}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {money(x.lineTotal, x.p.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer */}
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Delivery details
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-gray-100"
                  placeholder="Full name"
                  value={customer.name}
                  onChange={(e) =>
                    setCustomer((p) => ({ ...p, name: e.target.value }))
                  }
                />
                <input
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-gray-100"
                  placeholder="Phone number"
                  value={customer.phone}
                  onChange={(e) =>
                    setCustomer((p) => ({ ...p, phone: e.target.value }))
                  }
                />
                <input
                  className="sm:col-span-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-gray-100"
                  placeholder="Full address"
                  value={customer.address}
                  onChange={(e) =>
                    setCustomer((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Coupon */}
            <div>
              <div className="text-sm font-semibold text-gray-900">Coupon</div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-gray-100"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button className={softBtn} type="button" onClick={applyCoupon}>
                  Apply
                </button>
              </div>
              {couponMsg ? (
                <div className="mt-2 text-xs text-gray-600">{couponMsg}</div>
              ) : null}
            </div>

            {/* Totals */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  {money(subtotal, "BDT")}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-700">Discount</span>
                <span className="font-semibold text-gray-900">
                  - {money(couponDiscount, "BDT")}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-lg font-semibold text-gray-900">
                  {money(total, "BDT")}
                </span>
              </div>
            </div>

            <button
              className={primaryBtn}
              disabled={placing || !items.length}
              onClick={placeOrder}
            >
              {placing ? "Placing order..." : "Place order"}
            </button>

            {placedOrderId ? (
              <div className="text-xs text-gray-600">
                Order created: {placedOrderId}
              </div>
            ) : null}
          </div>
        </section>

        <div className="mt-6 text-center text-xs text-gray-400">
          MyTapCard • Checkout
        </div>
      </div>
    </main>
  );
}
