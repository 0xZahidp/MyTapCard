"use client";

import { useState } from "react";
import { ui } from "@/components/dashboard/ui";
import { safeJson } from "@/lib/dashboard-helpers";
import type { Profile } from "@/hooks/useDashboardData";

export default function ShareTab({
  profile,
  busy,
  setBusy,
  setNotice,
}: {
  profile: Profile | null;
  busy: any;
  setBusy: any;
  setNotice: any;
}) {
  const [qr, setQr] = useState<string | null>(null);

  const generateQr = async () => {
    setBusy((b: any) => ({ ...b, qr: true }));
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
      setBusy((b: any) => ({ ...b, qr: false }));
    }
  };

  return (
    <section className={ui.card}>
      <div className={ui.cardPad}>
        <h2 className={ui.sectionTitle}>Your QR code</h2>
        <p className={ui.sectionDesc}>Generate and download your QR anytime.</p>

        <div className="mt-5 space-y-3">
          <button className={ui.primaryBtn} onClick={generateQr} disabled={!!busy.qr} type="button">
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
  );
}
