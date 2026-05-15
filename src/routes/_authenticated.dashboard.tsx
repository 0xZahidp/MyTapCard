import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProStatus } from "@/hooks/use-pro";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CalendarClock,
  Copy,
  Crown,
  ExternalLink,
  Link2,
  QrCode,
  User,
  Wallet,
  Eye,
  Palette,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MyTapCard" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const { isPro, isTrial, proUntil } = useProStatus();
  const [profile, setProfile] = useState<any>(null);
  const [counts, setCounts] = useState({ links: 0, financial: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { count: lc }, { count: fc }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("links").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase
          .from("financial_methods")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);
      setProfile(p);
      setCounts({ links: lc ?? 0, financial: fc ?? 0 });
    })();
  }, [user]);

  const publicUrl = profile?.username ? `${window.location.origin}/${profile.username}` : null;
  const daysLeft = proUntil
    ? Math.max(0, Math.ceil((new Date(proUntil).getTime() - Date.now()) / 86400000))
    : null;
  const expiryLabel = isTrial ? "trial" : "Pro";
  const showExpiryNotice = isPro && proUntil && daysLeft !== null;
  const isExpiringSoon = showExpiryNotice && daysLeft <= 7;

  const tiles = [
    { to: "/profile", label: "Profile", icon: User, desc: "Name, bio, avatar" },
    {
      to: "/links",
      label: "Links",
      icon: Link2,
      desc: `${counts.links} link${counts.links === 1 ? "" : "s"}`,
    },
    { to: "/design", label: "Design", icon: Palette, desc: "Templates, colors, fonts" },
    {
      to: "/financial",
      label: "Financial",
      icon: Wallet,
      desc: `${counts.financial} method${counts.financial === 1 ? "" : "s"}`,
    },
    { to: "/share", label: "Share", icon: QrCode, desc: "QR & link" },
    { to: "/preview", label: "Preview", icon: Eye, desc: "See public page" },
    { to: "/settings", label: "Settings", icon: SettingsIcon, desc: "Account & security" },
  ] as const;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">
          Welcome back{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">Manage your tap card from here.</p>
      </header>

      {showExpiryNotice && (
        <section
          className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 shadow-soft ${
            isExpiringSoon ? "border-amber-300 bg-amber-50 text-amber-950" : "border-border bg-card"
          }`}
        >
          {isExpiringSoon ? (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          ) : (
            <CalendarClock className="h-5 w-5 shrink-0 text-primary" />
          )}
          <div className="min-w-0 flex-1 text-sm">
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              <span>
                Your {expiryLabel}{" "}
                {daysLeft <= 0 ? "expires today" : isExpiringSoon ? "expires soon" : "is active"}
              </span>
              {!isTrial && <Crown className="h-4 w-4 text-yellow-500" />}
            </div>
            <div className={isExpiringSoon ? "text-amber-900/80" : "text-muted-foreground"}>
              {daysLeft <= 0
                ? "Renew now to keep Pro features active."
                : isExpiringSoon
                  ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left. Upgrade or renew to avoid losing Pro features.`
                  : `Expires on ${new Date(proUntil).toLocaleDateString()}. We'll alert you again when it gets close.`}
            </div>
          </div>
          <Button
            asChild
            variant={isExpiringSoon ? "outline" : "hero"}
            size="sm"
            className={isExpiringSoon ? "border-amber-400 bg-white" : undefined}
          >
            <Link to="/subscription">{isExpiringSoon ? "Renew" : "Manage"}</Link>
          </Button>
        </section>
      )}

      {publicUrl ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your public URL
            </div>
            <div className="truncate font-mono text-sm">{publicUrl}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(publicUrl);
              toast.success("Copied");
            }}
          >
            <Copy className="h-4 w-4" /> Copy
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Open
            </a>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-5">
          <h3 className="font-semibold">Pick your username</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a username so people can find your card.
          </p>
          <Button asChild variant="hero" size="sm" className="mt-3">
            <Link to="/profile">Set username</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-elegant"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                <t.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
