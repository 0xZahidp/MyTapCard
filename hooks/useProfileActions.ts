"use client";

import { safeJson } from "@/lib/dashboard-helpers";
import type { Profile } from "@/hooks/useDashboardData";

export function useProfileActions() {
  const saveProfile = async (form: Required<Pick<Profile, "displayName" | "username" | "bio">>) => {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(form),
    });

    const data = await safeJson<any>(res);
    return { res, data };
  };

  const uploadAvatar = async (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);

    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      body: fd,
      credentials: "same-origin",
    });

    const data = await safeJson<any>(res);
    return { res, data };
  };

  return { saveProfile, uploadAvatar };
}
