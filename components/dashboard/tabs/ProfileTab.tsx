"use client";

import { useEffect, useMemo, useState } from "react";
import { ui } from "@/components/dashboard/ui";
import { cx, normalizeUsername, safeJson } from "@/lib/dashboard-helpers";
import type { Me, Profile } from "@/hooks/useDashboardData";

const BASE_URL_FALLBACK = typeof window !== "undefined" ? window.location.origin : "";
const ENV_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

function baseUrl() {
  return ENV_BASE_URL || BASE_URL_FALLBACK || "";
}

export default function ProfileTab({
  me,
  profile,
  busy,
  setBusy,
  setNotice,
  refreshMe,
  setProfile,
  setMe,
}: {
  me: Me | null;
  profile: Profile | null;
  busy: any;
  setBusy: any;
  setNotice: any;
  refreshMe: () => Promise<void>;

  // ✅ FIX: allow functional updates (no feature change)
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  setMe: React.Dispatch<React.SetStateAction<Me | null>>;
}) {
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    bio: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const hasSaved = useMemo(() => {
    return !!(form.displayName.trim() || form.username.trim() || form.bio.trim());
  }, [form]);

  const [editing, setEditing] = useState(true);

  useEffect(() => {
    const next = {
      displayName: profile?.displayName ?? "",
      username: profile?.username ?? "",
      bio: profile?.bio ?? "",
    };
    setForm(next);

    const already = !!(next.displayName.trim() || next.username.trim() || next.bio.trim());
    setEditing(!already);

    if (me?.avatar) setAvatarPreview(me.avatar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.displayName, profile?.username, profile?.bio, me?.avatar]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);

    setAvatarFile(file);
    setNotice(null);

    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async () => {
    setNotice(null);

    if (!avatarFile) {
      setNotice({ type: "err", text: "Please select an image first." });
      return;
    }

    if (avatarFile.size > 2 * 1024 * 1024) {
      setNotice({ type: "err", text: "Max image size is 2MB." });
      return;
    }

    setBusy((b: any) => ({ ...b, avatar: true }));
    try {
      const fd = new FormData();
      fd.append("avatar", avatarFile);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });

      const data = await safeJson<any>(res);

      if (!res.ok) {
        setNotice({ type: "err", text: data.error || "Avatar upload failed" });
        return;
      }

      setNotice({ type: "ok", text: "Avatar updated ✅" });
      setAvatarFile(null);

      // update header + state
      await refreshMe();
      setMe((prev) => ({ ...(prev || {}), avatar: data.avatar }));
    } finally {
      setBusy((b: any) => ({ ...b, avatar: false }));
    }
  };

  const saveProfile = async () => {
    setNotice(null);

    if (!form.displayName.trim()) {
      setNotice({ type: "err", text: "Display name is required." });
      return;
    }
    if (!form.username.trim()) {
      setNotice({ type: "err", text: "Username is required." });
      return;
    }

    setBusy((b: any) => ({ ...b, profile: true }));
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });

      const data = await safeJson<any>(res);

      if (!res.ok) {
        setNotice({ type: "err", text: data.message || "Something went wrong" });
        return;
      }

      setNotice({ type: "ok", text: "Profile saved ✅" });
      setProfile(form);
      setEditing(false);
      await refreshMe();
    } finally {
      setBusy((b: any) => ({ ...b, profile: false }));
    }
  };

  const publicUrl = `${baseUrl()}/${form.username || "username"}`;

  if (!editing) {
    return (
      <section className={ui.card}>
        <div className={ui.cardPad}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className={ui.sectionTitle}>Profile</h2>
              <p className={ui.sectionDesc}>Your public identity details.</p>
            </div>

            <button type="button" className={ui.miniBtn} onClick={() => setEditing(true)}>
              Edit ✏️
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className={ui.label}>Display name</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {form.displayName || me?.name || "-"}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className={ui.label}>Username</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">@{form.username || "-"}</div>
              <p className="mt-2 text-xs text-gray-500">
                Your public link:{" "}
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-700 underline underline-offset-4"
                >
                  {publicUrl.replace(/^https?:\/\//, "")}
                </a>
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className={ui.label}>Bio</div>
              <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                {form.bio?.trim() ? form.bio : "-"}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={ui.card}>
      <div className={ui.cardPad}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className={ui.sectionTitle}>{hasSaved ? "Edit your profile" : "Create your profile"}</h2>
            <p className={ui.sectionDesc}>This information appears on your public page.</p>
          </div>

          {hasSaved && (
            <button type="button" className={ui.miniBtn} onClick={() => setEditing(false)}>
              Cancel
            </button>
          )}
        </div>

        {/* Avatar */}
        <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-gray-200 bg-white">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-[11px] font-semibold text-gray-500">
                  No Avatar
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <div className={ui.label}>Profile photo</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarPick}
                  className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-900 file:shadow-sm hover:file:bg-gray-50"
                />
                <p className="mt-2 text-xs text-gray-500">Max 2MB.</p>
              </div>

              <button
                type="button"
                className={ui.softBtn}
                onClick={uploadAvatar}
                disabled={!!busy.avatar || !avatarFile}
              >
                {busy.avatar ? "Uploading..." : "Upload avatar"}
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="mt-5 space-y-3">
          <div className="space-y-1">
            <div className={ui.label}>Display name</div>
            <input
              value={form.displayName}
              placeholder="e.g. John Doe"
              className={ui.input}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <div className={ui.label}>Username</div>
            <input
              value={form.username}
              placeholder="e.g. john"
              className={ui.input}
              onChange={(e) => setForm((f) => ({ ...f, username: normalizeUsername(e.target.value) }))}
            />
            <p className="text-xs text-gray-500">
              Your public link:{" "}
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-700 underline underline-offset-4"
              >
                {publicUrl.replace(/^https?:\/\//, "")}
              </a>
            </p>
          </div>

          <div className="space-y-1">
            <div className={ui.label}>Bio</div>
            <textarea
              value={form.bio}
              placeholder="A short sentence about you…"
              className={cx(ui.input, "min-h-[110px] resize-none")}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
          </div>

          <button className={ui.primaryBtn} type="button" onClick={saveProfile} disabled={!!busy.profile}>
            {busy.profile ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>
    </section>
  );
}
