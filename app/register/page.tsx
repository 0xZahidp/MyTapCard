"use client";

import AuthCard from "@/components/auth/AuthCard";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";


export default function RegisterPage() {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);

  const input =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100";

  const primaryBtn =
    "w-full rounded-2xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60";

  const softBtn =
    "w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60";

  const oauthBtn =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2";

  const dividerWrap = "relative my-5";
  const dividerLine = "h-px w-full bg-gray-200";
  const dividerText =
    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-semibold text-gray-500";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || oauthLoading) return;

    setLoading(true);

    const password = passwordRef.current?.value || "";

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => ({ message: "Invalid response" }));

      // clear password ASAP (success or fail)
      if (passwordRef.current) passwordRef.current.value = "";

      if (res.ok) {
        router.push("/login");
      } else {
        alert(data.message || "Registration failed");
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

    try {
      // Option A: simple redirect to your backend oauth route
      window.location.href = provider === "google" ? "/api/auth/google" : "/api/auth/facebook";

      // Option B: NextAuth (uncomment import above) — choose your callback:
      // await signIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      alert("Could not start social login. Please try again.");
      setOauthLoading(null);
    }
  };

  const isBusy = loading || oauthLoading !== null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 flex items-center justify-center px-4 py-10">
      <AuthCard>
        {/* Small brand header */}
        <div className="text-center">
          <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900">
            MyTapCard
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Create account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Register to start using MyTapCard.
          </p>
        </div>

        <div className="mt-6">
          <SocialAuthButtons callbackUrl="/dashboard" variant="compact" />
        </div>


        {/* Divider */}
        <div className={dividerWrap}>
          <div className={dividerLine} />
          <div className={dividerText}>or</div>
        </div>

        {/* Email register */}
        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="on">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Your name"
              className={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              disabled={isBusy}
            />
          </div>

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
              disabled={isBusy}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Password</label>
            <input
              ref={passwordRef}
              type="password"
              name="password"
              placeholder="Create a password"
              className={input}
              required
              autoComplete="new-password"
              disabled={isBusy}
            />
          </div>

          <button className={primaryBtn} disabled={isBusy} type="submit">
            {loading ? "Creating..." : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className={softBtn}
            disabled={isBusy}
          >
            Already have an account? Login
          </button>

          <p className="pt-2 text-center text-xs text-gray-500">
            By creating an account, you agree to our{" "}
            <span className="font-semibold text-gray-700">Terms</span> and{" "}
            <span className="font-semibold text-gray-700">Privacy Policy</span>.
          </p>
        </form>
      </AuthCard>
    </main>
  );
}
