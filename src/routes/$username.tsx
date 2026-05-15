import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormattedBio } from "@/components/formatted-bio";
import {
  User as UserIcon,
  ChevronRight,
  Copy,
  Wallet,
  Link2,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  Send,
  Sparkles,
  Quote,
  Megaphone,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/$username")({
  loader: async ({ params }) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", params.username)
      .eq("public_enabled", true)
      .maybeSingle();
    if (!profile) throw notFound();
    const [{ data: groups }, { data: links }, { data: cards }, { data: financial }] =
      await Promise.all([
        supabase
          .from("link_groups")
          .select("*")
          .eq("user_id", profile.id)
          .eq("hidden", false)
          .order("position"),
        supabase
          .from("links")
          .select("*")
          .eq("user_id", profile.id)
          .eq("hidden", false)
          .order("position"),
        supabase
          .from("link_cards" as any)
          .select("*")
          .eq("user_id", profile.id)
          .eq("hidden", false)
          .order("position"),
        profile.financial_enabled
          ? supabase
              .from("financial_methods")
              .select("*")
              .eq("user_id", profile.id)
              .eq("hidden", false)
              .order("position")
          : Promise.resolve({ data: [] as any[] }),
      ]);
    return {
      profile,
      groups: groups ?? [],
      links: links ?? [],
      cards: (cards ?? []) as any[],
      financial: financial ?? [],
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: `${loaderData.profile.display_name ?? loaderData.profile.username} — MyTapCard`,
          },
          {
            name: "description",
            content:
              loaderData.profile.bio ??
              "View links, contact details, and payment options on this digital business card.",
          },
          {
            property: "og:title",
            content: `${loaderData.profile.display_name ?? loaderData.profile.username} — Digital Business Card`,
          },
          {
            property: "og:description",
            content:
              loaderData.profile.bio ??
              "A shareable profile with links, contact details, and QR-ready access.",
          },
          { property: "og:type", content: "profile" },
          { name: "twitter:card", content: "summary" },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-hero">
      <div className="rounded-3xl glass p-10 text-center">
        <h1 className="text-3xl font-bold">Profile not found</h1>
        <p className="mt-2 text-muted-foreground">This card doesn't exist or is private.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold underline">
          Back home
        </Link>
      </div>
    </div>
  ),
  component: PublicProfile,
});

function buildHref(link: { type: string; platform: string | null; value: string }) {
  const v = link.value.trim();
  if (!v) return "#";
  switch (link.type) {
    case "phone":
      return `tel:${normalizePhoneForUri(v)}`;
    case "email":
      return `mailto:${v}`;
    case "sms":
      return `sms:${normalizePhoneForUri(v)}`;
    case "social": {
      if (/^https?:\/\//.test(v)) return v;
      const handle = v.replace(/^@/, "");
      switch (link.platform) {
        case "whatsapp":
          return `https://wa.me/${normalizePhoneForUri(handle).replace(/\D/g, "")}`;
        case "telegram":
          return `https://t.me/${handle}`;
        case "discord":
          return `https://discord.gg/${handle}`;
        case "wechat":
          return `weixin://dl/chat?${handle}`;
        case "signal":
          return `https://signal.me/#p/${normalizePhoneForUri(handle)}`;
        case "line":
          return `https://line.me/R/ti/p/${handle.startsWith("@") ? handle : "@" + handle}`;
        case "viber":
          return `viber://chat?number=${normalizePhoneForUri(handle)}`;
        case "messenger":
          return `https://m.me/${handle}`;
        case "facebook":
          return `https://facebook.com/${handle}`;
        case "instagram":
          return `https://instagram.com/${handle}`;
        case "linkedin":
          return `https://linkedin.com/in/${handle}`;
        case "x":
          return `https://x.com/${handle}`;
        case "threads":
          return `https://threads.net/@${handle}`;
        case "youtube":
          return `https://youtube.com/@${handle}`;
        case "tiktok":
          return `https://tiktok.com/@${handle}`;
        case "github":
          return `https://github.com/${handle}`;
        case "snapchat":
          return `https://snapchat.com/add/${handle}`;
        case "pinterest":
          return `https://pinterest.com/${handle}`;
        case "reddit":
          return `https://reddit.com/user/${handle}`;
        case "medium":
          return `https://medium.com/@${handle}`;
        case "dribbble":
          return `https://dribbble.com/${handle}`;
        case "behance":
          return `https://behance.net/${handle}`;
        case "twitch":
          return `https://twitch.tv/${handle}`;
        case "spotify":
          return `https://open.spotify.com/user/${handle}`;
        case "skype":
          return `skype:${handle}?chat`;
        case "slack":
          return v;
        case "patreon":
          return `https://patreon.com/${handle}`;
        case "substack":
          return `https://${handle}.substack.com`;
        case "quora":
          return `https://quora.com/profile/${handle}`;
        case "tumblr":
          return `https://${handle}.tumblr.com`;
        case "mastodon": {
          const match = handle.match(/^([^@]+)@(.+)$/);
          return match ? `https://${match[2]}/@${match[1]}` : v;
        }
        case "bluesky":
          return `https://bsky.app/profile/${handle}`;
        case "clubhouse":
          return `https://clubhouse.com/@${handle}`;
        default:
          return v;
      }
    }
    default:
      return /^https?:\/\//.test(v) ? v : `https://${v}`;
  }
}

function normalizePhoneForUri(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  const digits = trimmed.replace(/\D/g, "");
  if (/^01\d{9}$/.test(digits)) return `+880${digits.slice(1)}`;
  return digits ? `+${digits}` : trimmed;
}

const FINANCIAL_LABELS: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  upay: "Upay",
  paypal: "PayPal",
  venmo: "Venmo",
  cashapp: "Cash App",
  zelle: "Zelle",
  revolut: "Revolut",
  wise: "Wise",
  iban: "Bank / IBAN",
  btc: "Bitcoin",
  eth: "Ethereum",
  usdt: "USDT",
  binance: "Binance",
  other: "Other",
};

