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
  imageUrl?: string;
  description?: string;
};

function money(n: any, currency = "BDT") {
  const num = Number(n || 0);
  if (currency === "BDT") return `৳${num}`;
  return `${currency} ${num}`;
}

export default function OrderPage() {
  const { add, count } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const pageBg =
    "min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100";

  // Keep a local soft button style (since ui.softBtn may not exist in your ui.ts)
  const softBtn =
    "inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60";

  // Use your shared primary button + card styling (matches PaymentsTab)
  const primaryBtn = ui.primaryBtn;

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

  const cartLabel = useMemo(() => (count ? `Cart (${count})` : "Cart"), [count]);

  return (
    <main className={pageBg}>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Order MyTapCard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Choose products and checkout.
            </p>
          </div>

          <a href="/cart" className={softBtn}>
            {cartLabel}
          </a>
        </div>

        <section className={ui.card}>
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="text-sm font-semibold text-gray-900">Products</div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-2xl border border-gray-200 bg-gray-50"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-gray-900">
                  No products yet
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Add products from Admin → Products.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((p) => (
                  <div
                    key={p._id}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-4 transition hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900">
                          {p.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {money(p.price, p.currency)} • {p.sku}
                        </div>
                        {p.description ? (
                          <div className="mt-1 text-xs text-gray-500">
                            {p.description}
                          </div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        className={primaryBtn}
                        onClick={() => add(p._id, 1)}
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 text-center text-xs text-gray-400">
          MyTapCard • Order
        </div>
      </div>
    </main>
  );
}
