import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, GoogleIcon } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/ui/password-field";
import { useGlobalLoading } from "@/components/ui/loading-overlay";
import { useAuth } from "@/hooks/use-auth";
import { redirectWithFallback, waitForVerifiedAuthSession } from "@/lib/auth-session";
import { getOAuthRedirectUrl } from "@/lib/oauth";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Log in — MyTapCard" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  useGlobalLoading(loading, "auth-login");

  useEffect(() => {
    if (!authLoading && user) {
      void redirectWithFallback(() => navigate({ to: "/dashboard", replace: true }), "/dashboard");
    }
  }, [authLoading, navigate, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setLoading(false);
      toast.error("No session returned. Please try again.");
      return;
    }

    try {
      await waitForVerifiedAuthSession();
    } catch (sessionError) {
      setLoading(false);
      toast.error(
        sessionError instanceof Error ? sessionError.message : "Unable to verify your session.",
      );
      return;
    }

    await router.invalidate();
    setLoading(false);
    toast.success("Welcome back!");
    await redirectWithFallback(() => navigate({ to: "/dashboard", replace: true }), "/dashboard");
  }

  async function googleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthRedirectUrl("/dashboard"),
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.info("Opening Google sign-in…");
    setLoading(false);
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your MyTapCard account"
      footer={
        <>
          New here?{" "}
          <Link
            to="/auth/register"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot?
            </Link>
          </div>
          <PasswordField
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
      </div>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={googleSignIn}
        disabled={loading}
      >
        <GoogleIcon className="h-5 w-5" /> Continue with Google
      </Button>
    </AuthShell>
  );
}
