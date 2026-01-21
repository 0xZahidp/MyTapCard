"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import DashboardTabs, { DashboardTabKey } from "@/components/dashboard/DashboardTabs";
import ProfileTab from "@/components/dashboard/tabs/ProfileTab";
import LinksTab from "@/components/dashboard/tabs/LinksTab";
import ShareTab from "@/components/dashboard/tabs/ShareTab";
import DesignTab from "@/components/dashboard/tabs/DesignTab";
import PreviewTab from "@/components/dashboard/tabs/PreviewTab";
import PaymentsTab from "@/components/dashboard/tabs/PaymentsTab";
import FinancialTab from "@/components/dashboard/tabs/FinancialTab";

import { cx } from "@/lib/dashboard-helpers";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [activeTab, setActiveTab] = useState<DashboardTabKey>("profile");

  const {
    me,
    profile,
    links,
    busy,
    notice,
    setNotice,
    refreshMe,
    refreshLinks,
    setBusy,
    setProfile,
    setMe,
    setLinks,
  } = useDashboardData();

  const banner = useMemo(() => {
    if (error === "not_admin") return "You are not an admin. Redirected to your dashboard.";
    if (error === "login_required") return "Please login first.";
    if (error === "invalid_session") return "Session expired. Please login again.";
    return null;
  }, [error]);

  const pageBg = "min-h-screen w-full bg-white";
  const container = "mx-auto w-full max-w-3xl px-4 pb-16 pt-6";

  return (
    <main className={pageBg}>
      <div className={container}>
        {/* Notices */}
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

        {/* Tabs */}
        <DashboardTabs active={activeTab} onChange={setActiveTab} />

        {/* Content */}
        <div className="mt-6 space-y-4">
          {activeTab === "profile" && (
            <ProfileTab
              me={me}
              profile={profile}
              busy={busy}
              setBusy={setBusy}
              setNotice={setNotice}
              refreshMe={refreshMe}
              setProfile={setProfile}
              setMe={setMe}
            />
          )}

          {activeTab === "links" && (
            <LinksTab
              links={links}
              busy={busy}
              setBusy={setBusy}
              setNotice={setNotice}
              refreshLinks={refreshLinks}
              setLinks={setLinks}
            />
          )}

          {activeTab === "financial" && <FinancialTab />}

          {activeTab === "design" && <DesignTab />}

          {activeTab === "share" && (
            <ShareTab profile={profile} busy={busy} setBusy={setBusy} setNotice={setNotice} />
          )}

          {activeTab === "preview" && <PreviewTab profile={profile} />}

          {activeTab === "payment" && (
            <PaymentsTab busy={busy} setBusy={setBusy} setNotice={setNotice} />
          )}
        </div>

        <div className="mt-10 text-center text-xs text-gray-400">MyTapCard • Dashboard</div>
      </div>
    </main>
  );
}
