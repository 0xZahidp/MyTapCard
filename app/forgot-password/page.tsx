"use client";

import AuthCard from "@/components/auth/AuthCard";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const input =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100";

  const primaryBtn =
    "w-full rounded-2xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success UI (prevents leaking)
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 flex items-center justify-center px-4 py-10">
      <AuthCard>
        <div className="text-center">
          <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900">
            MyTapCard
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Forgot password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            We’ll email you a reset link.
          </p>
        </div>

        {done ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            If an account exists for <b>{email}</b>, we sent a reset link.
            <div className="mt-3">
              <Link href="/login" className="text-sm font-semibold text-gray-900 underline underline-offset-4">
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Email</label>
              <input
                className={input}
                type="email"
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button className={primaryBtn} disabled={loading} type="submit">
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <div className="pt-1 text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </AuthCard>
    </main>
  );
}
