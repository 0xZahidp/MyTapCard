"use client";

import { useEffect, useState } from "react";
import { safeJson } from "@/lib/dashboard-helpers";

export type Me = { avatar?: string; name?: string; email?: string };

export type Profile = { displayName?: string; username?: string; bio?: string };

// ✅ Match your backend Link model + UI usage (no feature change, just correct typing)
export type LinkType =
  | "url"
  | "phone"
  | "email"
  | "sms"
  | "social"
  | "messaging"
  | "video"
  | "vcard";

export type LinkItem = {
  _id: string;
  type: LinkType;
  label: string;
  value: string;

  // Optional fields that exist in DB/API and are used by LinksTab
  groupId?: string | null;
  platform?: string;
  meta?: any;
  order?: number;
  isActive?: boolean;
};

export function useDashboardData() {
  const [me, setMe] = useState<Me | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const [busy, setBusy] = useState<{
    profile?: boolean;
    link?: boolean;
    group?: boolean;
    qr?: boolean;
    pay?: boolean;
    avatar?: boolean;
  }>({});

  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const refreshMe = async (): Promise<void> => {
    const res = await fetch("/api/me", { credentials: "same-origin" });
    const data = await safeJson<any>(res);
    if (res.ok) {
      setMe(data.user ?? null);
      setProfile(data.profile ?? null);
    }
  };

  const refreshLinks = async (): Promise<void> => {
    const res = await fetch("/api/links", { credentials: "same-origin" });
    const data = await safeJson<any>(res);
    setLinks(Array.isArray(data) ? (data as LinkItem[]) : []);
  };

  useEffect(() => {
    refreshMe();
    refreshLinks();
  }, []);

  return {
    me,
    profile,
    links,
    busy,
    notice,
    setNotice,
    refreshMe,
    refreshLinks,
    setBusy,
    setProfile,
    setMe,
    setLinks,
  };
}
