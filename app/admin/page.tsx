"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/payments")
      .then(res => res.json())
      .then(setPayments);
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Pending Payments
      </h1>

      {payments.map((p) => (
        <div
          key={p._id}
          className="border rounded p-4 mb-3 flex justify-between"
        >
          <div>
            <p>Email: {p.userId.email}</p>
            <p>Method: {p.method}</p>
            <p>Txn: {p.transactionId}</p>
            <p>Amount: {p.amount}</p>
          </div>

          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={async () => {
              await fetch("/api/admin/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  paymentId: p._id,
                  userId: p.userId._id,
                }),
              });
              location.reload();
            }}
          >
            Approve
          </button>
        </div>
      ))}
    </main>
  );
}
