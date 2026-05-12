import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell, GoogleIcon } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/ui/password-field";
import { useGlobalLoading } from "@/components/ui/loading-overlay";
import { redirectWithFallback, waitForVerifiedAuthSession } from "@/lib/auth-session";

export const Route = createFileRoute("/auth/register")({
  head: () => ({ meta: [{ title: "Create your MyTapCard" }] }),
  component: RegisterPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Add your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters").max(72),
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  useGlobalLoading(loading, "auth-register");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const ref = new URLSearchParams(window.location.search).get("ref") ?? undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name, ...(ref ? { ref } : {}) },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created — enjoy your 14-day Pro trial!");
      window.location.assign("/dashboard");
    } else {
      toast.success("Check your email to confirm your account.");
      navigate({ to: "/auth/login" });
    }
  }

  async function googleSignIn() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;

    try {
      await waitForVerifiedAuthSession();
    } catch (sessionError) {
      setLoading(false);
      toast.error(
        sessionError instanceof Error ? sessionError.message : "Unable to verify your session.",
      );
      return;
    }

    setLoading(false);
    await redirectWithFallback(() => navigate({ to: "/dashboard", replace: true }), "/dashboard");
  }

  return (
    <AuthShell
      title="Create your card"
      subtitle="It's free. No credit card required."
      footer={
        <>
          Already have one?{" "}
          <Link
            to="/auth/login"
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Morgan"
          />
        </div>
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
          <Label htmlFor="password">Password</Label>
          <PasswordField
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
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
