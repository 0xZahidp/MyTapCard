"use client";

import { getBaseUrl } from "@/lib/dashboard-helpers";

export default function ProfileHero({
  avatarUrl,
  displayName,
  username,
  onPickAvatarClick,
}: {
  avatarUrl?: string | null;
  displayName?: string | null;
  username?: string | null;
  onPickAvatarClick: () => void;
}) {
  const baseUrl = getBaseUrl();
  const publicUrl = username ? `${baseUrl}/${username}` : baseUrl ? `${baseUrl}/username` : "";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mt-2">
        <div className="h-28 w-28 overflow-hidden rounded-full border border-gray-200 bg-gray-50 shadow-sm">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs font-semibold text-gray-500">
              No Avatar
            </div>
          )}
        </div>

        {/* camera overlay */}
        <button
          type="button"
          onClick={onPickAvatarClick}
          className="absolute inset-0 grid place-items-center rounded-full bg-black/10 opacity-0 transition hover:opacity-100"
          title="Change photo"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-lg shadow">
            📷
          </span>
        </button>
      </div>

      <h1 className="mt-4 text-xl font-bold text-gray-900">
        {displayName || "Your Name"}
      </h1>

      {publicUrl ? (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-sm font-medium text-sky-600 hover:underline"
        >
          {publicUrl.replace(/^https?:\/\//, "")}
        </a>
      ) : (
        <div className="mt-1 text-sm text-gray-400">Set NEXT_PUBLIC_BASE_URL</div>
      )}
    </div>
  );
}
