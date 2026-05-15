import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProStatus } from "@/hooks/use-pro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGlobalLoading } from "@/components/ui/loading-overlay";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormattedBio } from "@/components/formatted-bio";
import {
  Bold,
  Copy,
  ExternalLink,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  Quote,
  Trash2,
  User as UserIcon,
  Upload,
} from "lucide-react";
import { compressImage } from "@/lib/image";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — MyTapCard" }] }),
  component: ProfilePage,
});

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  public_enabled: boolean;
  theme: string;
  cta_enabled: boolean;
  cta_label: string;
  cta_url: string | null;
}

function ProfilePage() {
  const { user } = useAuth();
  const { isPro, isTrial, loading: proLoading } = useProStatus();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  useGlobalLoading(saving || uploading, "profile-actions");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data as Profile);
        setLoading(false);
      });
  }, [user]);

  async function save() {
    if (!profile || !user) return;
    if (profile.username) {
      const u = profile.username;
      if (!USERNAME_RE.test(u) || u.length > 30) {
        toast.error("Username must be letters, numbers or underscores (max 30)");
        return;
      }
      const minLen = isPro ? 3 : 5;
      if (u.length < minLen) {
        toast.error(
          isPro
            ? "Username must be at least 3 characters"
            : "Free usernames must be at least 5 characters — upgrade to Pro for shorter names",
        );
        return;
      }
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        public_enabled: profile.public_enabled,
        theme: profile.theme,
        cta_enabled: profile.cta_enabled,
        cta_label: profile.cta_label,
        cta_url: profile.cta_url,
      } as any)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved");
  }

  async function handleFile(file: File) {
    if (!user || !profile) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is too large (max 8MB)");
      return;
    }
    setUploading(true);
    try {
      const blob = await compressImage(file, { maxSize: 512, quality: 0.85, mime: "image/webp" });
      const path = `${user.id}/avatar-${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "3600",
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl;
      setProfile({ ...profile, avatar_url: url });
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (error) throw error;
      toast.success(`Photo updated (${(blob.size / 1024).toFixed(0)} KB)`);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    if (!user || !profile) return;
    setProfile({ ...profile, avatar_url: null });
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    toast.success("Photo removed");
  }

  function formatBio(kind: "bold" | "italic" | "link" | "list" | "quote" | "heading") {
    if (!profile) return;
    const textarea = bioRef.current;
    const value = profile.bio ?? "";
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const selected = value.slice(start, end);

    const wrappers = {
      bold: ["**", "**", "important detail"],
      italic: ["_", "_", "short emphasis"],
      link: ["[", "](https://example.com)", "your link"],
      list: ["- ", "", selected || "First point"],
      quote: ["> ", "", selected || "Short quote"],
      heading: ["## ", "", selected || "Section title"],
    } as const;

    const [before, after, fallback] = wrappers[kind];
    const nextText = `${value.slice(0, start)}${before}${selected || fallback}${after}${value.slice(end)}`;
    const cursor = start + before.length + (selected || fallback).length + after.length;

    setProfile({ ...profile, bio: nextText });
    window.requestAnimationFrame(() => {
      bioRef.current?.focus();
      bioRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  if (loading || proLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!profile) return <div>No profile</div>;

  const publicUrl = profile.username ? `${window.location.origin}/${profile.username}` : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Your profile</h1>
        <p className="mt-1 text-muted-foreground">
          This is what people see when they tap or scan your card.
        </p>
      </header>

      {publicUrl && (
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
      )}

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="relative">
            <Avatar className="h-28 w-28 ring-4 ring-secondary">
              <AvatarImage src={profile.avatar_url ?? undefined} alt="Profile preview" />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                <UserIcon className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            {uploading && (
              <div className="absolute inset-0 grid place-items-center rounded-full bg-background/70 text-xs font-medium">
                Uploading…
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <Label>Profile photo</Label>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, or WebP — auto-resized to 512px and compressed to save space.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button
                type="button"
                variant="hero"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4" />{" "}
                {profile.avatar_url ? "Change photo" : "Upload photo"}
              </Button>
              {profile.avatar_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeAvatar}
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">
              Username
              {isPro ? (
                <span className="ml-2 rounded-full bg-gradient-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {isTrial ? "TRIAL" : "PRO"}
                </span>
              ) : (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (min 5 chars · Pro for shorter)
                </span>
              )}
            </Label>
            <div className="flex items-center rounded-xl border border-input bg-background pl-3">
              <span className="text-sm text-muted-foreground">/</span>
              <input
                id="username"
                placeholder="yourname"
                value={profile.username ?? ""}
                onChange={(e) => setProfile({ ...profile, username: e.target.value.trim() })}
                className="h-10 flex-1 bg-transparent px-2 text-sm outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="display">Display name</Label>
            <Input
              id="display"
              value={profile.display_name ?? ""}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="bio">Bio</Label>
            <div className="flex flex-wrap gap-1 rounded-xl bg-secondary p-1">
              {[
                { type: "bold", label: "Bold", icon: Bold },
                { type: "italic", label: "Italic", icon: Italic },
                { type: "link", label: "Link", icon: LinkIcon },
                { type: "heading", label: "Heading", icon: Heading2 },
                { type: "quote", label: "Quote", icon: Quote },
                { type: "list", label: "List", icon: List },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => formatBio(type as Parameters<typeof formatBio>[0])}
                  className="rounded-lg p-2 text-muted-foreground transition-smooth hover:bg-card hover:text-foreground"
                  aria-label={label}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            id="bio"
            ref={bioRef}
            rows={3}
            placeholder="A short tagline about you..."
            value={profile.bio ?? ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Supports **bold**, _italic_, [links](https://example.com), ## headings, &gt; quotes, and
            - bullet lines.
          </p>
          {(profile.bio ?? "").trim() && (
            <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider">Preview</div>
              <FormattedBio value={profile.bio} className="space-y-2 text-foreground" />
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-lg font-semibold">Settings</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Public profile</div>
              <div className="text-sm text-muted-foreground">
                Anyone with the link can view your card.
              </div>
            </div>
            <Switch
              checked={profile.public_enabled}
              onCheckedChange={(v) => setProfile({ ...profile, public_enabled: v })}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">Theme</div>
              <div className="text-sm text-muted-foreground">How your public profile looks.</div>
            </div>
            <div className="flex gap-1 rounded-xl bg-secondary p-1">
              {(["system", "light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setProfile({ ...profile, theme: t })}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-smooth ${profile.theme === t ? "bg-card shadow-soft" : "text-muted-foreground"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Hero call-to-action button</h2>
            <p className="text-sm text-muted-foreground">
              The big highlighted button shown right under your bio.
            </p>
          </div>
          <Switch
            checked={profile.cta_enabled}
            onCheckedChange={(v) => setProfile({ ...profile, cta_enabled: v })}
          />
        </div>
        {profile.cta_enabled && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cta_label">Button text</Label>
              <Input
                id="cta_label"
                value={profile.cta_label ?? ""}
                onChange={(e) => setProfile({ ...profile, cta_label: e.target.value })}
                placeholder="Let's Work Together"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta_url">Button link</Label>
              <Input
                id="cta_url"
                value={profile.cta_url ?? ""}
                onChange={(e) => setProfile({ ...profile, cta_url: e.target.value || null })}
                placeholder="https://… or mailto:you@email.com"
              />
            </div>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Button variant="hero" size="lg" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