const SOCIAL_ICON_FILES: Record<string, string> = {
  facebook: "facebook.svg",
  instagram: "instagram.svg",
  linkedin: "linkedin.svg",
  x: "x.svg",
  threads: "threads.svg",
  youtube: "youtube.svg",
  tiktok: "tiktok.svg",
  github: "github.svg",
  whatsapp: "whatsapp.svg",
  telegram: "telegram.svg",
  discord: "discord.svg",
  wechat: "wechat.svg",
  signal: "signal.svg",
  line: "line.svg",
  viber: "viber.svg",
  messenger: "messenger.svg",
  snapchat: "snapchat.svg",
  pinterest: "pinterest.svg",
  reddit: "reddit.svg",
  medium: "medium.svg",
  dribbble: "dribbble.svg",
  behance: "behance.svg",
  twitch: "twitch.svg",
  spotify: "spotify.svg",
  skype: "skype.svg",
  slack: "slack.svg",
  patreon: "patreon.svg",
  substack: "substack.svg",
  quora: "quora.svg",
  tumblr: "tumblr.svg",
  mastodon: "mastodon.svg",
  bluesky: "bluesky.svg",
  clubhouse: "clubhouse.svg",
};

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  threads: "Threads",
  youtube: "YouTube",
  tiktok: "TikTok",
  github: "GitHub",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  discord: "Discord",
  wechat: "WeChat",
  signal: "Signal",
  line: "LINE",
  viber: "Viber",
  messenger: "Messenger",
  snapchat: "Snapchat",
  pinterest: "Pinterest",
  reddit: "Reddit",
  medium: "Medium",
  dribbble: "Dribbble",
  behance: "Behance",
  twitch: "Twitch",
  spotify: "Spotify",
  skype: "Skype",
  slack: "Slack",
  patreon: "Patreon",
  substack: "Substack",
  quora: "Quora",
  tumblr: "Tumblr",
  mastodon: "Mastodon",
  bluesky: "Bluesky",
  clubhouse: "Clubhouse",
};

const LINK_TYPE_LABELS: Record<string, string> = {
  url: "Website",
  email: "Email",
  phone: "Phone",
  sms: "SMS",
  social: "Social",
};

const LINK_TYPE_ICON_FILES: Record<string, string> = {
  email: "",
  phone: "",
  sms: "",
  url: "",
};

const FINANCIAL_ICON_FILES: Record<string, string> = {
  bkash: "bkash.svg",
  nagad: "nagad.svg",
  rocket: "rocket.svg",
  upay: "upay.svg",
  binance: "binance.svg",
  paypal: "paypal.svg",
  venmo: "venmo.svg",
  cashapp: "cashapp.svg",
  zelle: "zelle.svg",
  revolut: "revolut.svg",
  wise: "wise.svg",
  btc: "btc.svg",
  eth: "eth.svg",
  usdt: "usdt.svg",
};

