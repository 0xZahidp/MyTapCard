import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { redirectWithFallback, waitForVerifiedAuthSession } from "@/lib/auth-session";
import { getSafeOAuthNext } from "@/lib/oauth";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Finishing sign-in — MyTapCard" }] }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [message, setMessage] = useState("Finishing Google sign-in…");

  useEffect(() => {
    let active = true;

    async function finishOAuth() {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const next = getSafeOAuthNext(url.searchParams.get("next"));
      const oauthError =
        url.searchParams.get("error_description") ??
        url.searchParams.get("error") ??
        hashParams.get("error_description") ??
        hashParams.get("error");

      try {
        if (oauthError) {
          throw new Error(oauthError);
        }

        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        await waitForVerifiedAuthSession();
        await router.invalidate();

        if (!active) return;
        toast.success(next === "/settings" ? "Google connected" : "Signed in with Google");
        await redirectWithFallback(() => navigate({ to: next as never, replace: true }), next);
      } catch (error) {
        if (!active) return;
        const fallback = next === "/settings" ? "/settings" : "/auth/login";
        setMessage("Google sign-in could not be completed.");
        toast.error(error instanceof Error ? error.message : "Google sign-in failed");
        await navigate({ to: fallback as never, replace: true });
      }
    }

    void finishOAuth();

    return () => {
      active = false;
    };
  }, [navigate, router]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
      <div>
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
