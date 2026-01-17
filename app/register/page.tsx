"use client";

import AuthCard from "@/components/auth/AuthCard";
import { useState } from "react";


export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    alert(data.message);
  };

  return (
    <AuthCard>
      <h1 className="text-2xl font-bold mb-6 text-center">
        Create your MyTapCard
      </h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          placeholder="Full Name"
          className="w-full border px-3 py-2 rounded"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full border px-3 py-2 rounded"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border px-3 py-2 rounded"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button className="w-full bg-black text-white py-2 rounded">
          Create Account
        </button>
      </form>
    </AuthCard>
  );
}
