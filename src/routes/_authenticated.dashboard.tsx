import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProStatus } from "@/hooks/use-pro";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OnboardingWizard } from "@/components/onboarding-wizard";
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
  TrendingUp,
  MousePointerClick,
  Sparkles,
  CheckCircle2,
  Circle,
  Download,
  Share2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MyTapCard" }] }),
  component: DashboardPage,
});

interface LinkClick {
  id: string;
  link_id: string | null;
  platform: string | null;
  link_type: string;
  clicked_at: string;
}

function DashboardPage() {
  const { user } = useAuth();
  const { isPro, isTrial, proUntil } = useProStatus();
  const [profile, setProfile] = useState<any>(null);
  const [counts, setCounts] = useState({ links: 0, financial: 0 });
  const [clicks, setClicks] = useState<LinkClick[]>([]);
  const [linksList, setLinksList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [{ data: p }, { count: lc }, { count: fc }, { data: clkData }, { data: lData }] =
          await Promise.all([
            supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
            supabase
              .from("links")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id),
            supabase
              .from("financial_methods")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id),
            supabase
              .from("link_clicks")
              .select("id, link_id, platform, link_type, clicked_at")
              .eq("user_id", user.id)
              .order("clicked_at", { ascending: false })
              .limit(500),
            supabase
              .from("links")
              .select("id, label, type, platform, value")
              .eq("user_id", user.id)
              .limit(50),
          ]);

        setProfile(p);
        setCounts({ links: lc ?? 0, financial: fc ?? 0 });
        setClicks((clkData as LinkClick[]) ?? []);
        setLinksList(lData ?? []);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const publicUrl = profile?.username ? `${window.location.origin}/${profile.username}` : null;

  // Generate QR code for quick modal
  useEffect(() => {
    if (publicUrl) {
      QRCode.toDataURL(publicUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#1B3C53", light: "#FFFFFF" },
      }).then(setQrDataUrl);
    }
  }, [publicUrl]);

  // Analytics Computations
  const totalClicks = clicks.length;

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86400000;
  const clicksLast7Days = useMemo(
    () => clicks.filter((c) => new Date(c.clicked_at).getTime() >= sevenDaysAgo),
    [clicks, sevenDaysAgo],
  );

  // 7-day daily activity breakdown
  const dailyActivity = useMemo(() => {
    const days: { label: string; dateStr: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      const count = clicks.filter((c) => c.clicked_at.slice(0, 10) === dateStr).length;
      days.push({ label, dateStr, count });
    }
    return days;
  }, [clicks, now]);

  const maxDailyCount = useMemo(
    () => Math.max(...dailyActivity.map((d) => d.count), 1),
    [dailyActivity],
  );

  // Top Performing Links Leaderboard
  const topLinks = useMemo(() => {
    if (clicks.length === 0) return [];
    const countMap: Record<string, { count: number; platform?: string; label?: string }> = {};

    clicks.forEach((c) => {
      const key = c.link_id || c.platform || c.link_type;
      if (!countMap[key]) {
        const found = linksList.find((l) => l.id === c.link_id);
        countMap[key] = {
          count: 0,
          platform: c.platform || found?.platform || c.link_type,
          label: found?.label || c.platform || c.link_type,
        };
      }
      countMap[key].count += 1;
    });

    return Object.values(countMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [clicks, linksList]);

  // Profile setup checklist
  const checklist = useMemo(() => {
    return [
      {
        id: "username",
        label: "Set unique username",
        done: Boolean(profile?.username),
        to: "/profile",
      },
      {
        id: "avatar",
        label: "Add profile picture",
        done: Boolean(profile?.avatar_url),
        to: "/profile",
      },
      {
        id: "links",
        label: "Add 2+ contact or social links",
        done: counts.links >= 2,
        to: "/links",
      },
      {
        id: "financial",
        label: "Connect payment or crypto method",
        done: counts.financial >= 1,
        to: "/financial",
      },
    ];
  }, [profile, counts]);

  const completedSteps = checklist.filter((c) => c.done).length;
  const isProfileComplete = completedSteps === checklist.length;

  // Pro Expiry Calculation
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
    { to: "/design", label: "Design", icon: Palette, desc: "Themes & colors" },
    {
      to: "/financial",
      label: "Financial",
      icon: Wallet,
      desc: `${counts.financial} method${counts.financial === 1 ? "" : "s"}`,
    },
    { to: "/share", label: "Share & NFC", icon: QrCode, desc: "QR codes & flyers" },
    { to: "/preview", label: "Preview", icon: Eye, desc: "Live iPhone preview" },
    { to: "/settings", label: "Settings", icon: SettingsIcon, desc: "Security & Google" },
  ] as const;

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Card link copied to clipboard");
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${profile?.username || "mytapcard"}-qr.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor tap analytics, customize your card, and share your digital identity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWizardOpen(true)}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Take a quick tour of MyTapCard"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Guide
          </Button>
          {publicUrl && (
            <>
              <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
                <QrCode className="h-4 w-4" /> Quick QR
              </Button>
              <Button asChild variant="hero" size="sm">
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> View Card
                </a>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Pro Expiry Alert */}
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

      {/* Profile Snapshot & Public URL Bar */}
      {publicUrl ? (
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="h-14 w-14 ring-2 ring-primary/20 shrink-0">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt="Avatar" />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                {profile?.display_name?.[0] || profile?.username?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold truncate text-base">
                  {profile?.display_name || profile?.username}
                </span>
                {isPro && (
                  <span className="rounded-full bg-gradient-gold px-2 py-0.5 text-[10px] font-bold text-foreground">
                    PRO
                  </span>
                )}
              </div>
              <p className="truncate font-mono text-xs text-muted-foreground mt-0.5">{publicUrl}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
              <QrCode className="h-4 w-4" /> Show QR
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-5">
          <h3 className="font-semibold">Pick your username</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a unique username so people can find your digital business card.
          </p>
          <Button asChild variant="hero" size="sm" className="mt-3">
            <Link to="/profile">Set username</Link>
          </Button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Clicks */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Taps</span>
            <MousePointerClick className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
            {totalClicks}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Lifetime card link interactions</p>
        </div>

        {/* 7-Day Clicks */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">7-Day Clicks</span>
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
            {clicksLast7Days.length}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Clicks in the last 7 days</p>
        </div>

        {/* Active Links */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Links</span>
            <Link2 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
            {counts.links}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Contact & social platforms</p>
        </div>

        {/* Payment Methods */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Payment Channels</span>
            <Wallet className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
            {counts.financial}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Wallets & payment methods</p>
        </div>
      </div>

      {/* Analytics Breakdown & Top Links Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 7-Day Tap Timeline Chart */}
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold">Tap & Click Activity</h2>
              <p className="text-xs text-muted-foreground">Daily link engagement for the past 7 days</p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              Last 7 Days
            </span>
          </div>

          {totalClicks > 0 ? (
            <div className="mt-6 flex h-44 items-end gap-2 sm:gap-4 pt-6 pb-2">
              {dailyActivity.map((day) => {
                const heightPct = Math.max(12, Math.round((day.count / maxDailyCount) * 100));
                return (
                  <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[11px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.count}
                    </div>
                    <div className="w-full rounded-t-xl bg-secondary/80 overflow-hidden flex items-end h-28">
                      <div
                        className="w-full bg-gradient-primary rounded-t-xl transition-all duration-500 group-hover:brightness-110"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-8 text-center bg-secondary/20">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <h3 className="mt-2 text-sm font-semibold">No clicks recorded yet</h3>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Tap your NFC card or share your QR code to start tracking live visitor engagement.
              </p>
              <Button asChild variant="hero" size="sm" className="mt-4">
                <Link to="/share">
                  <Share2 className="h-3.5 w-3.5 mr-1" /> Share Your Card
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* Top Performing Links */}
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft flex flex-col">
          <h2 className="text-base sm:text-lg font-bold">Top Performing Links</h2>
          <p className="text-xs text-muted-foreground">Most clicked links by visitors</p>

          <div className="mt-4 flex-1 flex flex-col justify-center">
            {topLinks.length > 0 ? (
              <div className="space-y-3">
                {topLinks.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="capitalize">{item.label}</span>
                      <span className="text-muted-foreground">{item.count} clicks</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round((item.count / totalClicks) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <p>Link rankings appear once visitors start clicking your links.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border">
            <Link
              to="/links"
              className="flex items-center justify-between text-xs font-semibold text-primary hover:underline"
            >
              <span>Manage all links ({counts.links})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>

      {/* Card Setup Checklist (if not 100% complete) */}
      {!isProfileComplete && (
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold">Card Setup Checklist</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete these steps so your public profile looks professional when tapped.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary">
              {completedSteps} of {checklist.length} Complete
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps / checklist.length) * 100}%` }}
            />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {checklist.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 p-3 hover:bg-secondary/60 transition-colors"
              >
                <div className="flex items-center gap-2.5 text-xs font-medium">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={item.done ? "line-through text-muted-foreground" : "text-foreground"}>
                    {item.label}
                  </span>
                </div>
                {!item.done && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Navigation Tiles */}
      <div>
        <h2 className="text-base sm:text-lg font-bold mb-3">Quick Navigation</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tiles.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-elegant"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground group-hover:scale-105 transition-transform">
                  <t.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{t.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick QR Dialog Modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-sm max-w-[90vw] p-6 text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Instant Tap QR Code</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Let someone scan this code to instantly open your digital card.
            </DialogDescription>
          </DialogHeader>

          {qrDataUrl && (
            <div className="my-4 flex justify-center">
              <div className="rounded-2xl border border-border bg-white p-3 shadow-soft">
                <img src={qrDataUrl} alt="Quick QR Code" className="h-56 w-56 object-contain" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" /> Copy Link
            </Button>
            <Button variant="hero" size="sm" onClick={handleDownloadQr}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New User Onboarding Wizard */}
      <OnboardingWizard
        userId={user?.id}
        forceOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  );
}
