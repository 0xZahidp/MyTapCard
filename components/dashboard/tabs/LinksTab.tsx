"use client";

import { useState } from "react";
import { ui } from "@/components/dashboard/ui";
import {
  LinkType,
  cx,
  isValidEmail,
  isValidPhone,
  normalizeLinkValue,
  safeJson,
} from "@/lib/dashboard-helpers";
import type { LinkItem } from "@/hooks/useDashboardData";

export default function LinksTab({
  links,
  busy,
  setBusy,
  setNotice,
  refreshLinks,
  setLinks,
}: {
  links: LinkItem[];
  busy: any;
  setBusy: any;
  setNotice: any;
  refreshLinks: () => Promise<void>;
  setLinks: (l: LinkItem[]) => void;
}) {
  const [linkForm, setLinkForm] = useState<{
    type: LinkType;
    label: string;
    value: string;
  }>({ type: "", label: "", value: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!linkForm.type || !linkForm.label.trim() || !linkForm.value.trim()) {
      setNotice({ type: "err", text: "All link fields are required." });
      return;
    }

    const t = linkForm.type as Exclude<LinkType, "">;
    const normalized = normalizeLinkValue(t, linkForm.value);

    if (t === "email" && !isValidEmail(normalized)) {
      setNotice({ type: "err", text: "Please enter a valid email." });
      return;
    }
    if (t === "phone" && !isValidPhone(normalized)) {
      setNotice({ type: "err", text: "Please enter a valid phone number." });
      return;
    }

    setBusy((b: any) => ({ ...b, link: true }));
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...linkForm, value: normalized }),
      });

      const data = await safeJson<any>(res);

      if (!res.ok) {
        setNotice({ type: "err", text: data.message || "Failed to add link" });
        return;
      }

      setNotice({ type: "ok", text: "Link added ✅" });
      setLinkForm({ type: "", label: "", value: "" });
      await refreshLinks();
    } finally {
      setBusy((b: any) => ({ ...b, link: false }));
    }
  };

  const move = async (id: string, direction: "up" | "down") => {
    await fetch("/api/links/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id, direction }),
    });
    await refreshLinks();
  };

  const del = async (id: string) => {
    await fetch(`/api/links/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    await refreshLinks();
  };

  return (
    <section className={ui.card}>
      <div className={ui.cardPad}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className={ui.sectionTitle}>Links</h2>
            <p className={ui.sectionDesc}>Add, reorder, or delete links shown on your profile.</p>
          </div>

          <button type="button" className={ui.miniBtn} onClick={refreshLinks}>
            Refresh
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div className="space-y-1">
            <div className={ui.label}>Type</div>
            <select
              value={linkForm.type}
              className={ui.select}
              onChange={(e) => setLinkForm((f) => ({ ...f, type: e.target.value as LinkType }))}
            >
              <option value="">Select type</option>
              <option value="url">URL</option>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className={ui.label}>Label</div>
            <input
              value={linkForm.label}
              placeholder="Website, WhatsApp, Email…"
              className={ui.input}
              onChange={(e) => setLinkForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <div className={ui.label}>Value</div>
            <input
              value={linkForm.value}
              placeholder={
                linkForm.type === "email"
                  ? "email@domain.com"
                  : linkForm.type === "phone"
                  ? "+880..."
                  : "https://..."
              }
              className={ui.input}
              onChange={(e) => setLinkForm((f) => ({ ...f, value: e.target.value }))}
            />
          </div>

          <button className={ui.primaryBtn} disabled={!!busy.link}>
            {busy.link ? "Adding..." : "Add link"}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {links.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
              <p className="text-sm font-semibold text-gray-900">No links yet</p>
              <p className="mt-1 text-xs text-gray-500">Add your first link above.</p>
            </div>
          ) : (
            links.map((link) => (
              <div
                key={String(link._id)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">{link.label}</div>
                  <div className="truncate text-xs text-gray-500">{link.value}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" className={ui.miniBtn} onClick={() => move(String(link._id), "up")}>
                    ↑
                  </button>
                  <button type="button" className={ui.miniBtn} onClick={() => move(String(link._id), "down")}>
                    ↓
                  </button>
                  <button type="button" className={ui.dangerMiniBtn} onClick={() => del(String(link._id))}>
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
