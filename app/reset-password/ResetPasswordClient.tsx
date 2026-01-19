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
        {/* UI unchanged */}
        {/* … */}
      </AuthCard>
    </main>
  );
}
