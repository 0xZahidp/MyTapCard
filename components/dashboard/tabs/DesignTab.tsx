"use client";

import { ui } from "@/components/dashboard/ui";

export default function DesignTab() {
  return (
    <section className={ui.card}>
      <div className={ui.cardPad}>
        <h2 className={ui.sectionTitle}>Design</h2>
        <p className={ui.sectionDesc}>
          Coming soon — theme, button styles, and layout customization.
        </p>

        <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-gray-900">Design tools will appear here</p>
          <p className="mt-1 text-xs text-gray-500">You can ship this now and add later.</p>
        </div>
      </div>
    </section>
  );
}
