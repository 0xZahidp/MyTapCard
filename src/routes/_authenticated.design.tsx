import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProStatus } from "@/hooks/use-pro";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Palette,
  Check,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Monitor,
  Layout,
  Sparkles,
  Crown,
  Layers3,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/design")({
  head: () => ({ meta: [{ title: "Design — MyTapCard" }] }),
  component: DesignPage,
});

const ACCENTS = [
  { id: "deep", name: "Deep Sea", swatch: "linear-gradient(135deg,#1B3C53,#456882)" },
  { id: "sand", name: "Warm Sand", swatch: "linear-gradient(135deg,#D2C1B6,#E9DCD2)" },
  { id: "ocean", name: "Ocean", swatch: "linear-gradient(135deg,#0EA5E9,#22D3EE)" },
  { id: "sunset", name: "Sunset", swatch: "linear-gradient(135deg,#F97316,#EC4899)" },
  { id: "forest", name: "Forest", swatch: "linear-gradient(135deg,#065F46,#10B981)" },
  { id: "violet", name: "Violet", swatch: "linear-gradient(135deg,#6D28D9,#A855F7)" },
  {
    id: "gold",
    name: "Golden",
    swatch: "linear-gradient(135deg,#8B5E00,#C9A227 40%,#FFD700 70%,#C9A227)",
  },
  { id: "rose", name: "Rose", swatch: "linear-gradient(135deg,#BE123C,#FB7185)" },
  { id: "mint", name: "Mint", swatch: "linear-gradient(135deg,#047857,#A7F3D0)" },
  { id: "indigo", name: "Indigo", swatch: "linear-gradient(135deg,#3730A3,#818CF8)" },
  { id: "graphite", name: "Graphite", swatch: "linear-gradient(135deg,#111827,#6B7280)" },
  { id: "coral", name: "Coral", swatch: "linear-gradient(135deg,#E11D48,#F59E0B)" },
];

const BUTTON_STYLES = [
  { id: "rounded", name: "Rounded", className: "rounded-2xl" },
  { id: "pill", name: "Pill", className: "rounded-full" },
  { id: "square", name: "Square", className: "rounded-md" },
];

const BACKGROUNDS = [
  { id: "hero", name: "Soft hero" },
  { id: "sand", name: "Warm sand" },
  { id: "solid", name: "Solid" },
  { id: "linen", name: "Linen" },
  { id: "mesh", name: "Mesh" },
  { id: "studio", name: "Studio" },
];

const FONT_GROUPS: Record<
  "sans" | "serif" | "display" | "mono",
  Array<{ id: string; name: string; css: string }>
> = {
  sans: [
    { id: "inter", name: "Inter", css: "'Inter', sans-serif" },
    { id: "poppins", name: "Poppins", css: "'Poppins', sans-serif" },
    { id: "space", name: "Space Grotesk", css: "'Space Grotesk', sans-serif" },
    { id: "dmsans", name: "DM Sans", css: "'DM Sans', sans-serif" },
    { id: "montserrat", name: "Montserrat", css: "'Montserrat', sans-serif" },
    { id: "manrope", name: "Manrope", css: "'Manrope', sans-serif" },
    { id: "sora", name: "Sora", css: "'Sora', sans-serif" },
  ],
  serif: [
    { id: "playfair", name: "Playfair", css: "'Playfair Display', serif" },
    { id: "lora", name: "Lora", css: "'Lora', serif" },
    { id: "merriweather", name: "Merriweather", css: "'Merriweather', serif" },
    { id: "cormorant", name: "Cormorant", css: "'Cormorant Garamond', serif" },
    { id: "libre", name: "Libre Baskerville", css: "'Libre Baskerville', serif" },
  ],
  display: [
    { id: "bebas", name: "Bebas Neue", css: "'Bebas Neue', sans-serif" },
    { id: "caveat", name: "Caveat", css: "'Caveat', cursive" },
    { id: "archivo", name: "Archivo Black", css: "'Archivo Black', sans-serif" },
    { id: "fraunces", name: "Fraunces", css: "'Fraunces', serif" },
  ],
  mono: [
    { id: "mono", name: "JetBrains Mono", css: "'JetBrains Mono', monospace" },
    { id: "firacode", name: "Fira Code", css: "'Fira Code', monospace" },
    { id: "roboto-mono", name: "Roboto Mono", css: "'Roboto Mono', monospace" },
  ],
};
const ALL_FONTS = [
  ...FONT_GROUPS.sans,
  ...FONT_GROUPS.serif,
  ...FONT_GROUPS.display,
  ...FONT_GROUPS.mono,
];

