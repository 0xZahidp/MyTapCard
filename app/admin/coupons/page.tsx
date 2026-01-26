"use client";

import { useEffect, useMemo, useState } from "react";
import { ui } from "@/components/dashboard/ui";

type Coupon = {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminCouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const [form, setForm] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    value: "10",
    minOrderAmount: "0",
    maxUses: "0",
    expiresAt: "",
    isActive: true,
  });

  const badge =
    "rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700";

  const dangerBtn =
    "inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 active:scale-[0.99] disabled:opacity-60";

  const topBtn = (base: string) => cx(base, "w-auto px-4 py-2.5");
  const modalBtn = (base: string) => cx(base, "w-auto px-4 py-2.5");

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        window.location.href = "/login?error=login_required&next=/admin/coupons";
        return;
      }
      if (res.status === 403) {
        window.location.href = "/dashboard?error=not_admin";
        return;
      }
      if (!res.ok) throw new Error((data as any)?.message || "Failed to load coupons");

      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const count = useMemo(() => items.length, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: "",
      type: "percent",
      value: "10",
      minOrderAmount: "0",
      maxUses: "0",
      expiresAt: "",
      isActive: true,
    });
    setOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code || "",
      type: c.type,
      value: String(c.value ?? ""),
      minOrderAmount: String(c.minOrderAmount ?? 0),
      maxUses: String(c.maxUses ?? 0),
      expiresAt: c.expiresAt ? String(c.expiresAt).slice(0, 10) : "",
      isActive: Boolean(c.isActive),
    });
    setOpen(true);
  };

  const closeModal = () => {
    if (busy) return;
    setOpen(false);
    setEditing(null);
  };

  const save = async () => {
    const payload: any = {
      type: form.type,
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxUses: Number(form.maxUses || 0),
      isActive: Boolean(form.isActive),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };

    if (!editing) payload.code = form.code.trim().toUpperCase();
    if (!editing && !payload.code) return alert("Code required");

    setBusy("save");
    try {
      const url = editing ? `/api/admin/coupons/${editing._id}` : "/api/admin/coupons";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data?.message || "Save failed");

      setOpen(false);
      setEditing(null);
      await fetchCoupons();
    } finally {
      setBusy(null);
    }
  };

  const del = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    setBusy(c._id);

    try {
      const res = await fetch(`/api/admin/coupons/${c._id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data?.message || "Delete failed");

      setItems((p) => p.filter((x) => x._id !== c._id));
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className={ui.pageBg}>
      <div className={ui.container}>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Coupons</h1>
            <p className="mt-1 text-sm text-gray-600">Create and manage coupon codes.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className={badge}>{count} total</span>
            <button onClick={fetchCoupons} className={topBtn(ui.softBtn)} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button onClick={openCreate} className={topBtn(ui.primaryBtn)}>
              Add coupon
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className={ui.card}>
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="text-sm font-semibold text-gray-900">List</div>
            <div className="text-xs text-gray-500">Latest first</div>
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
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-gray-900">No coupons yet</p>
                <p className="mt-1 text-xs text-gray-500">Click “Add coupon”.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((c) => {
                  const isBusy = busy === c._id;
                  return (
                    <div
                      key={c._id}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-4 transition hover:bg-gray-50"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-gray-900">{c.code}</div>
                            <span className={badge}>{c.type}</span>
                            <span className={badge}>
                              {c.type === "percent" ? `${c.value}%` : `৳${c.value}`}
                            </span>
                            <span className={badge}>{c.isActive ? "active" : "inactive"}</span>
                            {c.expiresAt ? (
                              <span className={badge}>exp {String(c.expiresAt).slice(0, 10)}</span>
                            ) : null}
                            {c.maxUses ? (
                              <span className={badge}>
                                {c.usedCount}/{c.maxUses} used
                              </span>
                            ) : (
                              <span className={badge}>{c.usedCount} used</span>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            Min order: ৳{c.minOrderAmount || 0}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:justify-end">
                          <button
                            className={topBtn(ui.softBtn)}
                            onClick={() => openEdit(c)}
                            disabled={isBusy}
                          >
                            Edit
                          </button>
                          <button className={dangerBtn} onClick={() => del(c)} disabled={isBusy}>
                            {isBusy ? "Deleting..." : "Delete"}
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

        {/* Modal */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
            <div className="relative w-full max-w-2xl rounded-3xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="text-sm font-semibold text-gray-900">
                  {editing ? "Edit coupon" : "Add coupon"}
                </div>
                <button className={modalBtn(ui.softBtn)} onClick={closeModal} disabled={!!busy}>
                  Close
                </button>
              </div>

              <div className="space-y-4 p-6">
                {!editing && (
                  <div className="space-y-1">
                    <label className={ui.label}>Code</label>
                    <input
                      className={ui.input}
                      value={form.code}
                      onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                      placeholder="WELCOME10"
                      disabled={!!busy}
                    />
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className={ui.label}>Type</label>
                    <select
                      className={ui.select}
                      value={form.type}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, type: e.target.value as any }))
                      }
                      disabled={!!busy}
                    >
                      <option value="percent">Percent</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className={ui.label}>Value</label>
                    <input
                      className={ui.input}
                      value={form.value}
                      onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                      placeholder="10"
                      disabled={!!busy}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={ui.label}>Min order amount</label>
                    <input
                      className={ui.input}
                      value={form.minOrderAmount}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, minOrderAmount: e.target.value }))
                      }
                      placeholder="0"
                      disabled={!!busy}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={ui.label}>Max uses (0 = unlimited)</label>
                    <input
                      className={ui.input}
                      value={form.maxUses}
                      onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
                      placeholder="0"
                      disabled={!!busy}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={ui.label}>Expires (optional)</label>
                    <input
                      type="date"
                      className={ui.input}
                      value={form.expiresAt}
                      onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                      disabled={!!busy}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-7">
                    <input
                      id="active"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                      disabled={!!busy}
                    />
                    <label htmlFor="active" className="text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button className={modalBtn(ui.softBtn)} onClick={closeModal} disabled={!!busy}>
                    Cancel
                  </button>
                  <button className={modalBtn(ui.primaryBtn)} onClick={save} disabled={!!busy}>
                    {busy === "save" ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
