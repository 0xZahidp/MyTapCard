import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProStatus } from "@/hooks/use-pro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Plus,
  Trash2,
  FolderPlus,
  Smile,
  Type,
  BarChart3,
  Crown,
  Sticker,
  X,
  Eye,
} from "lucide-react";
import { ReorderButtons } from "@/components/ui/reorder-buttons";
import { moveItem } from "@/lib/reorder";
import { moveMixed, type MixedItem } from "@/lib/reorder-mixed";
import { CardEditor, type CardRow } from "@/components/cards/card-editor";
import EmojiPicker, { EmojiStyle, Theme as EmojiTheme } from "emoji-picker-react";

export const Route = createFileRoute("/_authenticated/links")({
  head: () => ({ meta: [{ title: "Links — MyTapCard" }] }),
  component: LinksPage,
});

const GROUP_FONTS = [
  { id: "", name: "Default" },
  { id: "inter", name: "Inter" },
  { id: "poppins", name: "Poppins" },
  { id: "playfair", name: "Playfair" },
  { id: "space", name: "Space Grotesk" },
  { id: "mono", name: "Mono" },
];

const EMAIL_PLATFORMS = [
  { value: "gmail", label: "Gmail" },
  { value: "outlook", label: "Outlook" },
  { value: "yahoo", label: "Yahoo Mail" },
  { value: "proton", label: "Proton Mail" },
  { value: "apple-mail", label: "Apple Mail" },
  { value: "custom-email", label: "Custom Email" },
];

const SOCIAL_PLATFORM_GROUPS = [
  {
    label: "Messaging",
    items: [
      { value: "whatsapp", label: "WhatsApp" },
      { value: "telegram", label: "Telegram" },
      { value: "discord", label: "Discord" },
      { value: "wechat", label: "WeChat" },
      { value: "signal", label: "Signal" },
      { value: "line", label: "LINE" },
      { value: "viber", label: "Viber" },
      { value: "messenger", label: "Messenger" },
    ],
  },
  {
    label: "Social",
    items: [
      { value: "facebook", label: "Facebook" },
      { value: "instagram", label: "Instagram" },
      { value: "x", label: "X" },
      { value: "threads", label: "Threads" },
      { value: "youtube", label: "YouTube" },
      { value: "tiktok", label: "TikTok" },
      { value: "snapchat", label: "Snapchat" },
      { value: "pinterest", label: "Pinterest" },
      { value: "reddit", label: "Reddit" },
      { value: "twitch", label: "Twitch" },
      { value: "spotify", label: "Spotify" },
      { value: "skype", label: "Skype" },
      { value: "slack", label: "Slack" },
      { value: "patreon", label: "Patreon" },
      { value: "substack", label: "Substack" },
      { value: "quora", label: "Quora" },
      { value: "tumblr", label: "Tumblr" },
      { value: "mastodon", label: "Mastodon" },
      { value: "bluesky", label: "Bluesky" },
      { value: "clubhouse", label: "Clubhouse" },
    ],
  },
  {
    label: "Professional",
    items: [
      { value: "linkedin", label: "LinkedIn" },
      { value: "github", label: "GitHub" },
      { value: "gitlab", label: "GitLab" },
      { value: "behance", label: "Behance" },
      { value: "dribbble", label: "Dribbble" },
      { value: "medium", label: "Medium" },
      { value: "devto", label: "Dev.to" },
      { value: "stackoverflow", label: "Stack Overflow" },
      { value: "fiverr", label: "Fiverr" },
      { value: "upwork", label: "Upwork" },
      { value: "freelancer", label: "Freelancer" },
      { value: "crunchbase", label: "Crunchbase" },
      { value: "wellfound", label: "AngelList / Wellfound" },
    ],
  },
  {
    label: "Web3 / Crypto",
    items: [
      { value: "ens", label: "ENS" },
      { value: "lens", label: "Lens" },
      { value: "farcaster", label: "Farcaster" },
    ],
  },
  {
    label: "Business",
    items: [
      { value: "google-maps", label: "Google Maps Location" },
      { value: "booking", label: "Booking Link" },
      { value: "store", label: "Store" },
    ],
  },
];

