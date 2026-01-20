"use client";

import { useState } from "react";
import { ui } from "@/components/dashboard/ui";
import { safeJson } from "@/lib/dashboard-helpers";

export default function PaymentsTab({
  busy,
  setBusy,
  setNotice,
}: {
  busy: any;
  setBusy: any;
  setNotice: any;
}) {
  const [paymentForm, setPaymentForm] = useState({
    method: "",
    transactionId: "",
    amount: 0,
  });

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy((b: any) => ({ ...b, pay: true }));
    setNotice(null);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(paymentForm),
      });

      const data = await safeJson<any>(res);

      if (!res.ok) {
        setNotice({ type: "err", text: data.message || "Payment submit failed" });
        return;
      }

      setNotice({ type: "ok", text: data.message || "Submitted ✅" });
      setPaymentForm({ method: "", transactionId: "", amount: 0 });
    } finally {
      setBusy((b: any) => ({ ...b, pay: false }));
    }
  };

  return (
    <section className={ui.card}>
      <div className={ui.cardPad}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className={ui.sectionTitle}>Upgrade to Pro</h2>
            <p className={ui.sectionDesc}>Submit a payment request to upgrade your plan.</p>
          </div>

          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-700">
            Manual
          </span>
        </div>

        <form onSubmit={submitPayment} className="mt-5 space-y-3">
          <div className="space-y-1">
            <div className={ui.label}>Payment method</div>
            <select
              className={ui.select}
              value={paymentForm.method}
              onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
            >
              <option value="">Select payment method</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className={ui.label}>Transaction ID</div>
            <input
              placeholder="e.g. 9A1B2C3D4E"
              className={ui.input}
              value={paymentForm.transactionId}
              onChange={(e) => setPaymentForm((p) => ({ ...p, transactionId: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <div className={ui.label}>Amount</div>
            <input
              type="number"
              placeholder="e.g. 499"
              className={ui.input}
              value={paymentForm.amount ? String(paymentForm.amount) : ""}
              onChange={(e) => setPaymentForm((p) => ({ ...p, amount: Number(e.target.value) }))}
            />
          </div>

          <button className={ui.primaryBtn} disabled={!!busy.pay}>
            {busy.pay ? "Submitting..." : "Submit payment"}
          </button>

          <p className="text-xs text-gray-500">After verification, your account will be upgraded to Pro.</p>
        </form>
      </div>
    </section>
  );
}
