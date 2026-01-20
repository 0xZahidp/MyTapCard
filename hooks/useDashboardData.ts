"use client";

import { useEffect, useState } from "react";
import { safeJson } from "@/lib/dashboard-helpers";

export type Me = { avatar?: string; name?: string; email?: string };
export type Profile = { displayName?: string; username?: string; bio?: string };
export type LinkItem = {
  _id: string;
  type: "url" | "phone" | "email";
  label: string;
  value: string;
};

export function useDashboardData() {
  const [me, setMe] = useState<Me | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const [busy, setBusy] = useState<{
    profile?: boolean;
    link?: boolean;
    qr?: boolean;
    pay?: boolean;
    avatar?: boolean;
  }>({});

  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const refreshMe = async () => {
    const res = await fetch("/api/me", { credentials: "same-origin" });
    const data = await safeJson<any>(res);
    if (res.ok) {
      setMe(data.user ?? null);
      setProfile(data.profile ?? null);
    }
  };

  const refreshLinks = async () => {
    const res = await fetch("/api/links", { credentials: "same-origin" });
    const data = await safeJson<any>(res);
    setLinks(Array.isArray(data) ? data : []);
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
