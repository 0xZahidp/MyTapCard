"use client";

import { useEffect, useMemo, useState } from "react";
import { ui } from "@/components/dashboard/ui";

const STATUS = ["", "created", "printing", "packaging", "shipped", "delivered", "cancelled"] as const;
const PAY = ["", "unpaid", "pending", "paid", "failed", "refunded"] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function money(n: any, currency = "BDT") {
  const num = Number(n || 0);
  if (currency === "BDT") return `৳${num.toFixed(2).replace(/\.00$/, "")}`;
  return `${currency} ${num.toFixed(2).replace(/\.00$/, "")}`;
}

function nice(s: string) {
  return String(s || "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState("");

  const [active, setActive] = useState<any | null>(null);
  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");

  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (pay) params.set("pay", pay);
    params.set("limit", "100");

    const res = await fetch(`/api/admin/orders?${params.toString()}`, {
      credentials: "same-origin",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      alert(data?.message || "Failed to load orders (admin only)");
      setOrders([]);
      setLoading(false);
      return;
    }

    setOrders(Array.isArray(data.orders) ? data.orders : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openOrder = (o: any) => {
    setActive(o);
    setNewStatus(String(o.fulfillmentStatus || "created"));
    setNote("");
  };

  const saveStatus = async () => {
    if (!active?._id) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${active._id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status: newStatus, note }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        alert(data?.message || "Failed to update");
        return;
      }

      const updated = data.order;
      setOrders((prev) => prev.map((x) => (String(x._id) === String(updated._id) ? updated : x)));
      setActive(updated);
      setNote("");
    } finally {
      setSaving(false);
    }
  };

  const activeTimeline = useMemo(() => {
    const t = Array.isArray(active?.timeline) ? active.timeline : [];
    return [...t].sort((a: any, b: any) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [active]);

  // Buttons: ui.primaryBtn/softBtn are full-width by default. For top toolbar, we override width.
  const topSoftBtn = cx(ui.softBtn, "w-auto px-4 py-2.5");
  const topPrimaryBtn = cx(ui.primaryBtn, "w-auto px-4 py-2.5");

  // Card buttons in forms: keep full width (nice on mobile)
  const formPrimaryBtn = ui.primaryBtn;

  const textarea =
    "w-full min-h-[90px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 caret-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100";

  return (
    <main className={ui.pageBg}>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Admin • Orders</h1>
            <p className="mt-1 text-sm text-gray-600">Manage fulfillment status and timeline.</p>
          </div>

          <div className="flex gap-2">
            <button className={topSoftBtn} onClick={load} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={cx(ui.card, "p-4 mb-4")}>
          <div className="grid gap-3 md:grid-cols-4">
            <input
              className={ui.input}
              placeholder="Search email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <select className={ui.select} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s ? `Status: ${nice(s)}` : "All statuses"}
                </option>
              ))}
            </select>

            <select className={ui.select} value={pay} onChange={(e) => setPay(e.target.value)}>
              {PAY.map((s) => (
                <option key={s} value={s}>
                  {s ? `Payment: ${nice(s)}` : "All payments"}
                </option>
              ))}
            </select>

            <button className={ui.primaryBtn} onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Apply"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* List */}
          <section className={cx(ui.card, "lg:col-span-2")}>
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="text-sm font-semibold text-gray-900">Orders</div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-20 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse"
                    />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                  <div className="text-sm font-semibold text-gray-900">No orders found</div>
                  <div className="mt-1 text-xs text-gray-500">Try changing filters.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <button
                      key={String(o._id)}
                      onClick={() => openOrder(o)}
                      className="w-full text-left rounded-2xl border border-gray-200 bg-white px-4 py-4 transition hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            Order #{String(o._id).slice(-6)} • {o.userEmail}
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {nice(o.fulfillmentStatus)} • Payment: {nice(o.paymentStatus)}
                            {o.paymentProvider ? ` (${o.paymentProvider})` : ""}
                          </div>
                          <div className="mt-1 text-[11px] text-gray-500">
                            {o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {money(o.total, o.currency)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Detail / Update */}
          <aside className={ui.card}>
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="text-sm font-semibold text-gray-900">Details</div>
            </div>

            <div className="p-6">
              {!active ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                  <div className="text-sm font-semibold text-gray-900">Select an order</div>
                  <div className="mt-1 text-xs text-gray-500">
                    Click an order to view and update status.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      Order #{String(active._id).slice(-6)}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">{active.userEmail}</div>
                    <div className="mt-2 text-sm font-semibold text-gray-900">
                      {money(active.total, active.currency)}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      Status: {nice(active.fulfillmentStatus)} • Payment: {nice(active.paymentStatus)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm font-semibold text-gray-900">Update status</div>

                    <div className="mt-3 grid gap-2">
                      <select
                        className={ui.select}
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                      >
                        {STATUS.filter(Boolean).map((s) => (
                          <option key={s} value={s}>
                            {nice(s)}
                          </option>
                        ))}
                      </select>

                      <textarea
                        className={textarea}
                        placeholder="Note (optional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />

                      <button className={formPrimaryBtn} disabled={saving} onClick={saveStatus}>
                        {saving ? "Updating..." : "Save"}
                      </button>

                      <a
                        href={`/orders/${active._id}`}
                        className={cx(ui.softBtn, "mt-1")}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open user tracking
                      </a>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-gray-900">Timeline</div>

                    {activeTimeline.length === 0 ? (
                      <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        No timeline entries
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {activeTimeline.map((t: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-2xl border border-gray-200 bg-white px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-gray-900">
                                {nice(t.status || "")}
                              </div>
                              <div className="text-xs text-gray-500">
                                {t.at ? new Date(t.at).toLocaleString() : ""}
                              </div>
                            </div>

                            {t.note ? <div className="mt-1 text-sm text-gray-700">{t.note}</div> : null}

                            {t.byAdminEmail ? (
                              <div className="mt-1 text-[11px] text-gray-500">By: {t.byAdminEmail}</div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">MyTapCard • Admin Orders</div>
      </div>
    </main>
  );
}