const AVATAR_SHAPES = [
  { id: "circle", name: "Circle" },
  { id: "rounded", name: "Rounded" },
  { id: "square", name: "Square" },
];

const CARD_RADII = [
  { id: "none", name: "Sharp" },
  { id: "sm", name: "Subtle" },
  { id: "xl", name: "Smooth" },
  { id: "lg", name: "Pillow" },
];

const THEMES = ["system", "light", "dark"] as const;

const TEMPLATES: Array<{
  id: string;
  name: string;
  tagline: string;
  patch: Partial<Profile>;
  preview: { from: string; to: string; bg: string };
}> = [
  {
    id: "midnight",
    name: "Midnight",
    tagline: "Deep & focused",
    patch: {
      accent_color: "deep",
      button_style: "rounded",
      background_style: "hero",
      font_family: "inter",
      card_radius: "xl",
      avatar_shape: "circle",
    },
    preview: { from: "#1B3C53", to: "#456882", bg: "#0f172a" },
  },
  {
    id: "sunset",
    name: "Sunset",
    tagline: "Warm & bold",
    patch: {
      accent_color: "sunset",
      button_style: "pill",
      background_style: "sand",
      font_family: "poppins",
      card_radius: "lg",
      avatar_shape: "circle",
    },
    preview: { from: "#F97316", to: "#EC4899", bg: "#fff7ed" },
  },
  {
    id: "editorial",
    name: "Editorial",
    tagline: "Classic serif",
    patch: {
      accent_color: "deep",
      button_style: "square",
      background_style: "solid",
      font_family: "playfair",
      card_radius: "sm",
      avatar_shape: "rounded",
    },
    preview: { from: "#111827", to: "#374151", bg: "#fafaf9" },
  },
  {
    id: "ocean",
    name: "Ocean",
    tagline: "Cool & clean",
    patch: {
      accent_color: "ocean",
      button_style: "rounded",
      background_style: "hero",
      font_family: "space",
      card_radius: "xl",
      avatar_shape: "circle",
    },
    preview: { from: "#0EA5E9", to: "#22D3EE", bg: "#ecfeff" },
  },
  {
    id: "forest",
    name: "Forest",
    tagline: "Earthy & calm",
    patch: {
      accent_color: "forest",
      button_style: "pill",
      background_style: "hero",
      font_family: "inter",
      card_radius: "xl",
      avatar_shape: "rounded",
    },
    preview: { from: "#065F46", to: "#10B981", bg: "#ecfdf5" },
  },
  {
    id: "violet",
    name: "Violet Pop",
    tagline: "Vibrant & modern",
    patch: {
      accent_color: "violet",
      button_style: "pill",
      background_style: "hero",
      font_family: "poppins",
      card_radius: "lg",
      avatar_shape: "circle",
    },
    preview: { from: "#6D28D9", to: "#A855F7", bg: "#faf5ff" },
  },
  {
    id: "goldleaf",
    name: "Goldleaf",
    tagline: "Luxury & premium",
    patch: {
      accent_color: "gold",
      button_style: "pill",
      background_style: "solid",
      font_family: "playfair",
      card_radius: "lg",
      avatar_shape: "circle",
      custom_accent_from: "#8B5E00",
      custom_accent_to: "#FFD700",
    },
    preview: { from: "#8B5E00", to: "#FFD700", bg: "#1a1208" },
  },
  {
    id: "atelier",
    name: "Atelier",
    tagline: "Editorial studio",
    patch: {
      accent_color: "graphite",
      button_style: "square",
      background_style: "linen",
      font_family: "cormorant",
      card_radius: "sm",
      avatar_shape: "rounded",
    },
    preview: { from: "#111827", to: "#6B7280", bg: "#f7f2ea" },
  },
  {
    id: "founder",
    name: "Founder",
    tagline: "Sharp & investor-ready",
    patch: {
      accent_color: "indigo",
      button_style: "rounded",
      background_style: "studio",
      font_family: "sora",
      card_radius: "xl",
      avatar_shape: "circle",
    },
    preview: { from: "#3730A3", to: "#818CF8", bg: "#eef2ff" },
  },
  {
    id: "creator",
    name: "Creator",
    tagline: "Bright social energy",
    patch: {
      accent_color: "coral",
      button_style: "pill",
      background_style: "mesh",
      font_family: "fraunces",
      card_radius: "lg",
      avatar_shape: "circle",
    },
    preview: { from: "#E11D48", to: "#F59E0B", bg: "#fff1f2" },
  },
  {
    id: "wellness",
    name: "Wellness",
    tagline: "Soft & welcoming",
    patch: {
      accent_color: "mint",
      button_style: "pill",
      background_style: "linen",
      font_family: "manrope",
      card_radius: "xl",
      avatar_shape: "rounded",
    },
    preview: { from: "#047857", to: "#A7F3D0", bg: "#f0fdf4" },
  },
  {
    id: "portfolio",
    name: "Portfolio",
    tagline: "Clean showcase",
    patch: {
      accent_color: "rose",
      button_style: "rounded",
      background_style: "hero",
      font_family: "libre",
      card_radius: "xl",
      avatar_shape: "square",
    },
    preview: { from: "#BE123C", to: "#FB7185", bg: "#fff7ed" },
  },
];

