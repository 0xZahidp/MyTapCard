"use client";

import AuthCard from "@/components/auth/AuthCard";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function ResetPasswordClient() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";

  const passwordRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const input =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100";

  const primaryBtn =
    "w-full rounded-2xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const password = passwordRef.current?.value || "";
    setLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.message || "Reset failed");
        return;
      }

      alert("Password updated ✅");
      router.push("/login");
    } finally {
      setLoading(false);
      if (passwordRef.current) passwordRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 flex items-center justify-center px-4 py-10">
      <AuthCard>
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900">
            MyTapCard
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Reset password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter a new password (min 8 characters).
          </p>
        </div>

        {!token ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Missing reset token.
            <div className="mt-3">
              <Link
                href="/forgot-password"
                className="font-semibold underline underline-offset-4"
              >
                Request a new link
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                New password
              </label>
              <input
                ref={passwordRef}
                className={input}
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <button className={primaryBtn} disabled={loading} type="submit">
              {loading ? "Updating..." : "Update password"}
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
