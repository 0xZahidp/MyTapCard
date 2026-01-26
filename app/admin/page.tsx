"use client";

import { useEffect, useMemo, useState } from "react";
import { ui } from "@/components/dashboard/ui";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const badge =
    "rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700";

  const topSoftBtn = cx(ui.softBtn, "w-auto px-4 py-2.5");
  const rowSoftBtn = cx(ui.softBtn, "w-auto px-4 py-2.5");
  const rowPrimaryBtn = cx(ui.primaryBtn, "w-auto px-4 py-2.5");

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/payments", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));

      // ✅ not logged in
      if (res.status === 401) {
        window.location.href = "/login?error=login_required";
        return;
      }

      // ✅ logged in but not admin
      if (res.status === 403) {
        window.location.href = "/dashboard?error=not_admin";
        return;
      }

      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to load payments");
      }

      setPayments(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const pendingCount = useMemo(() => payments.length, [payments]);

  const approve = async (p: any) => {
    if (!p?._id) return;

    setBusyId(String(p._id));
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          paymentId: p._id,
          userId: p.userId?._id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message || "Approve failed");
        return;
      }

      // ✅ update UI instantly (no reload)
      setPayments((prev) => prev.filter((x) => String(x._id) !== String(p._id)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className={ui.pageBg}>
      <div className={ui.container}>
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Pending payments</h1>
            <p className="mt-1 text-sm text-gray-600">
              Review upgrade requests and approve Pro access.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={badge}>{pendingCount} pending</span>
            <button onClick={fetchPayments} className={topSoftBtn} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Content */}
        <section className={ui.card}>
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Requests</div>
              <div className="text-xs text-gray-500">Latest first (as returned by API)</div>
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
            ) : payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-gray-900">No pending payments</p>
                <p className="mt-1 text-xs text-gray-500">You’re all caught up.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => {
                  const id = String(p._id);
                  const isBusy = busyId === id;

                  return (
                    <div
                      key={id}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-4 transition hover:bg-gray-50"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        {/* Left info */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-sm font-semibold text-gray-900">
                              {p?.userId?.email || "Unknown email"}
                            </div>
                            <span className={badge}>{p?.method || "method"}</span>
                            <span className={badge}>৳{p?.amount ?? 0}</span>
                          </div>

                          <div className="mt-2 grid gap-1 text-xs text-gray-600">
                            <div className="flex flex-wrap gap-2">
                              <span className="font-semibold text-gray-700">Txn:</span>
                              <span className="break-all">{p?.transactionId || "-"}</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span className="font-semibold text-gray-700">User ID:</span>
                              <span className="break-all">{p?.userId?._id || "-"}</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span className="font-semibold text-gray-700">Payment ID:</span>
                              <span className="break-all">{p?._id}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 sm:justify-end">
                          <button
                            className={rowSoftBtn}
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(p?.transactionId || "")}
                          >
                            Copy Txn
                          </button>

                          <button
                            className={rowPrimaryBtn}
                            type="button"
                            disabled={isBusy}
                            onClick={() => approve(p)}
                          >
                            {isBusy ? "Approving..." : "Approve"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 text-center text-xs text-gray-400">MyTapCard • Admin</div>
      </div>
    </main>
  );
}
