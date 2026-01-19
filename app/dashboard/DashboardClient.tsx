"use client";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;


import { useEffect, useMemo, useState, FormEvent, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";

type ProfileForm = {
  displayName: string;
  username: string;
  bio: string;
};

type LinkType = "url" | "phone" | "email" | "";

type LinkForm = {
  type: LinkType;
  label: string;
  value: string;
};

type LinkItem = {
  _id: string;
  type: Exclude<LinkType, "">;
  label: string;
  value: string;
};

type Me = {
  avatar?: string;
  name?: string;
  email?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function safeJson<T = any>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPhone(v: string) {
  // very permissive, you can tighten later
  return /^[+()\-\s0-9]{6,}$/.test(v.trim());
}

function normalizeUsername(v: string) {
  return v
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^\.+/, "")
    .slice(0, 30);
}

function normalizeLinkValue(type: Exclude<LinkType, "">, value: string) {
  const v = value.trim();

  if (type === "url") {
    // Auto add https:// if missing
    if (!/^https?:\/\//i.test(v)) return `https://${v}`;
    return v;
  }

  if (type === "email") return v.toLowerCase();

  // phone
  return v;
}

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [form, setForm] = useState<ProfileForm>({
    displayName: "",
    username: "",
    bio: "",
  });

  const [linkForm, setLinkForm] = useState<LinkForm>({
    type: "",
    label: "",
    value: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    method: "",
    transactionId: "",
    amount: 0,
  });

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [qr, setQr] = useState<string | null>(null);

  const [busy, setBusy] = useState<{
    profile?: boolean;
    link?: boolean;
    qr?: boolean;
    pay?: boolean;
    avatar?: boolean;
  }>({});

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const banner = useMemo(() => {
    if (error === "not_admin")
      return "You are not an admin. Redirected to your dashboard.";
    if (error === "login_required") return "Please login first.";
    if (error === "invalid_session")
      return "Session expired. Please login again.";
    return null;
  }, [error]);

  // ====== Styles ======
  const pageBg =
    "min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100";
  const container = "mx-auto w-full max-w-5xl px-4 py-8";
  const card =
    "rounded-3xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]";
  const cardPad = "p-6";
  const sectionTitle = "text-base font-semibold tracking-tight text-gray-900";
  const sectionDesc = "mt-1 text-sm leading-6 text-gray-600";
  const label = "text-xs font-semibold text-gray-700";
  const input =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100";
  const select =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100";
  const primaryBtn =
    "inline-flex w-full items-center justify-center rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60";
  const softBtn =
    "inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60";
  const miniBtn =
    "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition";
  const dangerMiniBtn =
    "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition";

  const fetchLinks = async () => {
    const res = await fetch("/api/links", { credentials: "same-origin" });
    const data = await safeJson<any>(res);
    setLinks(Array.isArray(data) ? data : []);
  };

  const fetchMe = async () => {
    const res = await fetch("/api/me", { credentials: "same-origin" });
    const data = await safeJson<any>(res);
    if (res.ok) {
      setMe(data.user ?? null);
      if (data.user?.avatar) setAvatarPreview(data.user.avatar);
      // Optional: if your /api/me returns profile fields, you can prefill:
      if (data.profile) {
        setForm({
          displayName: data.profile.displayName ?? "",
          username: data.profile.username ?? "",
          bio: data.profile.bio ?? "",
        });
      }
    }
  };

  useEffect(() => {
    fetchLinks();
    fetchMe();
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleProfileChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "username") {
      setForm((f) => ({ ...f, username: normalizeUsername(value) }));
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!form.displayName.trim()) {
      setNotice({ type: "err", text: "Display name is required." });
      return;
    }
    if (!form.username.trim()) {
      setNotice({ type: "err", text: "Username is required." });
      return;
    }

    setBusy((b) => ({ ...b, profile: true }));
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });

      const data = await safeJson<any>(res);

      if (res.ok) setNotice({ type: "ok", text: "Profile saved ✅" });
      else setNotice({ type: "err", text: data.message || "Something went wrong" });
    } finally {
      setBusy((b) => ({ ...b, profile: false }));
    }
  };

  // ✅ Avatar
  const handleAvatarPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setNotice(null);

    if (file) setAvatarPreview(URL.createObjectURL(file));
    else setAvatarPreview(null);
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

    setBusy((b) => ({ ...b, avatar: true }));
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
      setAvatarPreview(data.avatar || null);
      setAvatarFile(null);
      await fetchMe();
    } finally {
      setBusy((b) => ({ ...b, avatar: false }));
    }
  };

  // ✅ Links
  const handleLinkSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!linkForm.type || !linkForm.label.trim() || !linkForm.value.trim()) {
      setNotice({ type: "err", text: "All link fields are required." });
      return;
    }

    const t = linkForm.type;
    const normalized = normalizeLinkValue(t as any, linkForm.value);

    if (t === "email" && !isValidEmail(normalized)) {
      setNotice({ type: "err", text: "Please enter a valid email." });
      return;
    }
    if (t === "phone" && !isValidPhone(normalized)) {
      setNotice({ type: "err", text: "Please enter a valid phone number." });
      return;
    }

    setBusy((b) => ({ ...b, link: true }));
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...linkForm,
          value: normalized,
        }),
      });

      const data = await safeJson<any>(res);

      if (!res.ok) {
        setNotice({ type: "err", text: data.message || "Failed to add link" });
        return;
      }

      setNotice({ type: "ok", text: "Link added ✅" });
      setLinkForm({ type: "", label: "", value: "" });
      await fetchLinks();
    } finally {
      setBusy((b) => ({ ...b, link: false }));
    }
  };

  const moveLink = async (id: string, direction: "up" | "down") => {
    await fetch("/api/links/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id, direction }),
    });
    await fetchLinks();
  };

  const deleteLink = async (id: string) => {
    await fetch(`/api/links/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    await fetchLinks();
  };

  // ✅ QR
  const generateQr = async () => {
    setBusy((b) => ({ ...b, qr: true }));
    setNotice(null);
    try {
      const res = await fetch("/api/qr", { credentials: "same-origin" });
      const data = await safeJson<any>(res);

      if (!res.ok) {
        setNotice({ type: "err", text: data.message || "Failed to generate QR" });
        return;
      }

      setQr(data.qr || null);
      if (!data.qr) setNotice({ type: "err", text: "No QR returned from server." });
    } finally {
      setBusy((b) => ({ ...b, qr: false }));
    }
  };

  // ✅ Payments
  const submitPayment = async (e: FormEvent) => {
    e.preventDefault();
    setBusy((b) => ({ ...b, pay: true }));
    setNotice(null);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(paymentForm),
      });

      const data = await safeJson<any>(res);

      if (!res.ok) {
        setNotice({ type: "err", text: data.message || "Payment submit failed" });
        return;
      }

      setNotice({ type: "ok", text: data.message || "Submitted ✅" });
      setPaymentForm({ method: "", transactionId: "", amount: 0 });
    } finally {
      setBusy((b) => ({ ...b, pay: false }));
    }
  };

  return (
    <main className={pageBg}>
      <div className={container}>
        {/* Top notices */}
        {banner && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {banner}
          </div>
        )}

        {notice && (
          <div
            className={cx(
              "mb-4 rounded-2xl border px-4 py-3 text-sm",
              notice.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            )}
          >
            {notice.text}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your public profile, links, and QR code.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2">
              <div className="h-8 w-8 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                {me?.avatar || avatarPreview ? (
                  <img
                    src={me?.avatar || (avatarPreview as string)}
                    alt="Me avatar"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[10px] font-semibold text-gray-500">
                    ME
                  </div>
                )}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-gray-900">
                  {me?.name || "MyTapCard"}
                </div>
                <div className="text-xs text-gray-500">{me?.email || " "}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* LEFT */}
          <div className="space-y-4">
            {/* Profile */}
            <section className={card}>
              <div className={cardPad}>
                <h2 className={sectionTitle}>Create your profile</h2>
                <p className={sectionDesc}>
                  This information appears on your public page.
                </p>

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
                        <div className={label}>Profile photo</div>
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
                        className={softBtn}
                        onClick={uploadAvatar}
                        disabled={!!busy.avatar || !avatarFile}
                      >
                        {busy.avatar ? "Uploading..." : "Upload avatar"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile form */}
                <form onSubmit={handleProfileSubmit} className="mt-5 space-y-3">
                  <div className="space-y-1">
                    <div className={label}>Display name</div>
                    <input
                      name="displayName"
                      value={form.displayName}
                      placeholder="e.g. John Doe"
                      className={input}
                      onChange={handleProfileChange}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className={label}>Username</div>
                    <input
                      name="username"
                      value={form.username}
                      placeholder="e.g. john"
                      className={input}
                      onChange={handleProfileChange}
                    />
                        <p className="text-xs text-gray-500">
                          Your public link:{" "}
                          <a
                            href={`${BASE_URL}/${form.username || "username"}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-gray-700 underline underline-offset-4"
                          >
                            {BASE_URL.replace(/^https?:\/\//, "")}/{form.username || "username"}
                          </a>
                        </p>
                  </div>

                  <div className="space-y-1">
                    <div className={label}>Bio</div>
                    <textarea
                      name="bio"
                      value={form.bio}
                      placeholder="A short sentence about you…"
                      className={cx(input, "min-h-[110px] resize-none")}
                      onChange={handleProfileChange}
                    />
                  </div>

                  <button className={primaryBtn} disabled={!!busy.profile}>
                    {busy.profile ? "Saving..." : "Save profile"}
                  </button>
                </form>
              </div>
            </section>

            {/* Links */}
            <section className={card}>
              <div className={cardPad}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className={sectionTitle}>Links</h2>
                    <p className={sectionDesc}>
                      Add, reorder, or delete links shown on your profile.
                    </p>
                  </div>

                  <button type="button" className={miniBtn} onClick={fetchLinks}>
                    Refresh
                  </button>
                </div>

                <form onSubmit={handleLinkSubmit} className="mt-5 space-y-3">
                  <div className="space-y-1">
                    <div className={label}>Type</div>
                    <select
                      value={linkForm.type}
                      className={select}
                      onChange={(e) =>
                        setLinkForm((f) => ({
                          ...f,
                          type: e.target.value as LinkType,
                        }))
                      }
                    >
                      <option value="">Select type</option>
                      <option value="url">URL</option>
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className={label}>Label</div>
                    <input
                      value={linkForm.label}
                      placeholder="Website, WhatsApp, Email…"
                      className={input}
                      onChange={(e) =>
                        setLinkForm((f) => ({ ...f, label: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <div className={label}>Value</div>
                    <input
                      value={linkForm.value}
                      placeholder={
                        linkForm.type === "email"
                          ? "email@domain.com"
                          : linkForm.type === "phone"
                          ? "+880..."
                          : "https://..."
                      }
                      className={input}
                      onChange={(e) =>
                        setLinkForm((f) => ({ ...f, value: e.target.value }))
                      }
                    />
                  </div>

                  <button className={primaryBtn} disabled={!!busy.link}>
                    {busy.link ? "Adding..." : "Add link"}
                  </button>
                </form>

                <div className="mt-6 space-y-3">
                  {links.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                      <p className="text-sm font-semibold text-gray-900">No links yet</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Add your first link above.
                      </p>
                    </div>
                  ) : (
                    links.map((link) => (
                      <div
                        key={String(link._id)}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-gray-900">
                            {link.label}
                          </div>
                          <div className="truncate text-xs text-gray-500">{link.value}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className={miniBtn}
                            onClick={() => moveLink(String(link._id), "up")}
                            title="Move up"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            className={miniBtn}
                            onClick={() => moveLink(String(link._id), "down")}
                            title="Move down"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            className={dangerMiniBtn}
                            onClick={() => deleteLink(String(link._id))}
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            {/* QR */}
            <section className={card}>
              <div className={cardPad}>
                <h2 className={sectionTitle}>Your QR code</h2>
                <p className={sectionDesc}>Generate and download your QR anytime.</p>

                <div className="mt-5 space-y-3">
                  <button className={primaryBtn} onClick={generateQr} disabled={!!busy.qr}>
                    {busy.qr ? "Generating..." : "Generate QR code"}
                  </button>

                  {qr && (
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={qr}
                          alt="QR Code"
                          className="w-52 rounded-2xl border border-gray-200 bg-white"
                        />

                        <a
                          href={qr}
                          download="mytapcard-qr.png"
                          className="text-sm font-semibold text-gray-900 underline underline-offset-4"
                        >
                          Download QR
                        </a>

                        <p className="text-xs text-gray-500">
                          Tip: Print it on your tap card, poster, or business card.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Upgrade */}
            <section className={card}>
              <div className={cardPad}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className={sectionTitle}>Upgrade to Pro</h2>
                    <p className={sectionDesc}>
                      Submit a payment request to upgrade your plan.
                    </p>
                  </div>

                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-700">
                    Manual
                  </span>
                </div>

                <form onSubmit={submitPayment} className="mt-5 space-y-3">
                  <div className="space-y-1">
                    <div className={label}>Payment method</div>
                    <select
                      className={select}
                      value={paymentForm.method}
                      onChange={(e) =>
                        setPaymentForm((p) => ({ ...p, method: e.target.value }))
                      }
                    >
                      <option value="">Select payment method</option>
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className={label}>Transaction ID</div>
                    <input
                      placeholder="e.g. 9A1B2C3D4E"
                      className={input}
                      value={paymentForm.transactionId}
                      onChange={(e) =>
                        setPaymentForm((p) => ({ ...p, transactionId: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <div className={label}>Amount</div>
                    <input
                      type="number"
                      placeholder="e.g. 499"
                      className={input}
                      value={paymentForm.amount ? String(paymentForm.amount) : ""}
                      onChange={(e) =>
                        setPaymentForm((p) => ({ ...p, amount: Number(e.target.value) }))
                      }
                    />
                  </div>

                  <button className={primaryBtn} disabled={!!busy.pay}>
                    {busy.pay ? "Submitting..." : "Submit payment"}
                  </button>

                  <p className="text-xs text-gray-500">
                    After verification, your account will be upgraded to Pro.
                  </p>
                </form>
              </div>
            </section>

            <div className="text-center text-xs text-gray-400">MyTapCard • Dashboard</div>
          </div>
        </div>
      </div>
    </main>
  );
}
