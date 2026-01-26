"use client";

import { useEffect, useState } from "react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const money = (n: any) => `৳${Number(n || 0).toFixed(2).replace(/\.00$/, "")}`;

  const pageBg =
    "min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100";
  const card =
    "rounded-3xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]";

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/orders/my", { credentials: "same-origin" });
      if (res.status === 401) {
        window.location.href = "/login?next=/orders";
        return;
      }
    const data = await res.json().catch(() => ({}));
    setOrders(Array.isArray((data as any)?.orders) ? (data as any).orders : []);
      setLoading(false);
    })();
  }, []);

  return (
    <main className={pageBg}>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Your orders
          </h1>
          <p className="mt-1 text-sm text-gray-600">Track your order status.</p>
        </div>

        <section className={card}>
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="text-sm font-semibold text-gray-900">Orders</div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse"
                  />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-gray-900">No orders yet</p>
                <p className="mt-1 text-xs text-gray-500">
                  Place your first order from the cart.
                </p>
                <a
                  href="/cart"
                  className="mt-4 inline-flex items-center justify-center rounded-2xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Go to cart
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                 {orders.map((o) => (
                  <a
                    key={String(o._id)}
                    href={`/orders/${o._id}`}
                    className="block rounded-2xl border border-gray-200 bg-white px-4 py-4 transition hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          Order #{String(o._id).slice(-6)}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          Status: {o.fulfillmentStatus} • Payment:{" "}
                          {o.paymentStatus || "unpaid"}
                          {o.paymentProvider ? ` (${o.paymentProvider})` : ""}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {money(o.total)}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
