"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ui } from "@/components/dashboard/ui";
import { cx, normalizeUsername, safeJson } from "@/lib/dashboard-helpers";
import type { Me, Profile } from "@/hooks/useDashboardData";

const BASE_URL_FALLBACK = typeof window !== "undefined" ? window.location.origin : "";
const ENV_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

function baseUrl() {
  return ENV_BASE_URL || BASE_URL_FALLBACK || "";
}

function isValidUsername(u: string) {
  // allow lowercase letters, numbers, underscore, dot
  return /^[a-z0-9._]+$/.test(u);
}

type NameStatus =
  | { state: "idle"; text?: string }
  | { state: "checking"; text: string }
  | { state: "ok"; text: string }
  | { state: "bad"; text: string };

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

  // ---- Username availability state ----
  const [nameStatus, setNameStatus] = useState<NameStatus>({ state: "idle" });

  const lastCheckedRef = useRef<string>("");
  const debounceRef = useRef<any>(null);

  // ✅ real pro status (from /api/me if you added it)
  const isProUser = Boolean((me as any)?.isPro);

  // ✅ If /api/me doesn't return profile, this fallback fetch makes inputs fill correctly
  const ensuredProfileRef = useRef(false);
  useEffect(() => {
    if (ensuredProfileRef.current) return;

    // If profile already exists, no need to fetch
    if (profile?.username || profile?.displayName || profile?.bio) {
      ensuredProfileRef.current = true;
      return;
    }

    // Only try once, and only if we have some "me" (logged in)
    if (!me?.email && !me?.name) return;

    ensuredProfileRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "GET",
          credentials: "same-origin",
        });
        const data = await safeJson<any>(res);
        if (res.ok && data) {
          setProfile({
            displayName: data.displayName,
            username: data.username,
            bio: data.bio,
          });
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.email, me?.name, profile?.username, profile?.displayName, profile?.bio]);

  // Sync form from profile props
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

    setNameStatus({ state: "idle" });
    lastCheckedRef.current = next.username || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.displayName, profile?.username, profile?.bio, me?.avatar]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
      if (debounceRef.current) clearTimeout(debounceRef.current);
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

      await refreshMe();
      setMe((prev) => ({ ...(prev || {}), avatar: data.avatar }));
    } finally {
      setBusy((b: any) => ({ ...b, avatar: false }));
    }
  };

  const localUsernameValidate = (username: string): NameStatus => {
    if (!username) return { state: "idle" };
    if (/\s/.test(username)) return { state: "bad", text: "No spaces allowed." };
    if (!isValidUsername(username))
      return { state: "bad", text: "Only a-z, 0-9, dot (.), underscore (_) allowed." };
    if (!isProUser && username.length < 5)
      return { state: "bad", text: "Minimum 5 characters for free users. Pro can use shorter." };
    return { state: "idle" };
  };

  // ✅ Debounced username availability check
  const scheduleUsernameCheck = (raw: string, force = false) => {
    const username = normalizeUsername(raw);

    // clear pending
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // local validation first
    const local = localUsernameValidate(username);
    if (local.state === "bad") {
      setNameStatus(local);
      return;
    }
    if (!username) {
      setNameStatus({ state: "idle" });
      return;
    }

    // don’t check same value repeatedly unless forced
    if (!force && username === lastCheckedRef.current) return;

    setNameStatus({ state: "checking", text: "Checking availability..." });

    debounceRef.current = setTimeout(async () => {
      try {
        lastCheckedRef.current = username;

        // If unchanged from saved username, consider it OK
        if (profile?.username && username === profile.username) {
          setNameStatus({ state: "ok", text: "This is your current username ✅" });
          return;
        }

        const res = await fetch(`/api/profile/username?username=${encodeURIComponent(username)}`, {
          method: "GET",
          credentials: "same-origin",
        });

        const data = await safeJson<any>(res);

        if (!res.ok) {
          setNameStatus({ state: "bad", text: data.message || "Could not check username." });
          return;
        }

        if (data.available) setNameStatus({ state: "ok", text: "Username is available ✅" });
        else setNameStatus({ state: "bad", text: "Username is taken ❌" });
      } catch {
        setNameStatus({ state: "bad", text: "Could not check username." });
      }
    }, 450);
  };

  const saveProfile = async () => {
    setNotice(null);

    const displayName = form.displayName.trim();
    const username = normalizeUsername(form.username);

    if (!displayName) {
      setNotice({ type: "err", text: "Display name is required." });
      return;
    }

    const local = localUsernameValidate(username);
    if (!username) {
      setNotice({ type: "err", text: "Username is required." });
      return;
    }
    if (local.state === "bad") {
      setNotice({ type: "err", text: local.text || "Invalid username." });
      return;
    }
    if (nameStatus.state === "bad") {
      setNotice({ type: "err", text: nameStatus.text || "Fix username issues." });
      return;
    }

    setBusy((b: any) => ({ ...b, profile: true }));
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...form, username }),
      });

      const data = await safeJson<any>(res);

      if (!res.ok) {
        setNotice({ type: "err", text: data.message || "Something went wrong" });
        return;
      }

      setNotice({ type: "ok", text: "Profile saved ✅" });

      // ✅ keep state consistent with server response
      const nextProfile = {
        displayName: data.displayName,
        username: data.username,
        bio: data.bio,
      };

      setProfile(nextProfile);
      setForm((f) => ({ ...f, ...nextProfile }));

      // ✅ show status as confirmed
      lastCheckedRef.current = data.username || "";
      setNameStatus({ state: "ok", text: "Saved ✅" });

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

        {/* ✅ Avatar on top (centered) */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-white">
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

            <div className="w-full max-w-md">
              <div className={ui.label}>Profile photo</div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarPick}
                className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-900 file:shadow-sm hover:file:bg-gray-50"
              />
              <p className="mt-2 text-xs text-gray-500">Max 2MB.</p>

              <button
                type="button"
                className={cx(ui.softBtn, "mt-3 w-full")}
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
              onChange={(e) => {
                const v = normalizeUsername(e.target.value);
                setForm((f) => ({ ...f, username: v }));
                scheduleUsernameCheck(v);
              }}
              onBlur={() => scheduleUsernameCheck(form.username, true)}
            />

            {/* ✅ availability / validation line */}
            {nameStatus.state !== "idle" && (
              <p
                className={cx(
                  "text-xs",
                  nameStatus.state === "ok" ? "text-green-600" : "",
                  nameStatus.state === "checking" ? "text-gray-500" : "",
                  nameStatus.state === "bad" ? "text-red-600" : ""
                )}
              >
                {nameStatus.text}
              </p>
            )}

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
