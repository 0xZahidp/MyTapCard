"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";

type ProfileForm = {
  displayName: string;
  username: string;
  bio: string;
};

type LinkForm = {
  type: "url" | "phone" | "email" | "";
  label: string;
  value: string;
};

export default function DashboardPage() {
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

  // ✅ Day 12: store fetched links
  const [links, setLinks] = useState<any[]>([]);

  // ✅ Day 12: fetch links on load
  useEffect(() => {
    fetch("/api/links")
      .then((res) => res.json())
      .then((data) => setLinks(data));
  }, []);

  const handleProfileChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Profile saved 🎉");
    } else {
      alert(data.message || "Something went wrong");
    }
  };

  const handleLinkSubmit = async (e: FormEvent) => {
  e.preventDefault();

  if (!linkForm.type || !linkForm.label || !linkForm.value) {
    alert("All link fields are required");
    return;
  }

  const res = await fetch("/api/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(linkForm),
  });

  const data = await res.json();

  // ✅ PART 4 — Friendly message from backend
  if (!res.ok) {
    alert(data.message);
    return;
  }

  alert("Link added ✅");
  setLinkForm({ type: "", label: "", value: "" });

  // ✅ Refresh links list after add
  const refreshed = await fetch("/api/links").then((r) => r.json());
  setLinks(refreshed);
};

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create Your Profile</h1>

      {/* PROFILE FORM */}
      <form onSubmit={handleProfileSubmit} className="space-y-4">
        <input
          name="displayName"
          value={form.displayName}
          placeholder="Display Name"
          className="w-full border px-3 py-2 rounded"
          onChange={handleProfileChange}
        />

        <input
          name="username"
          value={form.username}
          placeholder="Username (public link)"
          className="w-full border px-3 py-2 rounded"
          onChange={handleProfileChange}
        />

        <textarea
          name="bio"
          value={form.bio}
          placeholder="Bio"
          className="w-full border px-3 py-2 rounded"
          onChange={handleProfileChange}
        />

        <button className="w-full bg-black text-white py-2 rounded">
          Save Profile
        </button>
      </form>

      <hr />

      {/* LINK FORM */}
      <h2 className="text-xl font-bold">Add Link</h2>

      <form onSubmit={handleLinkSubmit} className="space-y-3">
        <select
          value={linkForm.type}
          className="w-full border px-3 py-2 rounded"
          onChange={(e) =>
            setLinkForm({
              ...linkForm,
              type: e.target.value as LinkForm["type"],
            })
          }
        >
          <option value="">Select Type</option>
          <option value="url">URL</option>
          <option value="phone">Phone</option>
          <option value="email">Email</option>
        </select>

        <input
          value={linkForm.label}
          placeholder="Label (Facebook, Phone, Email)"
          className="w-full border px-3 py-2 rounded"
          onChange={(e) => setLinkForm({ ...linkForm, label: e.target.value })}
        />

        <input
          value={linkForm.value}
          placeholder="Value (https://..., +880..., email)"
          className="w-full border px-3 py-2 rounded"
          onChange={(e) => setLinkForm({ ...linkForm, value: e.target.value })}
        />

        <button className="w-full bg-black text-white py-2 rounded">
          Add Link
        </button>
      </form>

      <hr />

      {/* ✅ DAY 12: REORDER + DELETE UI */}
      <h2 className="text-xl font-bold">Your Links</h2>

      <div className="mt-4 space-y-3">
        {links.length === 0 ? (
          <p className="text-sm text-gray-500">No links yet.</p>
        ) : (
          links.map((link: any) => (
            <div
              key={String(link._id)}
              className="flex items-center justify-between border rounded px-3 py-2"
            >
              <span className="font-medium">{link.label}</span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await fetch("/api/links/reorder", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: link._id, direction: "up" }),
                    });

                    // refresh (better UX than location.reload)
                    const refreshed = await fetch("/api/links").then((r) =>
                      r.json()
                    );
                    setLinks(refreshed);
                  }}
                  className="text-xs border px-2 py-1 rounded"
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await fetch("/api/links/reorder", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: link._id, direction: "down" }),
                    });

                    const refreshed = await fetch("/api/links").then((r) =>
                      r.json()
                    );
                    setLinks(refreshed);
                  }}
                  className="text-xs border px-2 py-1 rounded"
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await fetch(`/api/links/${link._id}`, {
                      method: "DELETE",
                    });

                    const refreshed = await fetch("/api/links").then((r) =>
                      r.json()
                    );
                    setLinks(refreshed);
                  }}
                  className="text-xs border px-2 py-1 rounded text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
