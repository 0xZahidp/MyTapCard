"use client";

import AuthCard from "@/components/auth/AuthCard";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";
import { safeNext } from "@/lib/next-url";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const nextUrl = safeNext(nextParam, "/dashboard");

  const passwordRef = useRef<HTMLInputElement | null>(null);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);

  const input =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100";

  const primaryBtn =
    "w-full rounded-2xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60";

  const softBtn =
    "w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || oauthLoading) return;

    setLoading(true);
    const password = passwordRef.current?.value || "";

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({ message: "Invalid response" }));

      if (passwordRef.current) passwordRef.current.value = "";

      if (res.ok) {
        router.push(nextUrl);
        router.refresh();
      } else {
        alert(data.message || "Login failed");
      }
    } catch {
      if (passwordRef.current) passwordRef.current.value = "";
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    if (loading || oauthLoading) return;
    setOauthLoading(provider);

    await signIn(provider, { callbackUrl: nextUrl });

    setTimeout(() => setOauthLoading(null), 1500);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 flex items-center justify-center px-4 py-10">
      <AuthCard>
        <div className="text-center">
          <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900">
            MyTapCard
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Login to continue.
          </p>
        </div>

        <div className="mt-6">
          <SocialAuthButtons callbackUrl={nextUrl} variant="compact" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="on">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              className={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Password</label>
            <input
              ref={passwordRef}
              type="password"
              name="password"
              placeholder="••••••••"
              className={input}
              required
              autoComplete="current-password"
            />
          </div>

          <button className={primaryBtn} disabled={loading || !!oauthLoading} type="submit">
            {loading ? "Logging in..." : "Login"}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/register?next=${encodeURIComponent(nextUrl)}`)}
            className={softBtn}
            disabled={loading || !!oauthLoading}
          >
            New here? Create an account
          </button>

          <div className="pt-2 flex items-center justify-between">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Forgot password?
            </Link>

            <Link
              href="/"
              className="text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Back to home
            </Link>
          </div>
        </form>
      </AuthCard>
    </main>
  );
}