const ACCENTS: Record<string, { from: string; to: string }> = {
  deep: { from: "#1B3C53", to: "#456882" },
  sand: { from: "#D2C1B6", to: "#E9DCD2" },
  ocean: { from: "#0EA5E9", to: "#22D3EE" },
  sunset: { from: "#F97316", to: "#EC4899" },
  forest: { from: "#065F46", to: "#10B981" },
  violet: { from: "#6D28D9", to: "#A855F7" },
  gold: { from: "#8B5E00", to: "#FFD700" },
  rose: { from: "#BE123C", to: "#FB7185" },
  mint: { from: "#047857", to: "#A7F3D0" },
  indigo: { from: "#3730A3", to: "#818CF8" },
  graphite: { from: "#111827", to: "#6B7280" },
  coral: { from: "#E11D48", to: "#F59E0B" },
};

const BTN_RADIUS: Record<string, string> = {
  rounded: "rounded-2xl",
  pill: "rounded-full",
  square: "rounded-md",
};

const BG_CLASS: Record<string, string> = {
  hero: "bg-hero",
  sand: "bg-gradient-sand",
  solid: "bg-background",
  linen: "bg-linen",
  mesh: "bg-mesh",
  studio: "bg-studio",
};

function buildFinancialHref(m: { type: string; value: string }) {
  const v = m.value.trim();
  if (!v) return null;
  switch (m.type) {
    case "paypal":
      if (/^https?:\/\//.test(v)) return v;
      if (v.includes("@")) return `mailto:${v}`;
      return `https://paypal.me/${v.replace(/^@/, "")}`;
    case "venmo":
      return `https://venmo.com/${v.replace(/^@/, "")}`;
    case "cashapp":
      return `https://cash.app/${v.startsWith("$") ? v : "$" + v}`;
    default:
      return null;
  }
}

function PublicProfile() {
  const { profile, groups, links, cards, financial } = Route.useLoaderData();
  const themeClass = profile.theme === "dark" ? "dark" : "";
  const ungroupedLinks = links.filter((l: any) => !l.group_id);
  const visibility: "both" | "links" | "financial" = (profile as any).share_visibility ?? "both";
  // ?tab override (from share QR codes)
  const queryTab =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;
  const showLinksTab = visibility !== "financial" && queryTab !== "financial";
  const showFinancialTab =
    profile.financial_enabled &&
    financial.length > 0 &&
    visibility !== "links" &&
    queryTab !== "links";
  const showTabs = showLinksTab && showFinancialTab;
  const initialTab: "links" | "financial" = !showLinksTab ? "financial" : "links";
  const [tab, setTab] = useState<"links" | "financial">(initialTab);

  function logClick(link: any) {
    // fire-and-forget; RLS allows public insert when profile is public
    void supabase.from("link_clicks").insert({
      user_id: profile.id,
      link_id: link.id,
      link_type: link.type,
      platform: link.platform ?? null,
    } as any);
  }

  const accentKey = (profile as any).accent_color ?? "deep";
  const proUntil = (profile as any).pro_until ? new Date((profile as any).pro_until).getTime() : 0;
  const isPro = !!(profile as any).is_pro || proUntil > Date.now();
  const accent =
    accentKey === "custom"
      ? {
          from: (profile as any).custom_accent_from || "#1B3C53",
          to: (profile as any).custom_accent_to || (profile as any).custom_accent_from || "#456882",
        }
      : (ACCENTS[accentKey] ?? ACCENTS.deep);
  const btnRadius = BTN_RADIUS[(profile as any).button_style ?? "rounded"] ?? BTN_RADIUS.rounded;
  const bgClass = BG_CLASS[(profile as any).background_style ?? "hero"] ?? BG_CLASS.hero;
  const accentStyle = { background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` };
  const fontFamily = (profile as any).font_family ?? "inter";
  const fontStack: Record<string, string> = {
    inter: "'Inter', system-ui, sans-serif",
    poppins: "'Poppins', system-ui, sans-serif",
    playfair: "'Playfair Display', Georgia, serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    space: "'Space Grotesk', system-ui, sans-serif",
    dmsans: "'DM Sans', system-ui, sans-serif",
    montserrat: "'Montserrat', system-ui, sans-serif",
    lora: "'Lora', Georgia, serif",
    merriweather: "'Merriweather', Georgia, serif",
    bebas: "'Bebas Neue', Impact, sans-serif",
    caveat: "'Caveat', cursive",
    firacode: "'Fira Code', ui-monospace, monospace",
    manrope: "'Manrope', system-ui, sans-serif",
    sora: "'Sora', system-ui, sans-serif",
    cormorant: "'Cormorant Garamond', Georgia, serif",
    libre: "'Libre Baskerville', Georgia, serif",
    archivo: "'Archivo Black', Impact, sans-serif",
    fraunces: "'Fraunces', Georgia, serif",
    "roboto-mono": "'Roboto Mono', ui-monospace, monospace",
  };
  const avatarShape = (profile as any).avatar_shape ?? "circle";
  const avatarRadius =
    avatarShape === "square"
      ? "rounded-none"
      : avatarShape === "rounded"
        ? "rounded-2xl"
        : "rounded-full";
  const cardRadiusKey = (profile as any).card_radius ?? "xl";
  const cardRadius =
    cardRadiusKey === "sm"
      ? "rounded-xl"
      : cardRadiusKey === "lg"
        ? "rounded-[2rem]"
        : cardRadiusKey === "none"
          ? "rounded-none"
          : "rounded-3xl";

  // Pro-only animation classes
  const proCard = isPro ? "pro-rise" : "";
  const proCta = isPro ? "pro-shimmer pro-glow" : "";
  const proAvatar = isPro ? "pro-glow" : "";

  const ctaEnabled = (profile as any).cta_enabled !== false;
  const ctaLabel = (profile as any).cta_label || "Let's Work Together";
  const ctaFallback =
    ungroupedLinks.find((l: any) => l.type === "email") ||
    links.find((l: any) => l.type === "email");
  const ctaHref = (profile as any).cta_url || (ctaFallback ? buildHref(ctaFallback) : null);

  // Build interleaved items per scope
  function scopeItems(groupId: string | null) {
    const ls = links
      .filter((l: any) => l.group_id === groupId)
      .map((l: any) => ({ kind: "link", position: l.position, item: l }));
    const cs = (cards as any[])
      .filter((c) => c.group_id === groupId)
      .map((c) => ({ kind: "card", position: c.position, item: c }));
    return [...ls, ...cs].sort((a, b) => a.position - b.position);
  }
  const ungroupedItems = scopeItems(null);

  return (
    <div className={themeClass} style={{ fontFamily: fontStack[fontFamily] ?? fontStack.inter }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Bebas+Neue&family=Caveat:wght@500;700&family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;700&family=Fira+Code:wght@400;600&family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Libre+Baskerville:wght@400;700&family=Lora:wght@400;600;700&family=Manrope:wght@400;500;600;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;500;700&family=Poppins:wght@400;500;600;700&family=Roboto+Mono:wght@400;600&family=Sora:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap"
        rel="stylesheet"
      />
      <div className={`min-h-screen ${bgClass}`}>
        <div className="mx-auto max-w-md px-4 pb-10 pt-8">
          {/* Profile card */}
          <section
            className={`${cardRadius} bg-card p-6 text-center shadow-elegant ${proCard}`}
            style={isPro ? { animationDelay: "0ms" } : undefined}
          >
            <div
              className={`mx-auto mb-4 inline-flex ${avatarRadius} p-1 ${proAvatar}`}
              style={{ ...accentStyle, color: accent.from }}
            >
              <Avatar className={`h-24 w-24 ring-4 ring-card ${avatarRadius}`}>
                <AvatarImage
                  src={profile.avatar_url ?? undefined}
                  alt={profile.display_name ?? profile.username ?? ""}
                  className={avatarRadius}
                />
                <AvatarFallback className={`bg-secondary ${avatarRadius}`}>
                  <UserIcon className="h-8 w-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </div>
            <h1 className="text-xl font-bold">{profile.display_name ?? profile.username}</h1>
            {profile.bio && (
              <FormattedBio
                value={profile.bio}
                className="mt-2 space-y-2 text-sm text-muted-foreground"
              />
            )}
          </section>

          {/* CTA */}
          {ctaEnabled && ctaHref && (
            <a
              href={ctaHref}
              className={`mt-4 block ${btnRadius} px-5 py-4 text-center font-semibold text-white shadow-elegant transition-smooth hover:-translate-y-0.5 ${proCta} ${proCard}`}
              style={{ ...accentStyle, animationDelay: isPro ? "100ms" : undefined } as any}
            >
              <Sparkles className="mr-2 inline h-4 w-4" /> {ctaLabel}
            </a>
          )}

          {showTabs && (
            <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-card p-1 shadow-soft">
              <button
                onClick={() => setTab("links")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-smooth ${tab === "links" ? "text-white shadow-soft" : "text-muted-foreground"}`}
                style={tab === "links" ? accentStyle : undefined}
              >
                <Link2 className="h-4 w-4" /> Links
              </button>
              <button
                onClick={() => setTab("financial")}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-smooth ${tab === "financial" ? "text-white shadow-soft" : "text-muted-foreground"}`}
                style={tab === "financial" ? accentStyle : undefined}
              >
                <Wallet className="h-4 w-4" /> Financial
              </button>
            </div>
          )}

          {showLinksTab && (showTabs ? tab === "links" : true) && (
            <div className="mt-4 space-y-4">
              {ungroupedItems.length > 0 && (
                <div className={proCard} style={isPro ? { animationDelay: "180ms" } : undefined}>
                  <LinkCard title="Links" radius={cardRadius} accentStyle={accentStyle}>
                    {ungroupedItems.map((it: any, i: number) =>
                      it.kind === "link" ? (
                        <LinkRow
                          key={it.item.id}
                          link={it.item}
                          accentStyle={accentStyle}
                          btnRadius={btnRadius}
                          onClick={() => logClick(it.item)}
                        />
                      ) : (
                        <CardBlock
                          key={it.item.id}
                          card={it.item}
                          accentStyle={accentStyle}
                          btnRadius={btnRadius}
                          delay={i * 60}
                        />
                      ),
                    )}
                  </LinkCard>
                </div>
              )}
              {groups.map((g: any, i: number) => {
                const items = scopeItems(g.id);
                if (items.length === 0) return null;
                const groupAccent = g.accent_from
                  ? {
                      background: `linear-gradient(135deg, ${g.accent_from}, ${g.accent_to || g.accent_from})`,
                    }
                  : accentStyle;
                const groupFont = g.font_family
                  ? (fontStack[g.font_family] ?? undefined)
                  : undefined;
                return (
                  <div
                    key={g.id}
                    className={proCard}
                    style={isPro ? { animationDelay: `${260 + i * 80}ms` } : undefined}
                  >
                    <LinkCard
                      title={g.title || "Links"}
                      radius={cardRadius}
                      accentStyle={groupAccent}
                      fontFamily={groupFont}
                    >
                      {items.map((it: any, ii: number) =>
                        it.kind === "link" ? (
                          <LinkRow
                            key={it.item.id}
                            link={it.item}
                            accentStyle={groupAccent}
                            btnRadius={btnRadius}
                            onClick={() => logClick(it.item)}
                          />
                        ) : (
                          <CardBlock
                            key={it.item.id}
                            card={it.item}
                            accentStyle={groupAccent}
                            btnRadius={btnRadius}
                            delay={ii * 60}
                          />
                        ),
                      )}
                    </LinkCard>
                  </div>
                );
              })}
            </div>
          )}

          {showFinancialTab && (showTabs ? tab === "financial" : true) && (
            <div
              className={`mt-4 ${proCard}`}
              style={isPro ? { animationDelay: "180ms" } : undefined}
            >
              <LinkCard
                title={profile.financial_title || "Financial"}
                radius={cardRadius}
                accentStyle={accentStyle}
              >
                {financial.map((m: any) => (
                  <FinancialItem key={m.id} method={m} accentStyle={accentStyle} />
                ))}
              </LinkCard>
            </div>
          )}

          {!profile.branding_hidden && (
            <div className="mt-8 text-center">
              <Link
                to="/"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                © 2026 <span className="font-bold text-foreground">MyTapCard</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkCard({
  title,
  children,
  radius,
  accentStyle,
  fontFamily,
}: {
  title: string;
  children: React.ReactNode;
  radius: string;
  accentStyle: React.CSSProperties;
  fontFamily?: string;
}) {
  return (
    <section
      className={`bg-card p-5 shadow-elegant ${radius}`}
      style={fontFamily ? { fontFamily } : undefined}
    >
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function linkIcon(link: any) {
  const iconFile =
    link.type === "social" && link.platform
      ? SOCIAL_ICON_FILES[link.platform]
      : LINK_TYPE_ICON_FILES[link.type] || LINK_TYPE_ICON_FILES.url;
  if (iconFile) return <BrandIcon file={iconFile} alt={link.platform || link.type} />;
  if (link.type === "email") return <Mail className="h-4 w-4" />;
  if (link.type === "phone") return <Phone className="h-4 w-4" />;
  if (link.type === "sms") return <MessageSquare className="h-4 w-4" />;
  if (link.type === "social") {
    const p = link.platform;
    if (p === "telegram" || p === "whatsapp") return <Send className="h-4 w-4" />;
    return <Link2 className="h-4 w-4" />;
  }
  return <Globe className="h-4 w-4" />;
}

function BrandIcon({ file, alt }: { file: string; alt: string }) {
  return (
    <img
      src={`/brand-icons/${file}`}
      alt=""
      title={alt}
      className="h-full w-full rounded-lg bg-white object-contain p-1.5"
      loading="lazy"
    />
  );
}

function LinkRow({
  link,
  accentStyle,
  btnRadius,
  onClick,
}: {
  link: any;
  accentStyle: React.CSSProperties;
  btnRadius?: string;
  onClick?: () => void;
}) {
  const href = buildHref(link);
  const isExternal = href.startsWith("http");
  const hasCustomLabel = !!link.label?.trim();
  const label =
    link.label?.trim() ||
    (link.type === "social" && link.platform
      ? SOCIAL_LABELS[link.platform] || link.platform
      : LINK_TYPE_LABELS[link.type] || "Link");
  const subtext = !hasCustomLabel ? formatLinkSubtext(link) : null;
  const radius = btnRadius || "rounded-2xl";
  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      onClick={onClick}
      className={`group flex items-center justify-between gap-3 ${radius} bg-secondary/60 px-4 py-3.5 font-medium transition-smooth hover:-translate-y-0.5 hover:bg-secondary`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center ${radius === "rounded-full" ? "rounded-full" : "rounded-xl"} text-white shadow-soft text-base`}
          style={accentStyle}
        >
          {link.emoji ? <span className="leading-none">{link.emoji}</span> : linkIcon(link)}
        </span>
        <span className="min-w-0">
          <span className="block truncate">{label}</span>
          {subtext && (
            <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
              {subtext}
            </span>
          )}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

function formatLinkSubtext(link: any) {
  const value = (link.value ?? "").trim();
  if (!value) return null;
  if (link.type === "social") {
    if (/^https?:\/\//.test(value)) return value;
    if (["whatsapp", "signal", "viber"].includes(link.platform)) return value;
    if (link.platform === "discord") return value;
    return value.startsWith("@") ? value : `@${value}`;
  }
  return value;
}

function CopyableField({
  label,
  value,
  copyable,
}: {
  label: string;
  value: string;
  copyable: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg bg-card/60 px-3 py-2">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="truncate font-mono text-sm">{value}</div>
      </div>
      {copyable && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
          }}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label={`Copy ${label}`}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function FinancialItem({
  method,
  accentStyle,
}: {
  method: any;
  accentStyle?: React.CSSProperties;
}) {
  const href = buildFinancialHref(method);
  const typeLabel = FINANCIAL_LABELS[method.type] ?? method.type;
  const label = method.label || typeLabel;
  const copyable = method.copyable !== false;

  if (method.type === "iban") {
    const fields: Array<{ label: string; value: string | null | undefined; required?: boolean }> = [
      { label: "Bank Name", value: method.bank_name, required: true },
      { label: "A/C Holder", value: method.account_holder, required: true },
      { label: "A/C Number", value: method.value, required: true },
      { label: "Branch", value: method.branch_name },
      { label: "Routing Number", value: method.routing_number },
      { label: "SWIFT Code", value: method.swift_code },
    ].filter((f) => (f.value ?? "").toString().trim() !== "");

    return (
      <div className="rounded-2xl bg-secondary/60 p-4">
        <div className="flex items-start gap-3">
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-soft"
            style={accentStyle}
          >
            {FINANCIAL_ICON_FILES[method.type] ? (
              <BrandIcon file={FINANCIAL_ICON_FILES[method.type]} alt={typeLabel} />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate font-semibold">{label}</div>
              <div className="text-xs text-muted-foreground">{typeLabel}</div>
            </div>
            <div className="mt-2 space-y-1.5">
              {fields.map((f) => (
                <CopyableField
                  key={f.label}
                  label={f.label}
                  value={String(f.value)}
                  copyable={copyable}
                />
              ))}
            </div>
            {method.note && <div className="mt-2 text-xs text-muted-foreground">{method.note}</div>}
          </div>
        </div>
      </div>
    );
  }

  const inner = (
    <div className="flex items-start gap-3">
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-soft"
        style={accentStyle}
      >
        {FINANCIAL_ICON_FILES[method.type] ? (
          <BrandIcon file={FINANCIAL_ICON_FILES[method.type]} alt={typeLabel} />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate font-semibold">{label}</div>
          <div className="text-xs text-muted-foreground">{typeLabel}</div>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate font-mono">{method.value}</span>
          {copyable && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigator.clipboard.writeText(method.value);
                toast.success("Copied");
              }}
              className="rounded-md p-1 hover:bg-card"
              aria-label="Copy"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {method.note && <div className="mt-1 text-xs text-muted-foreground">{method.note}</div>}
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="block rounded-2xl bg-secondary/60 p-4 transition-smooth hover:-translate-y-0.5 hover:bg-secondary"
      >
        {inner}
      </a>
    );
  }
  return <div className="rounded-2xl bg-secondary/60 p-4">{inner}</div>;
}

function CardBlock({
  card,
  accentStyle,
  btnRadius,
  delay = 0,
}: {
  card: any;
  accentStyle: React.CSSProperties;
  btnRadius?: string;
  delay?: number;
}) {
  const radius = btnRadius || "rounded-2xl";
  const customStyle: React.CSSProperties = {};
  if (card.bg_color) customStyle.background = card.bg_color;
  if (card.text_color) customStyle.color = card.text_color;

  const motionProps = {
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      duration: 0.45,
      delay: delay / 1000,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  };

  if (card.kind === "quote") {
    return (
      <motion.blockquote
        {...motionProps}
        className={`${radius} border-l-4 bg-secondary/40 p-4 italic`}
        style={{
          borderLeftColor: (accentStyle as any)?.background ? undefined : "currentColor",
          ...customStyle,
        }}
      >
        <Quote className="mb-2 h-4 w-4 opacity-50" />
        <p className="text-sm leading-relaxed">{card.content}</p>
        {card.author && (
          <footer className="mt-2 text-xs font-semibold opacity-70">— {card.author}</footer>
        )}
      </motion.blockquote>
    );
  }

  if (card.kind === "highlight") {
    const bg = card.bg_color ? customStyle : { ...accentStyle, color: card.text_color || "#fff" };
    return (
      <motion.div
        {...motionProps}
        className={`${radius} px-4 py-4 shadow-soft`}
        style={bg as React.CSSProperties}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            {card.title && <div className="font-semibold">{card.title}</div>}
            <p className="mt-0.5 text-sm leading-relaxed opacity-95">{card.content}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (card.kind === "ad") {
    return (
      <motion.div
        {...motionProps}
        className={`overflow-hidden ${radius} bg-card shadow-elegant ring-1 ring-border`}
        style={customStyle}
      >
        {card.image_url && (
          <img
            src={card.image_url}
            alt={card.title ?? "Advertisement"}
            className="h-32 w-full object-cover"
            loading="lazy"
          />
        )}
        <div className="p-4">
          {card.title && <div className="font-semibold">{card.title}</div>}
          {card.content && (
            <p className="mt-1 text-sm leading-relaxed opacity-90">{card.content}</p>
          )}
          {card.cta_url && (
            <a
              href={card.cta_url}
              target="_blank"
              rel="noreferrer"
              className={`mt-3 inline-flex items-center gap-1 ${radius} px-3 py-2 text-xs font-semibold text-white shadow-soft`}
              style={accentStyle}
            >
              <Megaphone className="h-3.5 w-3.5" /> {card.cta_label || "Learn more"}
            </a>
          )}
        </div>
      </motion.div>
    );
  }

  // note / default
  return (
    <motion.div {...motionProps} className={`${radius} bg-secondary/40 p-4`} style={customStyle}>
      <div className="flex items-start gap-3">
        <StickyNote className="h-4 w-4 shrink-0 opacity-60" />
        <div className="min-w-0">
          {card.title && <div className="font-semibold">{card.title}</div>}
          <p className="text-sm leading-relaxed">{card.content}</p>
        </div>
      </div>
    </motion.div>
  );
}
