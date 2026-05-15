import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProStatus } from "@/hooks/use-pro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/ui/password-field";
import { useGlobalLoading } from "@/components/ui/loading-overlay";
import { Textarea } from "@/components/ui/textarea";
import { KeyRound, Link as LinkIcon, ShieldCheck, Sparkles, Crown, Copy, Gift } from "lucide-react";
import { getOAuthRedirectUrl } from "@/lib/oauth";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — MyTapCard" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { isPro, proUntil, referralCode } = useProStatus();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [identities, setIdentities] = useState<{ provider: string; id: string }[]>([]);
  const [reqMsg, setReqMsg] = useState("");
  const [reqStatus, setReqStatus] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<
    Array<{
      id: string;
      referred_id: string;
      created_at: string;
      rewarded: boolean;
      name?: string | null;
    }>
  >([]);
  useGlobalLoading(savingPwd || linking || unlinking, "settings-actions");

  useEffect(() => {
    supabase.auth.getUserIdentities().then(({ data }) => {
      const ids = (data?.identities ?? []).map((i) => ({
        provider: i.provider,
        id: i.identity_id ?? i.id,
      }));
      setIdentities(ids);
    });
    if (user) {
      supabase
        .from("pro_requests" as any)
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .then(({ data }) => setReqStatus((data as any[])?.[0]?.status ?? null));
      (async () => {
        const { data: refs } = await supabase
          .from("referrals" as any)
          .select("id, referred_id, created_at, rewarded")
          .eq("referrer_id", user.id)
          .order("created_at", { ascending: false });
        const list = (refs as any[]) ?? [];
        if (list.length === 0) {
          setReferrals([]);
          return;
        }
        const ids = list.map((r) => r.referred_id);
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, username")
          .in("id", ids);
        const nameMap = new Map(
          ((profs as any[]) ?? []).map((p) => [p.id, p.display_name ?? p.username]),
        );
        setReferrals(list.map((r) => ({ ...r, name: nameMap.get(r.referred_id) ?? null })));
      })();
    }
  }, [user]);

  const referralCount = referrals.length;
  const monthRewards = referrals.filter(
    (r) => r.rewarded && Date.now() - new Date(r.created_at).getTime() < 30 * 86400000,
  ).length;
  const remainingThisMonth = Math.max(0, 10 - monthRewards);

  async function requestPro() {
    if (!user) return;
    const { error } = await supabase
      .from("pro_requests" as any)
      .insert({ user_id: user.id, message: reqMsg } as any);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request submitted — admins will review it.");
    setReqStatus("pending");
    setReqMsg("");
  }

  const referralUrl = referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth/register?ref=${referralCode}`
    : "";
  function copyRef() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    toast.success("Referral link copied");
  }

  async function changePassword() {
    if (pwd.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (pwd !== pwd2) {
      toast.error("Passwords don't match");
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSavingPwd(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPwd("");
    setPwd2("");
    toast.success("Password updated");
  }

  async function linkGoogle() {
    setLinking(true);
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo: getOAuthRedirectUrl("/settings"),
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      toast.error(error.message);
      setLinking(false);
      return;
    }

    toast.info("Opening Google connection…");
    setLinking(false);
  }

  async function unlinkGoogle() {
    setUnlinking(true);
    const { data } = await supabase.auth.getUserIdentities();
    const google = data?.identities?.find((i) => i.provider === "google");
    if (!google) {
      setUnlinking(false);
      return;
    }
    const { error } = await supabase.auth.unlinkIdentity(google);
    setUnlinking(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Google disconnected");
    setIdentities((prev) => prev.filter((i) => i.provider !== "google"));
  }

  const hasGoogle = identities.some((i) => i.provider === "google");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Account security and connected sign-in methods.
        </p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-4 w-4" /> Plan
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPro ? "Pro features unlocked." : "Free plan — request Pro to unlock everything."}
              {proUntil && new Date(proUntil).getTime() > Date.now() && (
                <>
                  {" "}
                  Trial / referral Pro until{" "}
                  <strong>{new Date(proUntil).toLocaleDateString()}</strong>.
                </>
              )}
            </p>
          </div>
          <div
            className={`rounded-full px-3 py-1 text-xs font-bold ${isPro ? "bg-gradient-gold text-foreground" : "bg-secondary text-foreground"}`}
          >
            {isPro ? (
              <>
                <Crown className="mr-1 inline h-3 w-3" /> PRO
              </>
            ) : (
              "FREE"
            )}
          </div>
        </div>
        {!isPro && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="reqmsg">Request Pro upgrade</Label>
            <Textarea
              id="reqmsg"
              rows={2}
              value={reqMsg}
              onChange={(e) => setReqMsg(e.target.value)}
              placeholder="Tell admins why you need Pro (optional)"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {reqStatus === "pending"
                  ? "Your previous request is awaiting review."
                  : reqStatus === "rejected"
                    ? "Last request was rejected — you can submit again."
                    : "An admin will review your request."}
              </span>
              <Button variant="hero" onClick={requestPro} disabled={reqStatus === "pending"}>
                <Crown className="h-4 w-4" /> {reqStatus === "pending" ? "Pending…" : "Request Pro"}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Gift className="h-4 w-4" /> Refer & earn
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Get <strong>3 days of Pro</strong> for each friend who signs up. Up to 10 rewards per
          rolling 30 days.
        </p>
        <div className="mt-3 flex gap-2">
          <Input readOnly value={referralUrl} className="font-mono text-xs" />
          <Button variant="outline" onClick={copyRef}>
            <Copy className="h-4 w-4" /> Copy
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-secondary/50 p-3">
            <div className="text-2xl font-bold">{referralCount}</div>
            <div className="text-xs text-muted-foreground">Total referrals</div>
          </div>
          <div className="rounded-xl bg-secondary/50 p-3">
            <div className="text-2xl font-bold">{monthRewards}</div>
            <div className="text-xs text-muted-foreground">Rewards this month</div>
          </div>
          <div className="rounded-xl bg-gradient-gold/40 p-3">
            <div className="text-2xl font-bold">{remainingThisMonth}</div>
            <div className="text-xs text-muted-foreground">Remaining capacity</div>
          </div>
        </div>
        {referrals.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Friend</th>
                  <th className="px-3 py-2 text-left">Joined</th>
                  <th className="px-3 py-2 text-right">Reward</th>
                </tr>
              </thead>
              <tbody>
                {referrals.slice(0, 20).map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">{r.name ?? r.referred_id.slice(0, 8)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.rewarded ? (
                        <span className="font-medium text-primary">+3 days Pro</span>
                      ) : (
                        <span className="text-muted-foreground">capped</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <KeyRound className="h-4 w-4" /> Change password
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use at least 8 characters. We recommend a unique passphrase.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pwd">New password</Label>
            <PasswordField
              id="pwd"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd2">Confirm</Label>
            <PasswordField
              id="pwd2"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="hero" onClick={changePassword} disabled={savingPwd || !pwd || !pwd2}>
            {savingPwd ? "Updating…" : "Update password"}
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <LinkIcon className="h-4 w-4" /> Connected accounts
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in faster by linking your Google account.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/30 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-card shadow-soft">
              <span className="text-lg font-bold">G</span>
            </div>
            <div>
              <div className="font-semibold">Google</div>
              <div className="text-xs text-muted-foreground">
                {hasGoogle ? "Connected" : "Not connected"}
              </div>
            </div>
          </div>
          {hasGoogle ? (
            <Button variant="outline" size="sm" onClick={unlinkGoogle} disabled={unlinking}>
              {unlinking ? "Disconnecting…" : "Disconnect"}
            </Button>
          ) : (
            <Button variant="hero" size="sm" onClick={linkGoogle} disabled={linking}>
              {linking ? "Opening…" : "Connect Google"}
            </Button>
          )}
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            We never post on your behalf. Linking is used solely to let you sign in with one tap.
          </span>
        </div>
      </section>
    </div>
  );
}
