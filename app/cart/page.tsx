"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { ui } from "@/components/dashboard/ui";

type Product = {
  _id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function money(n: any, currency = "BDT") {
  const num = Number(n || 0);
  if (currency === "BDT") return `৳${num}`;
  return `${currency} ${num}`;
}

export default function CartPage() {
  const { items, setQty, remove, clear } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/products", { credentials: "same-origin" });
        const data = await res.json().catch(() => []);
        setProducts(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
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
        return { ...ci, p, lineTotal };
      })
      .filter(Boolean) as any[];
  }, [items, byId]);

  const subtotal = useMemo(
    () => lines.reduce((a, b) => a + Number(b.lineTotal || 0), 0),
    [lines]
  );

  const topSoftBtn = cx(ui.softBtn, "w-auto px-4 py-2.5");
  const topDangerBtn =
    "inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 active:scale-[0.99] disabled:opacity-60";

  const qtyInput = cx(ui.input, "w-20 px-3 py-2");

  return (
    <main className={ui.pageBg}>
      <div className={ui.container}>
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Your cart</h1>
            <p className="mt-1 text-sm text-gray-600">Update quantities or proceed to checkout.</p>
          </div>

          <div className="flex gap-2">
            <a href="/order" className={topSoftBtn}>
              Continue shopping
            </a>
            <button className={topDangerBtn} onClick={clear} disabled={!items.length}>
              Clear
            </button>
          </div>
        </div>

        <section className={ui.card}>
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Items</div>
              <div className="text-xs text-gray-500">Subtotal: {money(subtotal, "BDT")}</div>
            </div>
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
            ) : lines.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-gray-900">Your cart is empty</p>
                <p className="mt-1 text-xs text-gray-500">Add products from the order page.</p>
                <a href="/order" className={cx(ui.primaryBtn, "mt-4")}>
                  Go to order page
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {lines.map((x) => (
                  <div
                    key={x.productId}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-4 transition hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{x.p.name}</div>
                        <div className="mt-1 text-xs text-gray-600">
                          {money(x.p.price, x.p.currency)} • {x.p.sku}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Line total: {money(x.lineTotal, x.p.currency)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:justify-end">
                        <input
                          className={qtyInput}
                          type="number"
                          min={1}
                          value={x.qty}
                          onChange={(e) => setQty(x.productId, Number(e.target.value))}
                        />
                        <button className={topSoftBtn} onClick={() => remove(x.productId)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-3">
                  <a href="/checkout" className={cx(ui.primaryBtn, "w-auto px-6 py-2.5")}>
                    Checkout
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 text-center text-xs text-gray-400">MyTapCard • Cart</div>
      </div>
    </main>
  );
}
