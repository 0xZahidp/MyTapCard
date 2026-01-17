"use client";

import AuthCard from "@/components/auth/AuthCard";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({ message: "Invalid response" }));

      if (res.ok) {
        router.push("/dashboard");
        router.refresh(); // ensures server components see the new cookie
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <h1 className="text-2xl font-bold mb-6 text-center">
        Login to MyTapCard
      </h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="w-full border px-3 py-2 rounded"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border px-3 py-2 rounded"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button
          className="w-full bg-black text-white py-2 rounded disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </AuthCard>
  );
}
