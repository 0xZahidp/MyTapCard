"use client";

import { ui } from "@/components/dashboard/ui";
import type { Profile } from "@/hooks/useDashboardData";

const BASE_URL_FALLBACK =
  typeof window !== "undefined" ? window.location.origin : "";

const ENV_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

function baseUrl() {
  return ENV_BASE_URL || BASE_URL_FALLBACK || "";
}

export default function PreviewTab({ profile }: { profile: Profile | null }) {
  const username = (profile?.username || "").trim();

  if (!username) {
    return (
      <section className={ui.card}>
        <div className={ui.cardPad}>
          <h2 className={ui.sectionTitle}>Preview</h2>
          <p className={ui.sectionDesc}>Create your profile first to preview your public page.</p>
        </div>
      </section>
    );
  }

  const url = `${baseUrl()}/${username}`;

  return (
    <section className={ui.card}>
      <div className={ui.cardPad}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className={ui.sectionTitle}>Preview</h2>
            <p className={ui.sectionDesc}>This is how your public page looks.</p>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={ui.miniBtn}
          >
            Open ↗
          </a>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
          <iframe src={url} className="h-[700px] w-full" />
        </div>
      </div>
    </section>
  );
}
