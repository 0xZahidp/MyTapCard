"use client";

import { useState } from "react";

export default function ProfileAvatar({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || "");

  const uploadAvatar = async (file: File) => {
    if (!file) return;

    // Client-side checks (server also checks)
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Max image size is 2MB");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Upload failed");
        return;
      }

      setAvatar(data.avatar || "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={avatar || "/avatar-placeholder.png"}
        alt="Avatar"
        className="w-24 h-24 rounded-full object-cover border"
        referrerPolicy="no-referrer"
      />

      <label className="cursor-pointer text-sm text-blue-600">
        {loading ? "Uploading..." : "Change Avatar"}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => e.target.files && uploadAvatar(e.target.files[0])}
        />
      </label>
    </div>
  );
}
