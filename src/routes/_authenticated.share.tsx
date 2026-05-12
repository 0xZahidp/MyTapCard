import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Download,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Wallet,
  Link2,
  Layers,
  Package,
  Nfc,
  FileImage,
  FileText,
  Printer,
} from "lucide-react";

type CardSize = "business" | "standard" | "large";
const CARD_SIZES: Record<
  CardSize,
  { label: string; w: number; h: number; per: number; desc: string }
> = {
  business: { label: "Business card", w: 85, h: 55, per: 10, desc: "10 per A4 — 85×55 mm" },
  standard: { label: "Standard", w: 100, h: 65, per: 8, desc: "8 per A4 — 100×65 mm" },
  large: { label: "Large badge", w: 130, h: 85, per: 4, desc: "4 per A4 — 130×85 mm" },
};

const shareMotion = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export const Route = createFileRoute("/_authenticated/share")({
  head: () => ({ meta: [{ title: "Share — MyTapCard" }] }),
  component: SharePage,
});

type Visibility = "both" | "links" | "financial";

function SharePage() {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("both");
  const [qr, setQr] = useState<string>("");
  const [cardSize, setCardSize] = useState<CardSize>("business");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("username, display_name, share_visibility" as any)
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const d = data as any;
        setUsername(d?.username ?? null);
        setDisplayName(d?.display_name ?? null);
        setVisibility((d?.share_visibility as Visibility) ?? "both");
        setLoading(false);
      });
  }, [user]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const baseUrl = username ? `${origin}/${username}` : null;
  const shareUrl = useMemo(() => {
    if (!baseUrl) return null;
    return visibility === "both" ? baseUrl : `${baseUrl}?tab=${visibility}`;
  }, [baseUrl, visibility]);

  async function generate(target = shareUrl) {
    if (!target) return;
    const dataUrl = await QRCode.toDataURL(target, {
      width: 512,
      margin: 2,
      color: { dark: "#1B3C53", light: "#F9F3EF" },
    });
    setQr(dataUrl);
  }
  useEffect(() => {
    if (shareUrl) generate(shareUrl);
  }, [shareUrl]);

  async function updateVisibility(v: Visibility) {
    if (!user) return;
    setVisibility(v);
    const { error } = await supabase
      .from("profiles")
      .update({ share_visibility: v } as any)
      .eq("id", user.id);
    if (error) toast.error(error.message);
  }

  function downloadText(filename: string, text: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadHtml(filename: string, html: string) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadBlob(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadQrSvg() {
    if (!shareUrl || !username) return;
    const svg = await QRCode.toString(shareUrl, {
      type: "svg",
      margin: 2,
      color: { dark: "#1B3C53", light: "#FFFFFF" },
    });
    downloadBlob(
      `mytapcard-${username}-${visibility}.svg`,
      new Blob([svg], { type: "image/svg+xml" }),
    );
    toast.success("SVG downloaded");
  }

  async function downloadQrPdf() {
    if (!shareUrl || !username) return;
    const png = await QRCode.toDataURL(shareUrl, {
      width: 1200,
      margin: 2,
      color: { dark: "#1B3C53", light: "#FFFFFF" },
    });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const size = 100;
    const x = (210 - size) / 2;
    pdf.addImage(png, "PNG", x, 40, size, size);
    pdf.setFontSize(16);
    pdf.setTextColor("#1B3C53");
    pdf.text(displayName ?? username, 105, 160, { align: "center" });
    pdf.setFontSize(10);
    pdf.setTextColor("#456882");
    pdf.text(shareUrl, 105, 168, { align: "center" });
    pdf.setFontSize(9);
    pdf.text("Scan with any camera — or tap an NFC card linked to this URL.", 105, 180, {
      align: "center",
    });
    pdf.save(`mytapcard-${username}-${visibility}.pdf`);
    toast.success("PDF downloaded");
  }

  async function downloadCardSheetPdf(size: CardSize = cardSize) {
    if (!shareUrl || !username) return;
    const cfg = CARD_SIZES[size];
    const png = await QRCode.toDataURL(shareUrl, {
      width: 800,
      margin: 1,
      color: { dark: "#1B3C53", light: "#FFFFFF" },
    });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210,
      pageH = 297,
      margin = 10,
      gap = 4;
    const cols = Math.max(1, Math.floor((pageW - margin * 2 + gap) / (cfg.w + gap)));
    const rows = Math.max(1, Math.floor((pageH - margin * 2 + gap) / (cfg.h + gap)));
    let placed = 0;
    for (let r = 0; r < rows && placed < cfg.per; r++) {
      for (let c = 0; c < cols && placed < cfg.per; c++) {
        const x = margin + c * (cfg.w + gap);
        const y = margin + r * (cfg.h + gap);
        // card background
        pdf.setFillColor("#1B3C53");
        pdf.roundedRect(x, y, cfg.w, cfg.h, 3, 3, "F");
        // QR tile
        const qrSize = cfg.h - 8;
        pdf.setFillColor("#FFFFFF");
        pdf.roundedRect(x + 4, y + 4, qrSize, qrSize, 2, 2, "F");
        pdf.addImage(png, "PNG", x + 5, y + 5, qrSize - 2, qrSize - 2);
        // text
        pdf.setTextColor("#FFFFFF");
        pdf.setFontSize(cfg.w > 110 ? 14 : 11);
        pdf.text(displayName ?? username, x + qrSize + 8, y + 12);
        pdf.setFontSize(cfg.w > 110 ? 9 : 7);
        pdf.setTextColor("#D9C2A6");
        const url = shareUrl.replace(/^https?:\/\//, "");
        pdf.text(url, x + qrSize + 8, y + 18, { maxWidth: cfg.w - qrSize - 12 });
        pdf.setFontSize(cfg.w > 110 ? 8 : 6);
        pdf.setTextColor("#F9F3EF");
        pdf.text("Tap or scan", x + qrSize + 8, y + cfg.h - 6);
        placed++;
      }
    }
    pdf.save(`mytapcard-${username}-cards-${size}.pdf`);
    toast.success(`${cfg.label} sheet downloaded`);
  }

  async function downloadAssetPack() {
    if (!shareUrl || !username) return;
    // 1. QR PNG (high resolution for printing)
    const hiRes = await QRCode.toDataURL(shareUrl, {
      width: 1200,
      margin: 2,
      color: { dark: "#1B3C53", light: "#FFFFFF" },
    });
    downloadBlob(`mytapcard-${username}-qr.png`, await (await fetch(hiRes)).blob());

    // 2. QR SVG (vector — scales to any size)
    const svg = await QRCode.toString(shareUrl, {
      type: "svg",
      margin: 2,
      color: { dark: "#1B3C53", light: "#FFFFFF" },
    });
    downloadBlob(`mytapcard-${username}-qr.svg`, new Blob([svg], { type: "image/svg+xml" }));

    // 3. QR PDF single page
    await downloadQrPdf();

    // 4. Printable card sheet PDF in selected size
    await downloadCardSheetPdf(cardSize);

    // 5. NFC instructions
    const instructions = `MyTapCard — NFC Setup Instructions
=====================================

Public profile: ${shareUrl}
Visibility: ${visibility === "both" ? "Links + Financial" : visibility === "links" ? "Links only" : "Financial only"}

WHAT YOU NEED
- An NFC tag (NTAG213 / NTAG215 / NTAG216 — most cards & stickers use these)
- An Android phone, OR an iPhone XS or newer (iOS reads NFC natively)
- A free NFC writer app:
    Android: "NFC Tools" by wakdev
    iOS:     "NFC Tools" by wakdev (App Store)

WRITE YOUR URL TO THE TAG
1. Open NFC Tools.
2. Tap "Write" → "Add a record" → "URL / URI".
3. Paste this URL exactly:
       ${shareUrl}
4. Tap "OK", then "Write" — hold your tag against the back of your phone
   until the app confirms the write succeeded.
5. (Optional) In the app, lock the tag to make the URL permanent.

INCLUDED FILES
- mytapcard-${username}-qr.png  (1200×1200 raster, great for web/print)
- mytapcard-${username}-qr.svg  (vector — scales to any size without loss)
- mytapcard-${username}-${visibility}.pdf  (single-page printable QR)
- mytapcard-${username}-cards-${cardSize}.pdf  (${CARD_SIZES[cardSize].desc})

Prepared for ${displayName ?? username} — ${new Date().toLocaleDateString()}
`;
    downloadText(`mytapcard-${username}-nfc-instructions.txt`, instructions);

    toast.success("Assets pack downloaded");
  }

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Share your card</h1>
        <p className="mt-1 text-muted-foreground">Share by link, QR code, or NFC tap card.</p>
      </header>

      {!username ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
          <p className="text-muted-foreground">
            Set a username on your <strong>Profile</strong> page to enable sharing.
          </p>
        </div>
      ) : (
        <>
          {/* URL row */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Share URL
              </div>
              <div className="truncate font-mono text-sm">{shareUrl}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl!);
                toast.success("Copied");
              }}
            >
              <Copy className="h-4 w-4" /> Copy
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={shareUrl!} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Open
              </a>
            </Button>
          </div>

          {/* Visibility */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Layers className="h-4 w-4" /> What to show
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose which tabs visitors see when they open this share. The QR and link below
                update automatically.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  {
                    id: "both",
                    name: "Links + Financial",
                    desc: "Both tabs visible",
                    icon: Layers,
                  },
                  { id: "links", name: "Links only", desc: "Hide payments", icon: Link2 },
                  {
                    id: "financial",
                    name: "Financial only",
                    desc: "Just the wallet",
                    icon: Wallet,
                  },
                ] as const
              ).map((opt) => {
                const active = visibility === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateVisibility(opt.id as Visibility)}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-smooth ${active ? "border-primary bg-secondary/40 shadow-soft" : "border-border hover:border-primary/40"}`}
                  >
                    <opt.icon className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm font-semibold">{opt.name}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* QR */}
          <motion.div
            variants={shareMotion}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-3xl border border-border bg-card text-center shadow-elegant"
          >
            <div className="bg-mesh px-6 py-8">
              <div className="mx-auto max-w-sm">
                <div className="share-card-float relative mx-auto w-fit">
                  <div className="share-card-scan relative rounded-[2rem] border border-white/60 bg-white/80 p-4 shadow-elegant backdrop-blur">
                    {qr ? (
                      <img
                        src={qr}
                        alt="QR code"
                        className="h-64 w-64 rounded-2xl bg-cream p-3 shadow-soft"
                      />
                    ) : (
                      <div className="h-64 w-64 animate-pulse rounded-2xl bg-secondary" />
                    )}
                  </div>
                </div>
                <div className="mt-5">
                  <h2 className="text-xl font-bold">Ready-to-share card</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Download the QR, print a card sheet, or write the same link to NFC.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => generate()}>
                <RefreshCw className="h-4 w-4" /> Regenerate
              </Button>
              <Button variant="hero" asChild>
                <a href={qr} download={`mytapcard-${username}-${visibility}.png`}>
                  <Download className="h-4 w-4" /> PNG
                </a>
              </Button>
              <Button variant="outline" onClick={downloadQrSvg}>
                <FileImage className="h-4 w-4" /> SVG (vector)
              </Button>
              <Button variant="outline" onClick={downloadQrPdf}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </div>

            {/* Card sheet sizes */}
            <div className="px-6 pb-8 pt-8 text-left">
              <div className="mb-3 flex items-center gap-2">
                <Printer className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Printable card sheet (PDF)</h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(CARD_SIZES) as CardSize[]).map((id) => {
                  const cfg = CARD_SIZES[id];
                  const active = cardSize === id;
                  return (
                    <motion.button
                      key={id}
                      onClick={() => setCardSize(id)}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      className={`rounded-2xl border-2 p-3 text-left transition-smooth ${active ? "border-primary bg-secondary/40" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="text-sm font-semibold">{cfg.label}</div>
                      <div className="text-xs text-muted-foreground">{cfg.desc}</div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => downloadCardSheetPdf(cardSize)}>
                  <Printer className="h-4 w-4" /> Download {CARD_SIZES[cardSize].label} sheet
                </Button>
                <Button variant="hero" onClick={downloadAssetPack}>
                  <Package className="h-4 w-4" /> Download full assets pack
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Pack includes PNG + SVG + single-page PDF + the selected card sheet PDF + NFC setup
                guide.
              </p>
            </div>
          </motion.div>

          {/* NFC instructions */}
          <motion.section
            variants={shareMotion}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl border border-border bg-card p-6 shadow-soft"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                <Nfc className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Set up your NFC tap card</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Write your share URL to any NFC tag, sticker, or card and tap to share.
                </p>
              </div>
            </div>
            <ol className="space-y-3 text-sm">
              <Step n={1} title="Get an NFC tag">
                NTAG213, NTAG215, or NTAG216 work with all phones. Cards, stickers, and keyrings all
                work the same way.
              </Step>
              <Step n={2} title="Install a free NFC writer app">
                <span className="block text-muted-foreground">
                  Android: <strong>NFC Tools</strong> by wakdev. iOS (XS or newer):{" "}
                  <strong>NFC Tools</strong> on the App Store.
                </span>
              </Step>
              <Step n={3} title="Write your URL">
                Open NFC Tools → <em>Write</em> → <em>Add record</em> → <em>URL / URI</em>. Paste
                the URL above and tap your tag against the back of your phone.
              </Step>
              <Step n={4} title="(Optional) Lock the tag">
                In NFC Tools, choose <em>Lock tag</em> to make the URL permanent so it can't be
                overwritten.
              </Step>
              <Step n={5} title="Test it">
                <span className="inline-flex items-center gap-1">
                  <Smartphone className="h-3.5 w-3.5" /> Hold a phone near the tag — your profile
                  opens instantly.
                </span>
              </Step>
            </ol>
          </motion.section>
        </>
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-foreground">
        {n}
      </span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="mt-0.5 text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}
