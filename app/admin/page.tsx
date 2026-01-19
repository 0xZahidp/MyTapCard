"use client";

import { useEffect, useMemo, useState } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageBg =
    "min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100";

  const card =
    "rounded-3xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]";

  const primaryBtn =
    "inline-flex items-center justify-center rounded-2xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60";

  const softBtn =
    "inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60";

  const badge = "rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700";

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
    <main className={pageBg}>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Pending payments
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Review upgrade requests and approve Pro access.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={badge}>{pendingCount} pending</span>
            <button onClick={fetchPayments} className={softBtn} disabled={loading}>
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
        <section className={card}>
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Requests
              </div>
              <div className="text-xs text-gray-500">
                Latest first (as returned by API)
              </div>
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
                <p className="text-sm font-semibold text-gray-900">
                  No pending payments
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  You’re all caught up.
                </p>
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
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {p?.userId?.email || "Unknown email"}
                            </div>
                            <span className={badge}>
                              {p?.method || "method"}
                            </span>
                            <span className={badge}>
                              ৳{p?.amount ?? 0}
                            </span>
                          </div>

                          <div className="mt-2 grid gap-1 text-xs text-gray-600">
                            <div className="flex flex-wrap gap-2">
                              <span className="font-semibold text-gray-700">
                                Txn:
                              </span>
                              <span className="break-all">{p?.transactionId || "-"}</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span className="font-semibold text-gray-700">
                                User ID:
                              </span>
                              <span className="break-all">{p?.userId?._id || "-"}</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span className="font-semibold text-gray-700">
                                Payment ID:
                              </span>
                              <span className="break-all">{p?._id}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 sm:justify-end">
                          <button
                            className={softBtn}
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(p?.transactionId || "")}
                          >
                            Copy Txn
                          </button>

                          <button
                            className={primaryBtn}
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

        <div className="mt-6 text-center text-xs text-gray-400">
          MyTapCard • Admin
        </div>
      </div>
    </main>
  );
}
