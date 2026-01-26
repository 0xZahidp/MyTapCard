"use client";

import { useEffect, useMemo, useState } from "react";
import { ui } from "@/components/dashboard/ui";

type Product = {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  images: string[];
  currency: string;
  price: number;
  isActive: boolean;
  createdAt?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function money(n: any, currency = "BDT") {
  const num = Number(n || 0);
  if (currency === "BDT") return `৳${num}`;
  return `${currency} ${num}`;
}

function uniqImages(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of arr) {
    const v = String(x || "").trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out.slice(0, 3);
}

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "499",
    currency: "BDT",
    isActive: true,
    images: [] as string[],
  });

  const badge =
    "rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700";

  const dangerBtn =
    "inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 active:scale-[0.99] disabled:opacity-60";

  // ui.primaryBtn/ui.softBtn are w-full; for header/actions we want auto width
  const topSoftBtn = cx(ui.softBtn, "w-auto px-4 py-2.5");
  const topPrimaryBtn = cx(ui.primaryBtn, "w-auto px-4 py-2.5");
  const modalSoftBtn = cx(ui.softBtn, "w-auto px-4 py-2.5");
  const modalPrimaryBtn = cx(ui.primaryBtn, "w-auto px-4 py-2.5");

  const textarea =
    "w-full min-h-[96px] resize-y rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 caret-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed";

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/products", { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        window.location.href = "/login?error=login_required&next=/admin/products";
        return;
      }
      if (res.status === 403) {
        window.location.href = "/dashboard?error=not_admin";
        return;
      }
      if (!res.ok) throw new Error((data as any)?.message || "Failed to load products");

      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const count = useMemo(() => items.length, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      sku: "",
      description: "",
      price: "499",
      currency: "BDT",
      isActive: true,
      images: [],
    });
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      sku: p.sku || "",
      description: p.description || "",
      price: String(p.price ?? ""),
      currency: p.currency || "BDT",
      isActive: Boolean(p.isActive),
      images: Array.isArray(p.images) ? p.images.slice(0, 3) : [],
    });
    setOpen(true);
  };

  const closeModal = () => {
    if (busy) return;
    setOpen(false);
    setEditing(null);
  };

  const uploadOne = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      credentials: "same-origin",
      body: fd,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Upload failed");
    return String(data?.url || "");
  };

  const onPickImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const current = Array.isArray(form.images) ? form.images : [];
    if (current.length >= 3) {
      alert("Max 3 images per product.");
      return;
    }

    const remaining = 3 - current.length;
    const selected = Array.from(files).slice(0, remaining);

    setBusy("upload");
    try {
      const urls: string[] = [];
      for (const f of selected) {
        const url = await uploadOne(f);
        if (url) urls.push(url);
      }
      setForm((p) => ({ ...p, images: uniqImages([...p.images, ...urls]) }));
    } catch (e: any) {
      alert(e?.message || "Upload failed");
    } finally {
      setBusy(null);
    }
  };

  const removeImage = (url: string) => {
    setForm((p) => ({ ...p, images: p.images.filter((x) => x !== url) }));
  };

  const save = async () => {
    const name = form.name.trim();
    const sku = form.sku.trim();
    const priceNum = Number(form.price);

    if (!name) return alert("Name is required");
    if (!sku) return alert("SKU is required");
    if (!Number.isFinite(priceNum) || priceNum < 0) return alert("Price must be valid");

    setBusy("save");
    try {
      const payload = {
        name,
        sku,
        description: form.description.trim(),
        currency: (form.currency || "BDT").trim(),
        price: priceNum,
        isActive: Boolean(form.isActive),
        images: uniqImages(form.images),
      };

      const url = editing ? `/api/admin/products/${editing._id}` : "/api/admin/products";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message || "Save failed");
        return;
      }

      setOpen(false);
      setEditing(null);
      await fetchProducts();
    } finally {
      setBusy(null);
    }
  };

  const removeProduct = async (p: Product) => {
    if (!confirm(`Delete product "${p.name}"? This cannot be undone.`)) return;

    setBusy(p._id);
    try {
      const res = await fetch(`/api/admin/products/${p._id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message || "Delete failed");
        return;
      }

      setItems((prev) => prev.filter((x) => x._id !== p._id));
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className={ui.pageBg}>
      <div className={ui.container}>
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Products</h1>
            <p className="mt-1 text-sm text-gray-600">Manage store products (max 3 images each).</p>
          </div>

          <div className="flex items-center gap-2">
            <span className={badge}>{count} total</span>
            <button onClick={fetchProducts} className={topSoftBtn} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button onClick={openCreate} className={topPrimaryBtn}>
              Add product
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* List */}
        <section className={ui.card}>
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Catalog</div>
              <div className="text-xs text-gray-500">Latest first</div>
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
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
                <p className="text-sm font-semibold text-gray-900">No products yet</p>
                <p className="mt-1 text-xs text-gray-500">
                  Click “Add product” to create your first one.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((p) => {
                  const isBusy = busy === p._id;

                  return (
                    <div
                      key={p._id}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-4 transition hover:bg-gray-50"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-sm font-semibold text-gray-900">
                              {p.name}
                            </div>
                            <span className={badge}>{p.sku}</span>
                            <span className={badge}>{money(p.price, p.currency)}</span>
                            <span className={badge}>{p.isActive ? "active" : "inactive"}</span>
                          </div>

                          {p.description ? (
                            <div className="mt-2 text-xs text-gray-600">{p.description}</div>
                          ) : null}

                          {Array.isArray(p.images) && p.images.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {p.images.slice(0, 3).map((u) => (
                                <img
                                  key={u}
                                  src={u}
                                  alt="product"
                                  className="h-12 w-12 rounded-xl border border-gray-200 object-cover"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="mt-3 text-xs text-gray-400">No images</div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 sm:justify-end">
                          <button
                            className={topSoftBtn}
                            type="button"
                            onClick={() => openEdit(p)}
                            disabled={isBusy}
                          >
                            Edit
                          </button>

                          <button
                            className={dangerBtn}
                            type="button"
                            onClick={() => removeProduct(p)}
                            disabled={isBusy}
                          >
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

        <div className="mt-6 text-center text-xs text-gray-400">MyTapCard • Admin</div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />

          <div className="relative w-full max-w-2xl rounded-3xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="text-sm font-semibold text-gray-900">
                {editing ? "Edit product" : "Add product"}
              </div>
              <button className={modalSoftBtn} onClick={closeModal} disabled={!!busy}>
                Close
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={ui.label}>Name</label>
                  <input
                    className={ui.input}
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="PVC Tap Card"
                    disabled={!!busy}
                  />
                </div>

                <div className="space-y-1">
                  <label className={ui.label}>SKU</label>
                  <input
                    className={ui.input}
                    value={form.sku}
                    onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                    placeholder="PVC-01"
                    disabled={!!busy || !!editing}
                  />
                </div>

                <div className="space-y-1">
                  <label className={ui.label}>Price</label>
                  <input
                    className={ui.input}
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    inputMode="numeric"
                    placeholder="499"
                    disabled={!!busy}
                  />
                </div>

                <div className="space-y-1">
                  <label className={ui.label}>Currency</label>
                  <input
                    className={ui.input}
                    value={form.currency}
                    onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                    placeholder="BDT"
                    disabled={!!busy}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={ui.label}>Description</label>
                <textarea
                  className={textarea}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Short product description..."
                  disabled={!!busy}
                />
              </div>

              {/* Images */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={ui.label}>Images (max 3)</label>

                  <label className={cx(modalSoftBtn, "cursor-pointer")}>
                    {busy === "upload" ? "Uploading..." : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      multiple
                      onChange={(e) => onPickImages(e.target.files)}
                      disabled={busy === "upload" || form.images.length >= 3}
                    />
                  </label>
                </div>

                {form.images.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
                    No images yet. Upload up to 3.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {form.images.map((u) => (
                      <div key={u} className="relative">
                        <img
                          src={u}
                          alt="product"
                          className="h-20 w-20 rounded-2xl border border-gray-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(u)}
                          className="absolute -top-2 -right-2 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 shadow"
                          disabled={!!busy}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  disabled={!!busy}
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Active (visible on order page)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button className={modalSoftBtn} onClick={closeModal} disabled={!!busy}>
                  Cancel
                </button>
                <button className={modalPrimaryBtn} onClick={save} disabled={!!busy}>
                  {busy === "save" ? "Saving..." : "Save product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
