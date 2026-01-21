"use client";

import { useEffect, useMemo, useState } from "react";
import { cx, safeJson } from "@/lib/dashboard-helpers";
import { ui } from "@/components/dashboard/ui";

type AnyObj = Record<string, any>;

type FinancialItem = {
  _id: string;
  type: "mfs" | "bank";
  provider?: string; // bkash/nagad/rocket/upay/paypal/stripe/other
  fields?: AnyObj;   // structured fields
  order: number;
  isActive: boolean;
};

const MFS_PROVIDERS = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "upay", label: "Upay" },
  { value: "paypal", label: "PayPal" },
  { value: "stripe", label: "Stripe" },
  { value: "other", label: "Other" },
];

function reorderList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const arr = [...list];
  const [moved] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, moved);
  return arr;
}

function prettyProvider(p?: string) {
  const s = String(p || "").toLowerCase();
  if (!s) return "MFS";
  if (s === "bkash") return "bKash";
  if (s === "nagad") return "Nagad";
  if (s === "rocket") return "Rocket";
  if (s === "upay") return "Upay";
  if (s === "paypal") return "PayPal";
  if (s === "stripe") return "Stripe";
  return p!;
}

export default function FinancialTab() {
  const [items, setItems] = useState<FinancialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // drag
  const [dragId, setDragId] = useState<string | null>(null);

  // mode
  const [mode, setMode] = useState<"mfs" | "bank">("mfs");

  // MFS form
  const [provider, setProvider] = useState("bkash");
  const [mfsName, setMfsName] = useState("");
  const [mfsNumber, setMfsNumber] = useState("");
  const [mfsType, setMfsType] = useState<"Personal" | "Agent">("Personal");

  // Bank form
  const [bankName, setBankName] = useState("");
  const [holderName, setHolderName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [branch, setBranch] = useState("");
  const [routingNo, setRoutingNo] = useState("");
  const [swift, setSwift] = useState("");

  const sorted = useMemo(
    () => [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [items]
  );

  const refresh = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/financial", { credentials: "same-origin" });
      const data = await safeJson<any>(res);
      if (!res.ok) {
        setItems([]);
        setNotice({ type: "err", text: data?.message || "Failed to load" });
        return;
      }
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createItem = async () => {
    setNotice(null);

    let payload: any = null;

    if (mode === "mfs") {
      const name = mfsName.trim();
      const number = mfsNumber.trim();

      if (!number) {
        setNotice({ type: "err", text: "MFS number is required." });
        return;
      }

      payload = {
        type: "mfs",
        provider,
        fields: {
          accountName: name,
          number,
          personalOrAgent: mfsType,
        },
      };
    } else {
      const b = bankName.trim();
      const h = holderName.trim();
      const a = accountNo.trim();
      const br = branch.trim();

      if (!b || !h || !a) {
        setNotice({ type: "err", text: "Bank Name, Holder Name, and A/C No are required." });
        return;
      }

      payload = {
        type: "bank",
        fields: {
          bankName: b,
          holderName: h,
          accountNo: a,
          branch: br,
          routingNo: routingNo.trim(),
          swift: swift.trim(),
        },
      };
    }

    setLoading(true);
    try {
      const res = await fetch("/api/financial", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await safeJson<any>(res);
      if (!res.ok) {
        setNotice({ type: "err", text: data?.message || "Failed to add" });
        return;
      }

      setItems((prev) => [...prev, data as FinancialItem]);

      // reset inputs lightly
      setMfsName("");
      setMfsNumber("");
      setBankName("");
      setHolderName("");
      setAccountNo("");
      setBranch("");
      setRoutingNo("");
      setSwift("");

      setNotice({ type: "ok", text: "Added." });
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/financial", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await safeJson<any>(res);
      if (!res.ok) {
        setNotice({ type: "err", text: data?.message || "Failed to delete" });
        return;
      }
      setItems((prev) => prev.filter((x) => x._id !== id));
      setNotice({ type: "ok", text: "Deleted." });
    } finally {
      setLoading(false);
    }
  };

  const persistReorder = async (ordered: FinancialItem[]) => {
    const orderedIds = ordered.map((x) => x._id);
    const res = await fetch("/api/financial/reorder", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
    if (!res.ok) {
      const data = await safeJson<any>(res);
      throw new Error(data?.message || "Reorder failed");
    }
  };

  const onDropToIndex = async (toIndex: number) => {
    if (!dragId) return;

    const fromIndex = sorted.findIndex((x) => x._id === dragId);
    if (fromIndex < 0 || fromIndex === toIndex) {
      setDragId(null);
      return;
    }

    const next = reorderList(sorted, fromIndex, toIndex).map((it, idx) => ({
      ...it,
      order: idx,
    }));

    setItems(next);

    try {
      await persistReorder(next);
      setNotice({ type: "ok", text: "Reordered." });
    } catch (e: any) {
      setNotice({ type: "err", text: e?.message || "Reorder failed" });
      refresh(); // rollback
    } finally {
      setDragId(null);
    }
  };

  const itemTitle = (it: FinancialItem) => (it.type === "mfs" ? prettyProvider(it.provider) : "Bank Account");
  const itemSummary = (it: FinancialItem) => {
    const f = (it.fields || {}) as AnyObj;
    if (it.type === "mfs") return f.number ? String(f.number) : "";
    return f.bankName ? `${f.bankName}${f.accountNo ? ` • ${f.accountNo}` : ""}` : "";
  };

  return (
    <div className={cx(ui.card, "overflow-hidden")}>
      <div className={cx(ui.cardPad)}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Financial</h2>
          <button className={cx(ui.miniBtn)} type="button" onClick={refresh} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {notice && (
          <div
            className={cx(
              "mt-3 rounded-xl border px-3 py-2 text-sm",
              notice.type === "ok"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            )}
          >
            {notice.text}
          </div>
        )}

        {/* Mode switch */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("mfs")}
            className={cx(
              ui.miniBtn,
              "px-4 py-2",
              mode === "mfs" && "border-gray-900 text-gray-900"
            )}
          >
            MFS (bKash/Nagad/etc)
          </button>
          <button
            type="button"
            onClick={() => setMode("bank")}
            className={cx(
              ui.miniBtn,
              "px-4 py-2",
              mode === "bank" && "border-gray-900 text-gray-900"
            )}
          >
            Bank
          </button>
        </div>

        {/* Form */}
        {mode === "mfs" ? (
          <div className="mt-3 grid gap-2 md:grid-cols-[160px_1fr_1fr_120px]">
            <select className={cx(ui.input)} value={provider} onChange={(e) => setProvider(e.target.value)}>
              {MFS_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            <input
              className={cx(ui.input)}
              placeholder="Name (optional)"
              value={mfsName}
              onChange={(e) => setMfsName(e.target.value)}
            />

            <input
              className={cx(ui.input)}
              placeholder="Number (required)"
              value={mfsNumber}
              onChange={(e) => setMfsNumber(e.target.value)}
            />

            <button
              type="button"
              className={cx(ui.primaryBtn, "h-[44px]")}
              onClick={createItem}
              disabled={loading}
            >
              Add
            </button>

            <div className="md:col-span-4">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Type:</span>
                <button
                  type="button"
                  className={cx(ui.miniBtn, "px-3 py-1", mfsType === "Personal" && "border-gray-900 text-gray-900")}
                  onClick={() => setMfsType("Personal")}
                >
                  Personal
                </button>
                <button
                  type="button"
                  className={cx(ui.miniBtn, "px-3 py-1", mfsType === "Agent" && "border-gray-900 text-gray-900")}
                  onClick={() => setMfsType("Agent")}
                >
                  Agent
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <input className={cx(ui.input)} placeholder="Bank Name (required)" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            <input className={cx(ui.input)} placeholder="A/C Holder Name (required)" value={holderName} onChange={(e) => setHolderName(e.target.value)} />
            <input className={cx(ui.input)} placeholder="A/C Number (required)" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} />
            <input className={cx(ui.input)} placeholder="Branch (optional)" value={branch} onChange={(e) => setBranch(e.target.value)} />
            <input className={cx(ui.input)} placeholder="Routing Number (optional)" value={routingNo} onChange={(e) => setRoutingNo(e.target.value)} />
            <input className={cx(ui.input)} placeholder="SWIFT Code (optional)" value={swift} onChange={(e) => setSwift(e.target.value)} />

            <div className="md:col-span-2">
              <button
                type="button"
                className={cx(ui.primaryBtn, "h-[44px] w-full")}
                onClick={createItem}
                disabled={loading}
              >
                Add Bank Account
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="mt-4 space-y-2">
          {sorted.length === 0 ? (
            <div className="text-sm text-gray-500">No financial items yet.</div>
          ) : (
            sorted.map((it, idx) => (
              <div
                key={it._id}
                className={cx(ui.row, "cursor-move select-none")}
                draggable
                onDragStart={() => setDragId(it._id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropToIndex(idx)}
                title="Drag to reorder"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900">{itemTitle(it)}</div>
                  <div className="text-xs text-gray-500 truncate">{itemSummary(it)}</div>
                </div>

                <button
                  type="button"
                  className={cx(ui.miniBtn, "border-red-200 text-red-700 hover:bg-red-50")}
                  onClick={() => deleteItem(it._id)}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 text-xs text-gray-400">Tip: drag any row to reorder.</div>
      </div>
    </div>
  );
}
