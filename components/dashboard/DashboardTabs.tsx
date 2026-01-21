"use client";

import { cx } from "@/lib/dashboard-helpers";
import { ui } from "@/components/dashboard/ui";

export type DashboardTabKey =
  | "profile"
  | "links"
  | "design"
  | "share"
  | "preview"
  | "payment"
  | "financial";

const tabs: Array<{ key: DashboardTabKey; label: string }> = [
  { key: "profile", label: "Profile" },
  { key: "links", label: "Links" },
  { key: "design", label: "Design" },
  { key: "share", label: "Share" },
  { key: "preview", label: "Preview" },
  { key: "payment", label: "Payment" },
  { key: "financial", label: "Financial" },
];

export default function DashboardTabs({
  active,
  onChange,
}: {
  active: DashboardTabKey;
  onChange: (k: DashboardTabKey) => void;
}) {
  return (
    <div className={cx(ui.card, "overflow-hidden")}>
      <div className={cx(ui.cardPad, "py-4")}>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const isActive = active === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onChange(t.key)}
                className={cx(
                  ui.miniBtn,
                  "px-4 py-2",
                  isActive && "border-gray-900 text-gray-900"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