const PHONE_COUNTRIES = [
  { code: "+880", label: "BD +880" },
  { code: "+1", label: "US/CA +1" },
  { code: "+44", label: "UK +44" },
  { code: "+91", label: "IN +91" },
  { code: "+92", label: "PK +92" },
  { code: "+971", label: "UAE +971" },
  { code: "+966", label: "SA +966" },
  { code: "+60", label: "MY +60" },
  { code: "+65", label: "SG +65" },
  { code: "+61", label: "AU +61" },
  { code: "+49", label: "DE +49" },
];

const PHONE_SOCIAL_PLATFORMS = new Set(["whatsapp", "signal", "viber"]);

interface Group {
  id: string;
  title: string;
  position: number;
  hidden: boolean;
  font_family: string | null;
  accent_from: string | null;
  accent_to: string | null;
}
interface LinkRow {
  id: string;
  group_id: string | null;
  label: string;
  type: string;
  platform: string | null;
  value: string;
  position: number;
  hidden: boolean;
  emoji: string | null;
}

function LinksPage() {
  const { user } = useAuth();
  const { isPro, loading: proLoading } = useProStatus();
  const [groups, setGroups] = useState<Group[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clicks, setClicks] = useState<
    Array<{ link_id: string | null; link_type: string; clicked_at: string }>
  >([]);

  async function reload() {
    if (!user) return;
    const [g, l, c, ck] = await Promise.all([
      supabase.from("link_groups").select("*").eq("user_id", user.id).order("position"),
      supabase.from("links").select("*").eq("user_id", user.id).order("position"),
      supabase
        .from("link_cards" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("position"),
      supabase
        .from("link_clicks")
        .select("link_id, link_type, clicked_at" as any)
        .eq("user_id", user.id)
        .order("clicked_at", { ascending: false })
        .limit(1000),
    ]);
    setGroups((g.data ?? []) as Group[]);
    setLinks((l.data ?? []) as LinkRow[]);
    setCards((c.data ?? []) as any as CardRow[]);
    setClicks(
      (ck.data ?? []) as any as Array<{
        link_id: string | null;
        link_type: string;
        clicked_at: string;
      }>,
    );
    setLoading(false);
  }
  useEffect(() => {
    reload();
  }, [user]);

  async function addGroup() {
    if (!user) return;
    const { error } = await supabase
      .from("link_groups")
      .insert({ user_id: user.id, title: "New group", position: groups.length });
    if (error) toast.error(error.message);
    else reload();
  }
  async function addLink(groupId: string | null) {
    if (!user) return;
    const scopeCount =
      links.filter((l) => l.group_id === groupId).length +
      cards.filter((c) => c.group_id === groupId).length;
    const { error } = await supabase.from("links").insert({
      user_id: user.id,
      group_id: groupId,
      label: "",
      type: "url",
      value: "",
      position: scopeCount,
    });
    if (error) toast.error(error.message);
    else reload();
  }
  async function addCard(groupId: string | null) {
    if (!user) return;
    const scopeCount =
      links.filter((l) => l.group_id === groupId).length +
      cards.filter((c) => c.group_id === groupId).length;
    const { error } = await supabase.from("link_cards" as any).insert({
      user_id: user.id,
      group_id: groupId,
      kind: "note",
      content: "",
      position: scopeCount,
    } as any);
    if (error) toast.error(error.message);
    else reload();
  }
  async function updateGroup(id: string, patch: Partial<Group>) {
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    const { error } = await supabase.from("link_groups").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  }
  async function updateLink(id: string, patch: Partial<LinkRow>) {
    setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    const { error } = await supabase.from("links").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  }
  async function updateCard(id: string, patch: Partial<CardRow>) {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error } = await supabase
      .from("link_cards" as any)
      .update(patch as any)
      .eq("id", id);
    if (error) toast.error(error.message);
  }
  async function deleteGroup(id: string) {
    if (!confirm("Delete this group and its links?")) return;
    await supabase.from("link_groups").delete().eq("id", id);
    reload();
  }
  async function deleteLink(id: string) {
    await supabase.from("links").delete().eq("id", id);
    reload();
  }
  async function deleteCard(id: string) {
    await supabase
      .from("link_cards" as any)
      .delete()
      .eq("id", id);
    reload();
  }

  if (loading || proLoading) return <div className="text-muted-foreground">Loading…</div>;

  // Build interleaved {kind:'link'|'card', item} arrays per scope, sorted by position.
  function scopeItems(groupId: string | null) {
    const ls = links
      .filter((l) => l.group_id === groupId)
      .map((l) => ({ kind: "link" as const, position: l.position, link: l }));
    const cs = cards
      .filter((c) => c.group_id === groupId)
      .map((c) => ({ kind: "card" as const, position: c.position, card: c }));
    return [...ls, ...cs].sort((a, b) => a.position - b.position);
  }
  function asMixed(scope: ReturnType<typeof scopeItems>): MixedItem[] {
    return scope.map((it) => ({
      id: it.kind === "link" ? it.link.id : it.card.id,
      position: it.position,
      table: it.kind === "link" ? "links" : "link_cards",
    }));
  }

  const ungrouped = scopeItems(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Your links</h1>
          <p className="mt-1 text-muted-foreground">
            Add links, group them, or insert text/quote cards anywhere.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={addGroup}>
            <FolderPlus className="h-4 w-4" /> New group
          </Button>
          <Button variant="outline" onClick={() => addCard(null)}>
            <Sticker className="h-4 w-4" /> Add card
          </Button>
          <Button variant="hero" onClick={() => addLink(null)}>
            <Plus className="h-4 w-4" /> Add link
          </Button>
        </div>
      </header>

      <ProAnalytics isPro={isPro} clicks={clicks} />

      {groups.length === 0 && ungrouped.length === 0 && (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
          <h3 className="text-lg font-semibold">No links yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first link or card to get started.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={() => addCard(null)}>
              <Sticker className="h-4 w-4" /> Add card
            </Button>
            <Button variant="hero" onClick={() => addLink(null)}>
              <Plus className="h-4 w-4" /> Add link
            </Button>
          </div>
        </div>
      )}

      {ungrouped.length > 0 && (
        <section className="space-y-3">
          {ungrouped.map((it, i) => {
            const onMove = async (delta: -1 | 1) => {
              const ok = await moveMixed(asMixed(ungrouped), i, delta);
              if (ok) reload();
            };
            return it.kind === "link" ? (
              <LinkEditor
                key={it.link.id}
                link={it.link}
                onChange={updateLink}
                onDelete={deleteLink}
                index={i}
                total={ungrouped.length}
                onMove={onMove}
              />
            ) : (
              <CardEditor
                key={it.card.id}
                card={it.card}
                onChange={updateCard}
                onDelete={deleteCard}
                isPro={isPro}
                index={i}
                total={ungrouped.length}
                onMove={onMove}
              />
            );
          })}
        </section>
      )}

      {groups.map((g, gi) => {
        const items = scopeItems(g.id);
        return (
          <section key={g.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <ReorderButtons
                index={gi}
                total={groups.length}
                onMove={async (delta) => {
                  const next = await moveItem(groups, gi, delta, "link_groups");
                  if (next) setGroups(next);
                }}
              />
              <Input
                value={g.title}
                onChange={(e) => updateGroup(g.id, { title: e.target.value })}
                className="min-w-0 flex-1 border-0 bg-transparent px-1 text-base font-semibold focus-visible:ring-0"
                style={{ fontFamily: fontStack(g.font_family) }}
              />
              <GroupStyleControls group={g} onChange={updateGroup} isPro={isPro} />
              <Switch
                checked={!g.hidden}
                onCheckedChange={(v) => updateGroup(g.id, { hidden: !v })}
              />
              <Button variant="ghost" size="icon" onClick={() => deleteGroup(g.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((it, li) => {
                const onMove = async (delta: -1 | 1) => {
                  const ok = await moveMixed(asMixed(items), li, delta);
                  if (ok) reload();
                };
                return it.kind === "link" ? (
                  <LinkEditor
                    key={it.link.id}
                    link={it.link}
                    onChange={updateLink}
                    onDelete={deleteLink}
                    index={li}
                    total={items.length}
                    onMove={onMove}
                  />
                ) : (
                  <CardEditor
                    key={it.card.id}
                    card={it.card}
                    onChange={updateCard}
                    onDelete={deleteCard}
                    isPro={isPro}
                    index={li}
                    total={items.length}
                    onMove={onMove}
                  />
                );
              })}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => addLink(g.id)}>
                  <Plus className="h-4 w-4" /> Add link
                </Button>
                <Button variant="outline" size="sm" onClick={() => addCard(g.id)}>
                  <Sticker className="h-4 w-4" /> Add card
                </Button>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function fontStack(id: string | null | undefined) {
  switch (id) {
    case "inter":
      return "'Inter', sans-serif";
    case "poppins":
      return "'Poppins', sans-serif";
    case "playfair":
      return "'Playfair Display', serif";
    case "space":
      return "'Space Grotesk', sans-serif";
    case "mono":
      return "'JetBrains Mono', monospace";
    default:
      return undefined;
  }
}

function GroupStyleControls({
  group,
  onChange,
  isPro,
}: {
  group: Group;
  onChange: (id: string, p: Partial<Group>) => void;
  isPro: boolean;
}) {
  const swatch =
    group.accent_from && group.accent_to
      ? `linear-gradient(135deg, ${group.accent_from}, ${group.accent_to})`
      : group.accent_from || "#94a3b8";
  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" title="Group font">
            <Type className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-2">
          <div className="mb-1 flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground">Group font</span>
            {group.font_family && (
              <button
                onClick={() => onChange(group.id, { font_family: null })}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            )}
          </div>
          <div className="space-y-1">
            {GROUP_FONTS.map((f) => (
              <button
                key={f.id}
                onClick={() => onChange(group.id, { font_family: f.id || null })}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-smooth ${(group.font_family ?? "") === f.id ? "bg-secondary font-semibold" : "hover:bg-secondary/60"}`}
                style={{ fontFamily: fontStack(f.id) }}
              >
                {f.name}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" title="Group color">
            <span
              className="h-4 w-4 rounded-full ring-1 ring-border"
              style={{ background: swatch }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-3 p-3">
          <div className="text-xs font-semibold text-muted-foreground">Group color</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={group.accent_from || "#1B3C53"}
                onChange={(e) => onChange(group.id, { accent_from: e.target.value })}
                className="h-9 w-10 cursor-pointer rounded-md border border-border bg-transparent"
              />
              <Input
                value={group.accent_from ?? ""}
                onChange={(e) => onChange(group.id, { accent_from: e.target.value || null })}
                placeholder="Pick a color"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Gradient end
                </span>
                {!isPro && (
                  <span className="rounded-full bg-gradient-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                    PRO
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  disabled={!isPro}
                  value={group.accent_to || group.accent_from || "#456882"}
                  onChange={(e) => onChange(group.id, { accent_to: e.target.value })}
                  className="h-9 w-10 cursor-pointer rounded-md border border-border bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Input
                  disabled={!isPro}
                  value={group.accent_to ?? ""}
                  onChange={(e) => onChange(group.id, { accent_to: e.target.value || null })}
                  placeholder={isPro ? "Gradient end" : "Upgrade for gradient"}
                  className="h-9"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChange(group.id, { accent_from: null, accent_to: null })}
            >
              Reset
            </Button>
            <div className="h-9 w-20 rounded-md" style={{ background: swatch }} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function LinkEditor({
  link,
  onChange,
  onDelete,
  index,
  total,
  onMove,
}: {
  link: LinkRow;
  onChange: (id: string, p: Partial<LinkRow>) => void;
  onDelete: (id: string) => void;
  index?: number;
  total?: number;
  onMove?: (delta: -1 | 1) => void;
}) {
  const shouldUsePhoneInput =
    link.type === "phone" ||
    link.type === "sms" ||
    (link.type === "social" && !!link.platform && PHONE_SOCIAL_PLATFORMS.has(link.platform));

  return (
    <div className="rounded-2xl border border-border bg-background/50 p-3">
      <div className="flex items-start gap-2">
        {typeof index === "number" && typeof total === "number" && onMove && (
          <ReorderButtons index={index} total={total} vertical onMove={onMove} />
        )}
        <div className="flex shrink-0 items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-md border border-border bg-card text-xl transition-smooth hover:border-primary/40"
                title={link.emoji ? "Change emoji" : "Pick emoji"}
              >
                {link.emoji || <Smile className="h-4 w-4 text-muted-foreground" />}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none">
              <div className="overflow-hidden rounded-2xl shadow-elegant">
                <EmojiPicker
                  onEmojiClick={(e) => onChange(link.id, { emoji: e.emoji })}
                  emojiStyle={EmojiStyle.NATIVE}
                  theme={EmojiTheme.AUTO}
                  width={320}
                  height={380}
                  previewConfig={{ showPreview: false }}
                  skinTonesDisabled
                />
              </div>
              {link.emoji && (
                <button
                  type="button"
                  onClick={() => onChange(link.id, { emoji: null })}
                  className="mt-2 w-full rounded-md bg-card py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Remove emoji
                </button>
              )}
            </PopoverContent>
          </Popover>
          {link.emoji && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Remove emoji"
              onClick={() => onChange(link.id, { emoji: null })}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 grid gap-2 sm:grid-cols-[140px_1fr]">
          <Select
            value={link.type}
            onValueChange={(v) =>
              onChange(link.id, {
                type: v,
                platform:
                  v === link.type && (v === "social" || v === "email") ? link.platform : null,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="url">Website</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="social">Social</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Label (e.g. Portfolio)"
            value={link.label}
            onChange={(e) => onChange(link.id, { label: e.target.value })}
          />
        </div>
        <Switch checked={!link.hidden} onCheckedChange={(v) => onChange(link.id, { hidden: !v })} />
        <Button variant="ghost" size="icon" onClick={() => onDelete(link.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[140px_1fr]">
        {link.type === "email" ? (
          <Select
            value={link.platform ?? ""}
            onValueChange={(v) => onChange(link.id, { platform: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Mail app" />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_PLATFORMS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : link.type === "social" ? (
          <Select
            value={link.platform ?? ""}
            onValueChange={(v) => onChange(link.id, { platform: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              {SOCIAL_PLATFORM_GROUPS.map((group, index) => (
                <SelectGroup key={group.label}>
                  {index > 0 && <SelectSeparator />}
                  <SelectLabel className="text-xs text-muted-foreground">{group.label}</SelectLabel>
                  {group.items.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div />
        )}
        {shouldUsePhoneInput ? (
          <PhoneNumberInput
            value={link.value}
            onChange={(value) => onChange(link.id, { value })}
            placeholder={placeholderFor(link.type, link.platform)}
          />
        ) : (
          <Input
            placeholder={placeholderFor(link.type, link.platform)}
            value={link.value}
            onChange={(e) => onChange(link.id, { value: e.target.value })}
          />
        )}
      </div>
    </div>
  );
}

function placeholderFor(type: string, platform?: string | null) {
  switch (type) {
    case "phone":
      return "1712345678";
    case "email":
      return "you@example.com";
    case "sms":
      return "1712345678";
    case "social":
      if (platform === "whatsapp") return "1712345678";
      if (platform === "signal" || platform === "viber") return "Phone number";
      return "username, invite, phone number, or URL";
    default:
      return "https://…";
  }
}

function PhoneNumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [selectedCode, setSelectedCode] = useState(detectDialCode(value) ?? "+880");
  const selected = detectDialCode(value) ?? selectedCode;
  const localValue = getLocalPhoneValue(value, selected);

  return (
    <div className="space-y-1">
      <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
        <Select
          value={selected}
          onValueChange={(code) => {
            setSelectedCode(code);
            onChange(formatInternationalPhone(localValue, code));
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHONE_COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          inputMode="tel"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => onChange(formatInternationalPhone(e.target.value, selected))}
          onBlur={(e) => onChange(formatInternationalPhone(e.target.value, selected))}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Saved as {formatInternationalPhone(localValue, selected) || "an international number"}.
      </p>
    </div>
  );
}

function detectDialCode(value: string) {
  const compact = value.replace(/[^\d+]/g, "");
  return PHONE_COUNTRIES.find((country) => compact.startsWith(country.code))?.code ?? null;
}

function getLocalPhoneValue(value: string, dialCode: string) {
  const compact = value.trim().replace(/[^\d+]/g, "");
  if (compact.startsWith(dialCode)) return compact.slice(dialCode.length);
  if (compact.startsWith("+")) return compact;
  return compact.replace(/^0+/, "");
}

function formatInternationalPhone(value: string, dialCode: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  const digits = trimmed.replace(/\D/g, "").replace(/^0+/, "");
  return digits ? `${dialCode}${digits}` : "";
}

const TYPE_LABELS: Record<string, string> = {
  url: "Website",
  email: "Email",
  phone: "Phone",
  sms: "SMS",
  social: "Social",
};

function ProAnalytics({
  isPro,
  clicks,
}: {
  isPro: boolean;
  clicks: Array<{ link_id: string | null; link_type: string; clicked_at: string }>;
}) {
  if (!isPro) {
    return (
      <section className="flex flex-wrap items-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card/60 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            Views and tap analytics
            <span className="rounded-full bg-gradient-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              PRO
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            See profile views, taps by link type, and recent activity. Upgrade to unlock analytics.
          </p>
        </div>
      </section>
    );
  }

  const views = clicks.filter((c) => c.link_type === "profile_view");
  const taps = clicks.filter((c) => c.link_type !== "profile_view");
  const total = taps.length;
  const totalViews = views.length;
  const byType = taps.reduce<Record<string, number>>((acc, c) => {
    acc[c.link_type] = (acc[c.link_type] ?? 0) + 1;
    return acc;
  }, {});
  const lastByType = taps.reduce<Record<string, string>>((acc, c) => {
    if (!acc[c.link_type]) acc[c.link_type] = c.clicked_at;
    return acc;
  }, {});
  const lastVisited = taps[0]?.clicked_at;
  const lastViewed = views[0]?.clicked_at;
  const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              Link analytics <Crown className="h-4 w-4 text-yellow-500" />
            </h2>
            <p className="text-xs text-muted-foreground">
              {totalViews === 0 && total === 0
                ? "No activity recorded yet - share your card to get started."
                : `${totalViews} view${totalViews === 1 ? "" : "s"} · ${total} tap${total === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-secondary/40 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Eye className="h-4 w-4" /> Views
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{totalViews}</div>
          <div className="text-xs text-muted-foreground">
            Last {lastViewed ? timeAgo(lastViewed) : "-"}
          </div>
        </div>
        <div className="rounded-2xl bg-secondary/40 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <BarChart3 className="h-4 w-4" /> Taps
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{total}</div>
          <div className="text-xs text-muted-foreground">
            Last {lastVisited ? timeAgo(lastVisited) : "-"}
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl bg-secondary/40 p-6 text-center text-sm text-muted-foreground">
          As soon as visitors tap your links, you'll see opens by type and the most recent visit
          here.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(([type, count]) => (
            <div key={type} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{TYPE_LABELS[type] ?? type}</span>
                <span className="tabular-nums text-muted-foreground">
                  {count} · last {lastByType[type] ? timeAgo(lastByType[type]) : "—"}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-gradient-primary transition-all"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
