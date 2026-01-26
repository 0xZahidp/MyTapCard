"use client";

import { useEffect, useMemo, useState } from "react";
import { ui } from "@/components/dashboard/ui";

const STEPS = ["created", "printing", "packaging", "shipped", "delivered"] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function money(n: any, currency = "BDT") {
  const num = Number(n || 0);
  if (currency === "BDT") return `৳${num.toFixed(2).replace(/\.00$/, "")}`;
  return `${currency} ${num.toFixed(2).replace(/\.00$/, "")}`;
}

function niceStatus(s: string) {
  return String(s || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function stepIndex(status: string) {
  const i = STEPS.indexOf(status as any);
  return i >= 0 ? i : 0;
}

export default function OrderTrackingClient({ id }: { id: string }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [payBusy, setPayBusy] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);

  const pill =
    "inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-900";

  const softBox =
    "rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700";

  const topSoftBtn = cx(ui.softBtn, "w-auto px-4 py-2.5");
  const backBtn =
    "inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50";

  const loadOrder = async () => {
    setLoading(true);
    const res = await fetch(`/api/orders/${id}`, { credentials: "same-origin" });
    if (res.status === 401) {
      window.location.href = `/login?next=/orders/${id}`;
      return;
    }
    const data = await res.json().catch(() => ({}));
    const o = data?.order ?? data; // supports both raw order and { ok, order }
    setOrder(o && o._id ? o : null);
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const activeIdx = useMemo(() => {
    if (!order?.fulfillmentStatus) return 0;
    if (order.fulfillmentStatus === "cancelled") return 0;
    return stepIndex(order.fulfillmentStatus);
  }, [order]);

  const timeline = useMemo(() => {
    const t = Array.isArray(order?.timeline) ? order.timeline : [];
    return [...t].sort((a: any, b: any) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [order]);

  const paymentProvider = String(order?.paymentProvider || "");
  const paymentStatus = String(order?.paymentStatus || "unpaid");

  const canRefreshPayment = paymentProvider === "uddokta" && paymentStatus === "pending";
  const canPayNow =
    paymentProvider === "uddokta" &&
    (paymentStatus === "unpaid" || paymentStatus === "failed" || paymentStatus === "pending");

  const refreshPaymentStatus = async () => {
    if (!order?._id) return;
    setRefreshBusy(true);
    try {
      const res = await fetch("/api/payments/uddokta/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ orderId: order._id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        alert(data?.message || "Failed to refresh payment status");
        return;
      }
      await loadOrder();
    } finally {
      setRefreshBusy(false);
    }
  };

  const startPayment = async () => {
    if (!order?._id) return;
    setPayBusy(true);
    try {
      const res = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ orderId: order._id, provider: "uddokta" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.paymentUrl) {
        alert(data?.message || "Failed to start payment");
        return;
      }
      window.location.href = data.paymentUrl;
    } finally {
      setPayBusy(false);
    }
  };

  if (loading) {
    return (
      <main className={ui.pageBg}>
        <div className={ui.container}>
          <div className="h-10 w-56 rounded-2xl bg-gray-100 animate-pulse" />
          <div className={cx("mt-6", ui.card, "p-6")}>
            <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="mt-4 h-40 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className={ui.pageBg}>
        <div className={ui.container}>
          <div className={cx(ui.card, "p-6")}>
            <div className="text-sm font-semibold text-gray-900">Order not found</div>
            <a href="/orders" className={cx(ui.primaryBtn, "mt-4")}>
              Back to orders
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={ui.pageBg}>
      <div className={ui.container}>
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Order #{String(order._id).slice(-6)}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={pill}>Status: {niceStatus(order.fulfillmentStatus)}</span>

              <span className={pill}>
                Payment: {niceStatus(paymentStatus)}
                {paymentProvider ? ` (${paymentProvider})` : ""}
              </span>

              {canRefreshPayment ? (
                <button
                  type="button"
                  className={topSoftBtn}
                  disabled={refreshBusy}
                  onClick={refreshPaymentStatus}
                >
                  {refreshBusy ? "Refreshing..." : "Refresh payment status"}
                </button>
              ) : null}
            </div>
          </div>

          <a href="/orders" className={backBtn}>
            Back
          </a>
        </div>

        <section className={ui.card}>
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="text-sm font-semibold text-gray-900">Tracking</div>
          </div>

          <div className="p-6">
            {order.fulfillmentStatus === "cancelled" ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                This order has been cancelled.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                {STEPS.map((s, idx) => {
                  const done = idx <= activeIdx;
                  return (
                    <div
                      key={s}
                      className={[
                        "rounded-2xl border px-4 py-3 text-center",
                        done
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-900",
                      ].join(" ")}
                    >
                      <div className="text-xs font-semibold opacity-90">{idx + 1}</div>
                      <div className="mt-1 text-sm font-semibold">{niceStatus(s)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Items</div>
                <div className="mt-3 space-y-2">
                  {(order.items || []).map((it: any, idx: number) => (
                    <div
                      key={`${it.sku}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{it.name}</div>
                        <div className="text-xs text-gray-600">
                          {it.qty} × {money(it.unitPrice, order.currency)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {money(Number(it.unitPrice) * Number(it.qty), order.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Summary</div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="font-semibold text-gray-900">
                      {money(order.subtotal, order.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">
                      Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                    </span>
                    <span className="font-semibold text-gray-900">
                      - {money(order.discount || 0, order.currency)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {money(order.total, order.currency)}
                    </span>
                  </div>
                </div>

                {canPayNow ? (
                  <button className={cx(ui.primaryBtn, "mt-4")} disabled={payBusy} onClick={startPayment}>
                    {payBusy ? "Starting payment..." : "Pay now"}
                  </button>
                ) : (
                  <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                    Payment status:{" "}
                    <span className="font-semibold">{niceStatus(paymentStatus)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold text-gray-900">Updates</div>

              {timeline.length === 0 ? (
                <div className={cx(softBox, "mt-3")}>No updates yet.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {timeline.map((t: any, idx: number) => (
                    <div key={idx} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-gray-900">
                          {niceStatus(t.status || order.fulfillmentStatus)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t.at ? new Date(t.at).toLocaleString() : ""}
                        </div>
                      </div>

                      {t.note ? <div className="mt-1 text-sm text-gray-700">{t.note}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 text-center text-xs text-gray-400">MyTapCard • Order tracking</div>
      </div>
    </main>
  );
}
