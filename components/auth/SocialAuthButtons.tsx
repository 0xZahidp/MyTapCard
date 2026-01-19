"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type Provider = "google" | "facebook";

export default function SocialAuthButtons({
  callbackUrl = "/dashboard",
  variant = "full",
}: {
  callbackUrl?: string;
  variant?: "full" | "compact";
}) {
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null);

  const softBtn =
    "w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60";

  const oauthBtn =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2";

  const btnClass = variant === "compact" ? oauthBtn : softBtn;

  async function handleOAuth(provider: Provider) {
    if (oauthLoading) return;
    setOauthLoading(provider);
    // Redirect handled by NextAuth
    await signIn(provider, { callbackUrl });
    // If redirect doesn’t happen (blocked popup etc.), reset
    setTimeout(() => setOauthLoading(null), 1500);
  }

  const disabled = oauthLoading !== null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={disabled}
        className={btnClass}
      >
        {oauthLoading === "google" ? "Connecting to Google..." : "Continue with Google"}
      </button>

      <button
        type="button"
        onClick={() => handleOAuth("facebook")}
        disabled={disabled}
        className={btnClass}
      >
        {oauthLoading === "facebook"
          ? "Connecting to Facebook..."
          : "Continue with Facebook"}
      </button>
    </div>
  );
}