interface Profile {
  theme: string;
  accent_color: string;
  button_style: string;
  background_style: string;
  branding_hidden: boolean;
  font_family: string;
  custom_accent_from: string | null;
  custom_accent_to: string | null;
  avatar_shape: string;
  card_radius: string;
  username: string | null;
}

function DesignPage() {
  const { user } = useAuth();
  const { isPro, loading: proLoading } = useProStatus();
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const [device, setDevice] = useState<"mobile" | "desktop" | "compare">("mobile");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select(
        "theme, accent_color, button_style, background_style, branding_hidden, font_family, custom_accent_from, custom_accent_to, avatar_shape, card_radius, username" as any,
      )
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setP(data as unknown as Profile);
        setLoading(false);
      });
  }, [user]);

  const scheduleRefresh = () => {
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => setPreviewKey((k) => k + 1), 500);
  };

  async function update(patch: Partial<Profile>) {
    if (!user || !p) return;
    if (patch.branding_hidden && !isPro) {
      toast.error("Hiding MyTapCard branding is a Pro feature");
      return;
    }
    setP({ ...p, ...patch });
    const { error } = await supabase
      .from("profiles")
      .update(patch as any)
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    scheduleRefresh();
  }

  const previewUrl = useMemo(() => (p?.username ? `/${p.username}` : null), [p?.username]);

  if (loading || proLoading || !p) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Design</h1>
          <p className="mt-1 text-muted-foreground">
            Customize how your public profile looks. Live preview updates instantly.
          </p>
        </div>
        {previewUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={previewUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Open
            </a>
          </Button>
        )}
      </header>

      <div className={`grid gap-6 ${device === "compare" ? "" : "lg:grid-cols-[1fr_380px]"}`}>
        {/* Customization */}
        <div className="space-y-6 min-w-0">
          <Section
            icon={<Layout className="h-4 w-4" />}
            title="Templates"
            desc="One-click style presets for your whole shared page."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((t) => {
                const active =
                  p.accent_color === t.patch.accent_color &&
                  p.button_style === t.patch.button_style &&
                  p.background_style === t.patch.background_style &&
                  p.font_family === t.patch.font_family &&
                  p.card_radius === t.patch.card_radius;
                return (
                  <button
                    key={t.id}
                    onClick={() => update(t.patch)}
                    className={`group overflow-hidden rounded-2xl border-2 text-left transition-smooth ${active ? "border-primary shadow-elegant" : "border-border hover:border-primary/40"}`}
                  >
                    <div className="relative h-24 w-full" style={{ background: t.preview.bg }}>
                      <div
                        className="absolute inset-3 rounded-xl shadow-soft"
                        style={{
                          background: `linear-gradient(135deg, ${t.preview.from}, ${t.preview.to})`,
                        }}
                      />
                      {t.id === "goldleaf" && (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-yellow-300">
                          <Crown className="h-3 w-3" /> LUXE
                        </span>
                      )}
                      {active && (
                        <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-card shadow-soft">
                          <Check className="h-3.5 w-3.5 text-primary" />
                        </span>
                      )}
                    </div>
                    <div className="px-3 py-2.5">
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.tagline}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Templates change accent, font, buttons,
              background &amp; corners. You can fine-tune below.
            </p>
          </Section>

          <Section
            icon={<Layers3 className="h-4 w-4" />}
            title="Design resources"
            desc="Starter palettes and type pairings for faster styling."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {[
                {
                  name: "Executive",
                  colors: ["#111827", "#D1D5DB", "#FFFFFF"],
                  font: "Sora + Inter",
                },
                {
                  name: "Creative",
                  colors: ["#E11D48", "#F59E0B", "#FFF7ED"],
                  font: "Fraunces + DM Sans",
                },
                {
                  name: "Wellness",
                  colors: ["#047857", "#A7F3D0", "#F0FDF4"],
                  font: "Manrope + Lora",
                },
                {
                  name: "Luxury",
                  colors: ["#1A1208", "#FFD700", "#FAF7ED"],
                  font: "Cormorant + Libre",
                },
              ].map((resource) => (
                <div
                  key={resource.name}
                  className="rounded-2xl border border-border bg-secondary/30 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{resource.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{resource.font}</div>
                    </div>
                    <div className="flex -space-x-2">
                      {resource.colors.map((color) => (
                        <span
                          key={color}
                          className="h-7 w-7 rounded-full border-2 border-card shadow-soft"
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            icon={<Palette className="h-4 w-4" />}
            title="Accent color"
            desc="Sets the gradient on your header and buttons."
          >
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {ACCENTS.map((a) => {
                const active = p.accent_color === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => update({ accent_color: a.id })}
                    className={`group relative aspect-square rounded-2xl border-2 transition-smooth ${active ? "border-primary shadow-elegant" : "border-transparent hover:border-border"}`}
                    style={{ background: a.swatch }}
                    aria-label={a.name}
                  >
                    {active && (
                      <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-card shadow-soft">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-1 text-center text-[10px] font-semibold text-white/90 drop-shadow">
                      {a.name}
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => update({ accent_color: "custom" })}
                className={`relative aspect-square rounded-2xl border-2 transition-smooth ${p.accent_color === "custom" ? "border-primary shadow-elegant" : "border-dashed border-border hover:border-primary/40"}`}
                style={{
                  background: `linear-gradient(135deg, ${p.custom_accent_from || "#888"}, ${p.custom_accent_to || "#ccc"})`,
                }}
              >
                {p.accent_color === "custom" && (
                  <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-card shadow-soft">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-1 text-center text-[10px] font-semibold text-white/90 drop-shadow">
                  Custom
                </span>
              </button>
            </div>
            {p.accent_color === "custom" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Color {isPro && <span className="text-muted-foreground">(gradient start)</span>}
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={p.custom_accent_from || "#1B3C53"}
                      onChange={(e) => update({ custom_accent_from: e.target.value })}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-transparent"
                    />
                    <Input
                      value={p.custom_accent_from || ""}
                      onChange={(e) => update({ custom_accent_from: e.target.value })}
                      placeholder="#1B3C53"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-2">
                    Gradient end
                    {!isPro && (
                      <span className="rounded-full bg-gradient-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        PRO
                      </span>
                    )}
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!isPro}
                      value={p.custom_accent_to || p.custom_accent_from || "#456882"}
                      onChange={(e) => update({ custom_accent_to: e.target.value })}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Input
                      disabled={!isPro}
                      value={p.custom_accent_to || ""}
                      onChange={(e) => update({ custom_accent_to: e.target.value })}
                      placeholder={isPro ? "#456882" : "Upgrade to use gradients"}
                    />
                  </div>
                </div>
              </div>
            )}
          </Section>

          <Section
            title="Font"
            desc="Typeface used across your public profile. Tap a category to browse."
          >
            <Tabs defaultValue={categoryOf(p.font_family)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="sans">Sans</TabsTrigger>
                <TabsTrigger value="serif">Serif</TabsTrigger>
                <TabsTrigger value="display">Display</TabsTrigger>
                <TabsTrigger value="mono">Mono</TabsTrigger>
              </TabsList>
              {(Object.keys(FONT_GROUPS) as Array<keyof typeof FONT_GROUPS>).map((cat) => (
                <TabsContent key={cat} value={cat} className="mt-3">
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {FONT_GROUPS[cat].map((f) => {
                      const active = p.font_family === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => update({ font_family: f.id })}
                          className={`rounded-xl border-2 px-3 py-3 text-left transition-smooth ${active ? "border-primary bg-secondary/40" : "border-border hover:border-primary/40"}`}
                          style={{ fontFamily: f.css }}
                        >
                          <div className="text-base font-semibold">Aa</div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">{f.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </Section>

          <Section title="Button style" desc="Shape of the link buttons on your card.">
            <div className="grid gap-3 sm:grid-cols-3">
              {BUTTON_STYLES.map((b) => {
                const active = p.button_style === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => update({ button_style: b.id })}
                    className={`rounded-2xl border-2 p-4 text-left transition-smooth ${active ? "border-primary bg-secondary/40" : "border-border hover:border-primary/40"}`}
                  >
                    <div className={`h-10 ${b.className} bg-gradient-primary`} />
                    <div className="mt-2 text-sm font-semibold">{b.name}</div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Avatar shape" desc="How your profile picture is framed.">
            <div className="grid gap-3 sm:grid-cols-3">
              {AVATAR_SHAPES.map((s) => {
                const active = p.avatar_shape === s.id;
                const cls =
                  s.id === "square"
                    ? "rounded-none"
                    : s.id === "rounded"
                      ? "rounded-2xl"
                      : "rounded-full";
                return (
                  <button
                    key={s.id}
                    onClick={() => update({ avatar_shape: s.id })}
                    className={`rounded-2xl border-2 p-4 text-center transition-smooth ${active ? "border-primary bg-secondary/40" : "border-border hover:border-primary/40"}`}
                  >
                    <div className={`mx-auto h-12 w-12 ${cls} bg-gradient-primary`} />
                    <div className="mt-2 text-sm font-semibold">{s.name}</div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Card corners" desc="Roundness of the profile cards.">
            <div className="grid gap-3 sm:grid-cols-4">
              {CARD_RADII.map((r) => {
                const active = p.card_radius === r.id;
                const cls =
                  r.id === "none"
                    ? "rounded-none"
                    : r.id === "sm"
                      ? "rounded-xl"
                      : r.id === "lg"
                        ? "rounded-[2rem]"
                        : "rounded-3xl";
                return (
                  <button
                    key={r.id}
                    onClick={() => update({ card_radius: r.id })}
                    className={`rounded-2xl border-2 p-3 text-left transition-smooth ${active ? "border-primary bg-secondary/40" : "border-border hover:border-primary/40"}`}
                  >
                    <div className={`h-10 ${cls} bg-gradient-primary`} />
                    <div className="mt-2 text-sm font-semibold">{r.name}</div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Background" desc="The backdrop behind your card.">
            <div className="grid gap-3 sm:grid-cols-3">
              {BACKGROUNDS.map((b) => {
                const active = p.background_style === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => update({ background_style: b.id })}
                    className={`rounded-2xl border-2 p-3 transition-smooth ${active ? "border-primary" : "border-border hover:border-primary/40"}`}
                  >
                    <div
                      className={`h-16 rounded-xl ${b.id === "hero" ? "bg-hero" : b.id === "sand" ? "bg-gradient-sand" : "bg-card"}`}
                    />
                    <div className="mt-2 text-sm font-semibold">{b.name}</div>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Theme" desc="Light, dark, or follow the visitor's system.">
            <div className="inline-flex gap-1 rounded-xl bg-secondary p-1">
              {THEMES.map((t) => (
                <button
                  key={t}
                  onClick={() => update({ theme: t })}
                  className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-smooth ${p.theme === t ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Section>

          <Section title="MyTapCard branding" desc="Hide the standard footer on your public page.">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm">
                Branding hidden
                {!isPro && (
                  <span className="ml-2 rounded-full bg-gradient-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    PRO
                  </span>
                )}
              </Label>
              <Switch
                checked={p.branding_hidden}
                disabled={!isPro}
                onCheckedChange={(v) => update({ branding_hidden: v })}
              />
            </div>
            {!isPro && (
              <p className="mt-2 text-xs text-muted-foreground">
                Upgrade to Pro to remove the MyTapCard badge from your public profile.
              </p>
            )}
          </Section>
        </div>

        {/* Live preview */}
        <aside className={device === "compare" ? "" : "lg:sticky lg:top-6 lg:self-start"}>
          <div className="rounded-3xl border border-border bg-card p-4 shadow-elegant">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Live preview</div>
              <div className="flex items-center gap-1">
                <div className="inline-flex rounded-lg bg-secondary p-0.5">
                  <button
                    onClick={() => setDevice("mobile")}
                    className={`rounded-md px-2 py-1 transition-smooth ${device === "mobile" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"}`}
                    aria-label="Mobile preview"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDevice("desktop")}
                    className={`rounded-md px-2 py-1 transition-smooth ${device === "desktop" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"}`}
                    aria-label="Desktop preview"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDevice("compare")}
                    className={`flex items-center gap-0.5 rounded-md px-2 py-1 transition-smooth ${device === "compare" ? "bg-card shadow-soft text-foreground" : "text-muted-foreground"}`}
                    aria-label="Compare side-by-side"
                    title="Side-by-side compare"
                  >
                    <Smartphone className="h-3 w-3" />
                    <Monitor className="h-3 w-3" />
                  </button>
                </div>
                <button
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-smooth"
                  aria-label="Refresh preview"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
            {previewUrl ? (
              device === "mobile" ? (
                <div className="relative mx-auto" style={{ width: 320 }}>
                  <div
                    className="overflow-hidden rounded-[2rem] border-[10px] border-foreground/90 shadow-elegant"
                    style={{ height: 640 }}
                  >
                    <iframe
                      key={previewKey}
                      ref={iframeRef}
                      title="Live preview"
                      src={previewUrl}
                      className="h-full w-full bg-card"
                    />
                  </div>
                  <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-foreground/20" />
                </div>
              ) : device === "desktop" ? (
                <div className="mx-auto" style={{ maxWidth: 720 }}>
                  <div
                    className="overflow-hidden rounded-xl border-[6px] border-foreground/80 shadow-elegant"
                    style={{ height: 480 }}
                  >
                    <iframe
                      key={previewKey}
                      title="Live preview"
                      src={previewUrl}
                      className="h-full w-full bg-card"
                    />
                  </div>
                  <div className="mx-auto mt-1.5 h-2 w-24 rounded-b-md bg-foreground/30" />
                </div>
              ) : (
                <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
                  <div className="mx-auto w-full max-w-[280px]">
                    <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Smartphone className="h-3.5 w-3.5" /> Mobile
                    </div>
                    <div
                      className="overflow-hidden rounded-[2rem] border-[8px] border-foreground/90 shadow-elegant"
                      style={{ height: 560 }}
                    >
                      <iframe
                        key={`m-${previewKey}`}
                        title="Mobile preview"
                        src={previewUrl}
                        className="h-full w-full bg-card"
                      />
                    </div>
                  </div>
                  <div className="w-full">
                    <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Monitor className="h-3.5 w-3.5" /> Desktop
                    </div>
                    <div
                      className="overflow-hidden rounded-xl border-[6px] border-foreground/80 shadow-elegant"
                      style={{ height: 560 }}
                    >
                      <iframe
                        key={`d-${previewKey}`}
                        title="Desktop preview"
                        src={previewUrl}
                        className="h-full w-full bg-card"
                      />
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Set a username on your profile to see the live preview.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function categoryOf(fontId: string | null | undefined): "sans" | "serif" | "display" | "mono" {
  if (!fontId) return "sans";
  for (const cat of Object.keys(FONT_GROUPS) as Array<keyof typeof FONT_GROUPS>) {
    if (FONT_GROUPS[cat].some((f) => f.id === fontId)) return cat;
  }
  return "sans";
}

function Section({
  title,
  desc,
  children,
  icon,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          {icon}
          {title}
        </h2>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </section>
  );
}
