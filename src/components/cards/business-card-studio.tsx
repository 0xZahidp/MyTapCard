import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import {
  Download,
  Printer,
  Sparkles,
  Wifi,
  Phone,
  Mail,
  Globe,
  RotateCw,
  Layers,
  FileCheck,
  Check,
  Palette,
  CreditCard,
  QrCode,
  Copy,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type CardThemeId =
  | "midnight"
  | "royal"
  | "minimal"
  | "emerald"
  | "crimson"
  | "amethyst"
  | "sunset"
  | "nordic"
  | "monochrome"
  | "sandstone";

export interface CardTheme {
  id: CardThemeId;
  name: string;
  desc: string;
  category: "dark" | "light" | "vibrant";
  // CSS preview colors
  frontBg: string;
  frontText: string;
  frontSubtext: string;
  accent: string;
  chipBg: string;
  chipBorder: string;
  chipLines: string;
  backBg: string;
  backText: string;
  // jsPDF colors [R, G, B]
  pdfBg: [number, number, number];
  pdfBgEnd?: [number, number, number];
  pdfText: [number, number, number];
  pdfSubtext: [number, number, number];
  pdfAccent: [number, number, number];
  pdfCardBorder?: [number, number, number];
  pdfChipBg: [number, number, number];
  pdfChipBorder: [number, number, number];
  pdfBackBg: [number, number, number];
  pdfBackText: [number, number, number];
  previewBorder: string;
}

export const CARD_THEMES: Record<CardThemeId, CardTheme> = {
  midnight: {
    id: "midnight",
    name: "Midnight Stealth",
    desc: "Matte obsidian with electric cyan accents",
    category: "dark",
    frontBg: "linear-gradient(135deg, #090d16 0%, #0f172a 50%, #020617 100%)",
    frontText: "#ffffff",
    frontSubtext: "#94a3b8",
    accent: "#38bdf8",
    chipBg: "linear-gradient(135deg, #334155, #1e293b)",
    chipBorder: "#475569",
    chipLines: "#64748b",
    backBg: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
    backText: "#ffffff",
    pdfBg: [15, 23, 42],
    pdfText: [255, 255, 255],
    pdfSubtext: [148, 163, 184],
    pdfAccent: [56, 189, 248],
    pdfChipBg: [30, 41, 59],
    pdfChipBorder: [71, 85, 105],
    pdfBackBg: [2, 6, 23],
    pdfBackText: [255, 255, 255],
    previewBorder: "border-sky-500/40 shadow-sky-500/10",
  },
  royal: {
    id: "royal",
    name: "Royal Gold Luxe",
    desc: "Executive charcoal with champagne gold foil",
    category: "dark",
    frontBg: "linear-gradient(135deg, #18181b 0%, #1c1917 50%, #09090b 100%)",
    frontText: "#fef08a",
    frontSubtext: "#d6d3d1",
    accent: "#eab308",
    chipBg: "linear-gradient(135deg, #ca8a04, #854d0e)",
    chipBorder: "#eab308",
    chipLines: "#fef08a",
    backBg: "linear-gradient(135deg, #09090b 0%, #1c1917 100%)",
    backText: "#fef08a",
    pdfBg: [24, 24, 27],
    pdfText: [254, 240, 138],
    pdfSubtext: [214, 211, 209],
    pdfAccent: [234, 179, 8],
    pdfChipBg: [133, 77, 14],
    pdfChipBorder: [234, 179, 8],
    pdfBackBg: [9, 9, 11],
    pdfBackText: [254, 240, 138],
    previewBorder: "border-amber-500/40 shadow-amber-500/10",
  },
  minimal: {
    id: "minimal",
    name: "Porcelain Minimal",
    desc: "Crisp architectural white & deep graphite",
    category: "light",
    frontBg: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    frontText: "#0f172a",
    frontSubtext: "#64748b",
    accent: "#0284c7",
    chipBg: "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
    chipBorder: "#94a3b8",
    chipLines: "#64748b",
    backBg: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    backText: "#0f172a",
    pdfBg: [255, 255, 255],
    pdfText: [15, 23, 42],
    pdfSubtext: [100, 116, 139],
    pdfAccent: [2, 132, 199],
    pdfCardBorder: [226, 232, 240],
    pdfChipBg: [226, 232, 240],
    pdfChipBorder: [148, 163, 184],
    pdfBackBg: [248, 250, 252],
    pdfBackText: [15, 23, 42],
    previewBorder: "border-slate-300 shadow-slate-300/30",
  },
  emerald: {
    id: "emerald",
    name: "Emerald Cyber",
    desc: "Nocturnal pine & vivid neon mint glow",
    category: "vibrant",
    frontBg: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #021f18 100%)",
    frontText: "#ecfdf5",
    frontSubtext: "#a7f3d0",
    accent: "#10b981",
    chipBg: "linear-gradient(135deg, #047857, #064e3b)",
    chipBorder: "#10b981",
    chipLines: "#34d399",
    backBg: "linear-gradient(135deg, #021f18 0%, #064e3b 100%)",
    backText: "#ecfdf5",
    pdfBg: [2, 44, 34],
    pdfText: [236, 253, 245],
    pdfSubtext: [167, 243, 208],
    pdfAccent: [16, 185, 129],
    pdfChipBg: [6, 78, 59],
    pdfChipBorder: [16, 185, 129],
    pdfBackBg: [2, 31, 24],
    pdfBackText: [236, 253, 245],
    previewBorder: "border-emerald-500/40 shadow-emerald-500/10",
  },
  crimson: {
    id: "crimson",
    name: "Crimson Velocity",
    desc: "Deep ruby noir with metallic rose-gold",
    category: "dark",
    frontBg: "linear-gradient(135deg, #1c050a 0%, #350a14 50%, #100206 100%)",
    frontText: "#fff1f2",
    frontSubtext: "#fecdd3",
    accent: "#f43f5e",
    chipBg: "linear-gradient(135deg, #9f1239, #4c0519)",
    chipBorder: "#f43f5e",
    chipLines: "#fda4af",
    backBg: "linear-gradient(135deg, #100206 0%, #2e0813 100%)",
    backText: "#fff1f2",
    pdfBg: [28, 5, 10],
    pdfText: [255, 241, 242],
    pdfSubtext: [254, 205, 211],
    pdfAccent: [244, 63, 94],
    pdfChipBg: [159, 18, 57],
    pdfChipBorder: [244, 63, 94],
    pdfBackBg: [16, 2, 6],
    pdfBackText: [255, 241, 242],
    previewBorder: "border-rose-500/40 shadow-rose-500/10",
  },
  amethyst: {
    id: "amethyst",
    name: "Cosmic Amethyst",
    desc: "Deep velvet violet with luminous lilac",
    category: "vibrant",
    frontBg: "linear-gradient(135deg, #120724 0%, #240e3f 50%, #0a0314 100%)",
    frontText: "#faf5ff",
    frontSubtext: "#e9d5ff",
    accent: "#c084fc",
    chipBg: "linear-gradient(135deg, #7e22ce, #3b0764)",
    chipBorder: "#a855f7",
    chipLines: "#d8b4fe",
    backBg: "linear-gradient(135deg, #0a0314 0%, #240e3f 100%)",
    backText: "#faf5ff",
    pdfBg: [18, 7, 36],
    pdfText: [250, 245, 255],
    pdfSubtext: [233, 213, 255],
    pdfAccent: [192, 132, 252],
    pdfChipBg: [126, 34, 206],
    pdfChipBorder: [168, 85, 247],
    pdfBackBg: [10, 3, 20],
    pdfBackText: [250, 245, 255],
    previewBorder: "border-purple-500/40 shadow-purple-500/10",
  },
  sunset: {
    id: "sunset",
    name: "Sunset Bronze",
    desc: "Executive copper & warm sunset bronze",
    category: "dark",
    frontBg: "linear-gradient(135deg, #1c0e09 0%, #341810 50%, #110603 100%)",
    frontText: "#fff7ed",
    frontSubtext: "#fed7aa",
    accent: "#fb923c",
    chipBg: "linear-gradient(135deg, #9a3412, #431407)",
    chipBorder: "#ea580c",
    chipLines: "#fdba74",
    backBg: "linear-gradient(135deg, #110603 0%, #341810 100%)",
    backText: "#fff7ed",
    pdfBg: [28, 14, 9],
    pdfText: [255, 247, 237],
    pdfSubtext: [254, 215, 170],
    pdfAccent: [251, 146, 60],
    pdfChipBg: [154, 52, 18],
    pdfChipBorder: [234, 88, 12],
    pdfBackBg: [17, 6, 3],
    pdfBackText: [255, 247, 237],
    previewBorder: "border-orange-500/40 shadow-orange-500/10",
  },
  nordic: {
    id: "nordic",
    name: "Nordic Glacier",
    desc: "Arctic deep marine with icy cyan",
    category: "dark",
    frontBg: "linear-gradient(135deg, #041a24 0%, #073142 50%, #021118 100%)",
    frontText: "#ecfeff",
    frontSubtext: "#a5f3fc",
    accent: "#22d3ee",
    chipBg: "linear-gradient(135deg, #0e7490, #155e75)",
    chipBorder: "#06b6d4",
    chipLines: "#67e8f9",
    backBg: "linear-gradient(135deg, #021118 0%, #073142 100%)",
    backText: "#ecfeff",
    pdfBg: [4, 26, 36],
    pdfText: [236, 254, 255],
    pdfSubtext: [165, 243, 252],
    pdfAccent: [34, 211, 238],
    pdfChipBg: [14, 116, 144],
    pdfChipBorder: [6, 182, 212],
    pdfBackBg: [2, 17, 24],
    pdfBackText: [236, 254, 255],
    previewBorder: "border-cyan-500/40 shadow-cyan-500/10",
  },
  monochrome: {
    id: "monochrome",
    name: "Titanium Monolith",
    desc: "High-contrast matte carbon & silver platinum",
    category: "dark",
    frontBg: "linear-gradient(135deg, #121214 0%, #202024 50%, #0b0b0d 100%)",
    frontText: "#ffffff",
    frontSubtext: "#a1a1aa",
    accent: "#e4e4e7",
    chipBg: "linear-gradient(135deg, #3f3f46, #27272a)",
    chipBorder: "#71717a",
    chipLines: "#a1a1aa",
    backBg: "linear-gradient(135deg, #0b0b0d 0%, #202024 100%)",
    backText: "#ffffff",
    pdfBg: [18, 18, 20],
    pdfText: [255, 255, 255],
    pdfSubtext: [161, 161, 170],
    pdfAccent: [228, 228, 231],
    pdfChipBg: [63, 63, 70],
    pdfChipBorder: [113, 113, 122],
    pdfBackBg: [11, 11, 13],
    pdfBackText: [255, 255, 255],
    previewBorder: "border-zinc-400/40 shadow-zinc-400/10",
  },
  sandstone: {
    id: "sandstone",
    name: "Artisan Sandstone",
    desc: "Warm heritage ivory, espresso & terracotta",
    category: "light",
    frontBg: "linear-gradient(135deg, #fdfbf7 0%, #f5efe6 50%, #ece2d0 100%)",
    frontText: "#291809",
    frontSubtext: "#78593a",
    accent: "#c2410c",
    chipBg: "linear-gradient(135deg, #d6c7b2, #b8a389)",
    chipBorder: "#8c7355",
    chipLines: "#5c4731",
    backBg: "linear-gradient(135deg, #f5efe6 0%, #ece2d0 100%)",
    backText: "#291809",
    pdfBg: [253, 251, 247],
    pdfText: [41, 24, 9],
    pdfSubtext: [120, 89, 58],
    pdfAccent: [194, 65, 12],
    pdfCardBorder: [214, 199, 178],
    pdfChipBg: [214, 199, 178],
    pdfChipBorder: [140, 115, 85],
    pdfBackBg: [245, 239, 230],
    pdfBackText: [41, 24, 9],
    previewBorder: "border-amber-300 shadow-amber-200/30",
  },
};

interface BusinessCardStudioProps {
  username: string;
  displayName: string | null;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  shareUrl: string;
  userId?: string;
  onPhoneUpdate?: (phone: string) => void;
}

export function BusinessCardStudio({
  username,
  displayName,
  bio,
  phone: initialPhone,
  email: initialEmail,
  website: initialWebsite,
  shareUrl,
  userId,
  onPhoneUpdate,
}: BusinessCardStudioProps) {
  const [themeId, setThemeId] = useState<CardThemeId>("midnight");
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPhone, setShowPhone] = useState(Boolean(initialPhone?.trim()));
  const [showEmail, setShowEmail] = useState(true);
  const [showWebsite, setShowWebsite] = useState(true);
  const [showNfcLogo, setShowNfcLogo] = useState(true);
  const [savingPhone, setSavingPhone] = useState(false);

  // Editable details for card preview & export
  const [name, setName] = useState(displayName || username || "Your Name");
  const [title, setTitle] = useState(
    bio && bio.length < 50 ? bio : "Digital Identity & Contact Card"
  );
  // Phone starts from initialPhone without falling back to any fake dummy number!
  const [phone, setPhone] = useState(initialPhone?.trim() || "");
  const [email, setEmail] = useState(initialEmail || (username ? `${username}@mytapcard.online` : ""));
  const [website, setWebsite] = useState(
    initialWebsite || (username ? `mytapcard.online/${username}` : "mytapcard.online")
  );

  useEffect(() => {
    if (initialPhone !== undefined) {
      const val = initialPhone?.trim() || "";
      setPhone(val);
      setShowPhone(Boolean(val));
    }
  }, [initialPhone]);

  async function savePhoneToAccount() {
    if (!userId || !phone.trim()) return;
    setSavingPhone(true);
    try {
      const { data: existingLink } = await supabase
        .from("links")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "phone")
        .maybeSingle();

      if (existingLink) {
        await supabase
          .from("links")
          .update({ value: phone.trim() })
          .eq("id", existingLink.id);
      } else {
        await supabase.from("links").insert({
          user_id: userId,
          type: "phone",
          label: "Phone",
          value: phone.trim(),
          position: 0,
        });
      }
      setShowPhone(true);
      onPhoneUpdate?.(phone.trim());
      toast.success("Phone number saved to your account!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save phone number");
    } finally {
      setSavingPhone(false);
    }
  }

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const theme = CARD_THEMES[themeId];

  // Generate crisp QR code
  useEffect(() => {
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl, {
      width: 600,
      margin: 1,
      color: {
        dark: themeId === "minimal" ? "#0f172a" : "#0a0f1d",
        light: "#ffffff",
      },
    }).then((url) => setQrDataUrl(url));
  }, [shareUrl, themeId]);

  // Standard CR80 Card Dimensions (in mm)
  const CARD_W = 85.6;
  const CARD_H = 53.98;
  const CARD_RADIUS = 3.18;

  // 1. Download Single Card Print-Ready PDF (Page 1 = Front, Page 2 = Back)
  async function downloadSingleCardPdf() {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [CARD_W, CARD_H],
      });

      // --- PAGE 1: FRONT ---
      renderPdfFront(pdf, 0, 0, CARD_W, CARD_H, theme);

      // --- PAGE 2: BACK ---
      pdf.addPage([CARD_W, CARD_H], "landscape");
      await renderPdfBack(pdf, 0, 0, CARD_W, CARD_H, theme, qrDataUrl);

      pdf.save(`mytapcard-${username}-business-card.pdf`);
      toast.success("Print-Ready Business Card PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  // 2. Download A4 Print Sheet (10 cards on 1 page with dotted cut lines)
  async function downloadA4SheetPdf() {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageW = 210;
      const pageH = 297;
      const marginX = 14;
      const marginY = 13.5;
      const gapX = 10;
      const gapY = 8;
      const cols = 2;
      const rows = 5;

      // Header guide text
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `MyTapCard Printable Sheet — 10 Cards (CR80 Standard 85.6×54 mm) — ${username}`,
        marginX,
        8
      );

      let count = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = marginX + c * (CARD_W + gapX);
          const y = marginY + r * (CARD_H + gapY);

          // Render card front
          renderPdfFront(pdf, x, y, CARD_W, CARD_H, theme);

          // Dotted crop line around card
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineDashPattern([1, 1], 0);
          pdf.rect(x - 0.5, y - 0.5, CARD_W + 1, CARD_H + 1);
          pdf.setLineDashPattern([], 0); // reset
          count++;
        }
      }

      // Page 2: Backs of cards (aligned for double-sided printing)
      pdf.addPage("a4", "portrait");
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `MyTapCard Printable Sheet — Reverse Side (QR Codes) — ${username}`,
        marginX,
        8
      );

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Mirror column for double-sided print alignment
          const mirroredCol = cols - 1 - c;
          const x = marginX + mirroredCol * (CARD_W + gapX);
          const y = marginY + r * (CARD_H + gapY);

          await renderPdfBack(pdf, x, y, CARD_W, CARD_H, theme, qrDataUrl);

          pdf.setDrawColor(203, 213, 225);
          pdf.setLineDashPattern([1, 1], 0);
          pdf.rect(x - 0.5, y - 0.5, CARD_W + 1, CARD_H + 1);
          pdf.setLineDashPattern([], 0);
        }
      }

      pdf.save(`mytapcard-${username}-printable-a4-sheet.pdf`);
      toast.success("Printable A4 Card Sheet downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate sheet PDF.");
    } finally {
      setIsExporting(false);
    }
  }

  // 3. Render PDF Front
  function renderPdfFront(
    pdf: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    t: CardTheme
  ) {
    // Background fill
    pdf.setFillColor(t.pdfBg[0], t.pdfBg[1], t.pdfBg[2]);
    pdf.roundedRect(x, y, w, h, CARD_RADIUS, CARD_RADIUS, "F");

    // Optional border for light themes
    if (t.pdfCardBorder) {
      pdf.setDrawColor(t.pdfCardBorder[0], t.pdfCardBorder[1], t.pdfCardBorder[2]);
      pdf.roundedRect(x, y, w, h, CARD_RADIUS, CARD_RADIUS, "S");
    }

    // Smart chip graphic on left
    const chipX = x + 7;
    const chipY = y + 7;
    const chipW = 11;
    const chipH = 8.5;
    pdf.setFillColor(t.pdfChipBg[0], t.pdfChipBg[1], t.pdfChipBg[2]);
    pdf.roundedRect(chipX, chipY, chipW, chipH, 1, 1, "F");
    pdf.setDrawColor(t.pdfChipBorder[0], t.pdfChipBorder[1], t.pdfChipBorder[2]);
    pdf.roundedRect(chipX, chipY, chipW, chipH, 1, 1, "S");

    // Chip internal circuit lines
    pdf.line(chipX, chipY + chipH / 2, chipX + chipW, chipY + chipH / 2);
    pdf.line(chipX + chipW / 3, chipY, chipX + chipW / 3, chipY + chipH);
    pdf.line(chipX + (chipW * 2) / 3, chipY, chipX + (chipW * 2) / 3, chipY + chipH);

    // NFC wave mark on right
    if (showNfcLogo) {
      pdf.setDrawColor(t.pdfAccent[0], t.pdfAccent[1], t.pdfAccent[2]);
      pdf.setLineWidth(0.4);
      const arcCenterX = x + w - 10;
      const arcCenterY = y + 11;
      for (let r = 1.8; r <= 4.2; r += 1.2) {
        pdf.ellipse(arcCenterX, arcCenterY, r, r, "S");
      }
      pdf.setLineWidth(0.2); // reset
    }

    // Name & Title
    pdf.setTextColor(t.pdfText[0], t.pdfText[1], t.pdfText[2]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(name, x + 7, y + 24, { maxWidth: w - 14 });

    pdf.setTextColor(t.pdfAccent[0], t.pdfAccent[1], t.pdfAccent[2]);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(title, x + 7, y + 29, { maxWidth: w - 14 });

    // Contact details row at bottom
    pdf.setFontSize(6.5);
    pdf.setTextColor(t.pdfSubtext[0], t.pdfSubtext[1], t.pdfSubtext[2]);

    let contactY = y + 36;
    if (showPhone && phone && phone.trim()) {
      pdf.text(`Ph: ${phone.trim()}`, x + 7, contactY);
      contactY += 4;
    }
    if (showEmail && email && email.trim()) {
      pdf.text(`Em: ${email.trim()}`, x + 7, contactY, { maxWidth: w - 14 });
      contactY += 4;
    }
    if (showWebsite && website && website.trim()) {
      pdf.text(`Web: ${website.trim()}`, x + 7, contactY, { maxWidth: w - 14 });
    }

    // Brand mark bottom right
    pdf.setFontSize(6);
    pdf.setTextColor(t.pdfSubtext[0], t.pdfSubtext[1], t.pdfSubtext[2]);
    pdf.text("MyTapCard", x + w - 7, y + h - 5, { align: "right" });
  }

  // 4. Render PDF Back
  async function renderPdfBack(
    pdf: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    t: CardTheme,
    qrUrl: string
  ) {
    // Background fill
    pdf.setFillColor(t.pdfBackBg[0], t.pdfBackBg[1], t.pdfBackBg[2]);
    pdf.roundedRect(x, y, w, h, CARD_RADIUS, CARD_RADIUS, "F");

    if (t.pdfCardBorder) {
      pdf.setDrawColor(t.pdfCardBorder[0], t.pdfCardBorder[1], t.pdfCardBorder[2]);
      pdf.roundedRect(x, y, w, h, CARD_RADIUS, CARD_RADIUS, "S");
    }

    // Center QR code box
    const qrBoxSize = 25;
    const qrX = x + (w - qrBoxSize) / 2;
    const qrY = y + 10;

    // White backing plate for optimal scanner contrast
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(qrX - 1.5, qrY - 1.5, qrBoxSize + 3, qrBoxSize + 3, 2, 2, "F");

    if (qrUrl) {
      pdf.addImage(qrUrl, "PNG", qrX, qrY, qrBoxSize, qrBoxSize);
    }

    // Top Header: SCAN OR TAP
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(t.pdfAccent[0], t.pdfAccent[1], t.pdfAccent[2]);
    pdf.text("SCAN OR TAP TO CONNECT", x + w / 2, y + 7, { align: "center" });

    // Bottom URL & instruction
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(t.pdfBackText[0], t.pdfBackText[1], t.pdfBackText[2]);
    pdf.text(`mytapcard.online/@${username}`, x + w / 2, y + 41, {
      align: "center",
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(t.pdfSubtext[0], t.pdfSubtext[1], t.pdfSubtext[2]);
    pdf.text("Compatible with iPhone & Android NFC", x + w / 2, y + 46, {
      align: "center",
    });
  }

  // 5. Download 300 DPI High-Res PNG (Front or Back)
  async function downloadCardPng(side: "front" | "back") {
    setIsExporting(true);
    try {
      const scale = 4; // High DPI (around 300 DPI)
      const width = 1011; // ~85.6mm at 300dpi
      const height = 638; // ~53.98mm at 300dpi

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw background
      ctx.fillStyle = side === "front" ? rgbToHex(theme.pdfBg) : rgbToHex(theme.pdfBackBg);
      roundRect(ctx, 0, 0, width, height, 38);
      ctx.fill();

      if (side === "front") {
        // Draw chip
        ctx.fillStyle = rgbToHex(theme.pdfChipBg);
        ctx.strokeStyle = rgbToHex(theme.pdfChipBorder);
        ctx.lineWidth = 4;
        roundRect(ctx, 80, 80, 140, 100, 16);
        ctx.fill();
        ctx.stroke();

        // Chip circuit
        ctx.beginPath();
        ctx.moveTo(80, 130);
        ctx.lineTo(220, 130);
        ctx.moveTo(125, 80);
        ctx.lineTo(125, 180);
        ctx.moveTo(175, 80);
        ctx.lineTo(175, 180);
        ctx.stroke();

        // NFC icon
        if (showNfcLogo) {
          ctx.strokeStyle = rgbToHex(theme.pdfAccent);
          ctx.lineWidth = 6;
          for (let r = 24; r <= 60; r += 18) {
            ctx.beginPath();
            ctx.arc(width - 120, 130, r, -0.6, 0.6);
            ctx.stroke();
          }
        }

        // Text
        ctx.fillStyle = rgbToHex(theme.pdfText);
        ctx.font = "bold 56px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(name, 80, 290);

        ctx.fillStyle = rgbToHex(theme.pdfAccent);
        ctx.font = "600 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(title, 80, 345);

        // Contacts
        ctx.fillStyle = rgbToHex(theme.pdfSubtext);
        ctx.font = "400 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        let cY = 430;
        if (showPhone && phone && phone.trim()) {
          ctx.fillText(`Ph: ${phone.trim()}`, 80, cY);
          cY += 45;
        }
        if (showEmail && email && email.trim()) {
          ctx.fillText(`Em: ${email.trim()}`, 80, cY);
          cY += 45;
        }
        if (showWebsite && website && website.trim()) {
          ctx.fillText(`Web: ${website.trim()}`, 80, cY);
        }

        ctx.font = "600 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText("MyTapCard", width - 210, height - 70);
      } else {
        // Back
        ctx.fillStyle = rgbToHex(theme.pdfAccent);
        ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SCAN OR TAP TO CONNECT", width / 2, 85);

        // QR backing plate
        const qrSize = 320;
        const qX = (width - qrSize) / 2;
        const qY = 120;
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, qX - 20, qY - 20, qrSize + 40, qrSize + 40, 24);
        ctx.fill();

        // Draw QR
        if (qrDataUrl) {
          const img = new Image();
          img.src = qrDataUrl;
          await new Promise((res) => (img.onload = res));
          ctx.drawImage(img, qX, qY, qrSize, qrSize);
        }

        ctx.fillStyle = rgbToHex(theme.pdfBackText);
        ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(`mytapcard.online/@${username}`, width / 2, 510);

        ctx.fillStyle = rgbToHex(theme.pdfSubtext);
        ctx.font = "400 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText("Compatible with iPhone & Android NFC", width / 2, 555);
      }

      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), "image/png")
      );
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mytapcard-${username}-${side}-300dpi.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`High-Res ${side.toUpperCase()} PNG downloaded!`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Error generating PNG.");
    } finally {
      setIsExporting(false);
    }
  }

  function rgbToHex([r, g, b]: [number, number, number]) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-elegant sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <CreditCard className="h-5 w-5 text-primary" />
            Smart Business Card
          </h2>
          <p className="text-xs text-muted-foreground">
            CR80 standard (85.6 × 54 mm) · Double-sided print &amp; NFC
          </p>
        </div>

        {/* Flip button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFlipped(!isFlipped)}
          className="gap-1.5 text-xs font-medium shadow-soft"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Flip {isFlipped ? "Front" : "Back"}
        </Button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* LEFT / CENTER: Interactive 3D Card Preview */}
        <div className="flex flex-col items-center justify-center lg:col-span-7">
          <div
            className="perspective-[1000px] cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            title="Click card to flip"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative aspect-[1.586/1] w-[340px] max-w-full select-none rounded-[1.25rem] shadow-2xl transition-all sm:w-[420px]"
            >
              {/* === FRONT SIDE === */}
              <div
                style={{
                  background: theme.frontBg,
                  color: theme.frontText,
                  backfaceVisibility: "hidden",
                }}
                className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[1.25rem] border p-6 shadow-2xl ${theme.previewBorder}`}
              >
                {/* Top Row: Chip & NFC Wave */}
                <div className="flex items-start justify-between">
                  {/* Smart Card Chip */}
                  <div
                    style={{
                      background: theme.chipBg,
                      borderColor: theme.chipBorder,
                    }}
                    className="relative flex h-8 w-11 items-center justify-center rounded-md border shadow-soft"
                  >
                    <div
                      style={{ borderColor: theme.chipLines }}
                      className="absolute inset-x-0 h-[1px] border-b"
                    />
                    <div
                      style={{ borderColor: theme.chipLines }}
                      className="absolute inset-y-0 w-[1px] border-r"
                    />
                  </div>

                  {/* Contactless Wave */}
                  {showNfcLogo && (
                    <div
                      style={{ color: theme.accent }}
                      className="flex items-center gap-1.5 opacity-90"
                    >
                      <Wifi className="h-5 w-5 rotate-90" />
                    </div>
                  )}
                </div>

                {/* Middle: User Identity */}
                <div className="my-auto space-y-1">
                  <h3
                    style={{ color: theme.frontText }}
                    className="truncate text-xl font-bold tracking-tight sm:text-2xl"
                  >
                    {name}
                  </h3>
                  <p
                    style={{ color: theme.accent }}
                    className="truncate text-xs font-semibold sm:text-sm"
                  >
                    {title}
                  </p>
                </div>

                {/* Bottom Row: Contacts & Watermark */}
                <div className="flex items-end justify-between border-t border-white/10 pt-3 text-[0.65rem] sm:text-xs">
                  <div
                    style={{ color: theme.frontSubtext }}
                    className="space-y-0.5 leading-tight"
                  >
                    {showPhone && phone && phone.trim() ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate">{phone.trim()}</span>
                      </div>
                    ) : null}
                    {showEmail && email && email.trim() ? (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[190px]">{email.trim()}</span>
                      </div>
                    ) : null}
                    {showWebsite && website && website.trim() ? (
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[190px]">{website.trim()}</span>
                      </div>
                    ) : null}
                  </div>

                  <span
                    style={{ color: theme.frontSubtext }}
                    className="font-bold tracking-wider opacity-75"
                  >
                    MyTapCard
                  </span>
                </div>
              </div>

              {/* === BACK SIDE === */}
              <div
                style={{
                  background: theme.backBg,
                  color: theme.backText,
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
                className={`absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-[1.25rem] border p-6 text-center shadow-2xl ${theme.previewBorder}`}
              >
                {/* Header Instruction */}
                <div
                  style={{ color: theme.accent }}
                  className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider sm:text-xs"
                >
                  <Wifi className="h-3.5 w-3.5 rotate-90" />
                  SCAN OR TAP TO CONNECT
                </div>

                {/* QR Code */}
                <div className="rounded-xl border border-white/20 bg-white p-2 shadow-xl">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Business card QR"
                      className="h-24 w-24 rounded-lg object-contain sm:h-28 sm:w-28"
                    />
                  ) : (
                    <div className="h-24 w-24 animate-pulse bg-slate-200" />
                  )}
                </div>

                {/* Footer URL */}
                <div className="space-y-0.5">
                  <p
                    style={{ color: theme.backText }}
                    className="text-xs font-bold tracking-tight sm:text-sm"
                  >
                    mytapcard.online/@{username}
                  </p>
                  <p
                    style={{ color: theme.frontSubtext }}
                    className="text-[0.65rem] opacity-80"
                  >
                    iPhone &amp; Android NFC Compatible
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <strong className="text-foreground">{isFlipped ? "Back Side" : "Front Side"}</strong>
            <span className="opacity-60">· Click card to flip</span>
          </p>
        </div>

        {/* RIGHT: Customization & Export Controls */}
        <div className="space-y-4 lg:col-span-5">
          {/* Themes: 10 sleek color swatch pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-primary" /> Card Theme
              </span>
              <span className="text-xs font-medium text-foreground">
                {CARD_THEMES[themeId].name}
              </span>
            </div>

            {/* 10 Clean Swatches Grid */}
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-5">
              {(Object.keys(CARD_THEMES) as CardThemeId[]).map((tid) => {
                const t = CARD_THEMES[tid];
                const active = themeId === tid;
                const short = t.name.split(" ")[0];
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => setThemeId(tid)}
                    title={t.name}
                    className={`group relative flex flex-col items-center gap-1 rounded-xl p-1.5 transition-all ${
                      active
                        ? "bg-primary/10 ring-2 ring-primary shadow-soft"
                        : "border border-border/60 hover:bg-secondary/40"
                    }`}
                  >
                    {/* Swatch circle */}
                    <div
                      style={{ background: t.frontBg }}
                      className={`relative flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition-transform group-hover:scale-105 ${
                        t.category === "light" ? "border-slate-300" : "border-white/20"
                      }`}
                    >
                      <div
                        style={{ background: t.accent }}
                        className="h-2 w-2 rounded-full shadow"
                      />
                      {active && (
                        <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                          <Check className="h-2 w-2 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="truncate text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                      {short}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Details Editor: Clean full-width inputs */}
          <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-primary" /> Card Details
              </span>
              <span className="text-[10px] font-normal lowercase">live preview</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">Title / Role</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3 text-primary" /> Phone Number
                  </label>
                  {phone.trim() && userId && (
                    <button
                      type="button"
                      onClick={savePhoneToAccount}
                      disabled={savingPhone || phone === initialPhone}
                      className="text-[10px] font-semibold text-primary hover:underline disabled:opacity-50"
                    >
                      {savingPhone ? "Saving…" : phone === initialPhone ? "✓ Synced" : "Save"}
                    </button>
                  )}
                </div>
                <input
                  type="tel"
                  placeholder="+880 1712-345678"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPhone(val);
                    if (val.trim() && !showPhone) setShowPhone(true);
                    if (!val.trim()) setShowPhone(false);
                  }}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Display Toggle Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
              <button
                type="button"
                disabled={!phone.trim()}
                onClick={() => setShowPhone(!showPhone)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                  !phone.trim()
                    ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground"
                    : showPhone
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-background text-muted-foreground border border-border"
                }`}
              >
                <Phone className="h-3 w-3" />
                Phone {showPhone && phone.trim() ? "On" : "Off"}
              </button>

              <button
                type="button"
                disabled={!email.trim()}
                onClick={() => setShowEmail(!showEmail)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                  showEmail && email.trim()
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-background text-muted-foreground border border-border"
                }`}
              >
                <Mail className="h-3 w-3" />
                Email {showEmail && email.trim() ? "On" : "Off"}
              </button>

              <button
                type="button"
                disabled={!website.trim()}
                onClick={() => setShowWebsite(!showWebsite)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                  showWebsite && website.trim()
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-background text-muted-foreground border border-border"
                }`}
              >
                <Globe className="h-3 w-3" />
                Web {showWebsite && website.trim() ? "On" : "Off"}
              </button>

              <button
                type="button"
                onClick={() => setShowNfcLogo(!showNfcLogo)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                  showNfcLogo
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-background text-muted-foreground border border-border"
                }`}
              >
                <Wifi className="h-3 w-3 rotate-90" />
                NFC {showNfcLogo ? "On" : "Off"}
              </button>
            </div>
          </div>

          {/* Export Action Buttons: Clean, concise, no overlap */}
          <div className="space-y-2 pt-1">
            <Button
              variant="hero"
              size="lg"
              onClick={downloadSingleCardPdf}
              disabled={isExporting}
              className="w-full gap-2 text-sm font-semibold shadow-elegant"
            >
              <Download className="h-4 w-4" />
              Download PDF Card
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadA4SheetPdf}
                disabled={isExporting}
                className="gap-1.5 text-xs truncate"
              >
                <Printer className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Print Sheet (10x)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCardPng(isFlipped ? "back" : "front")}
                disabled={isExporting}
                className="gap-1.5 text-xs truncate"
              >
                <FileCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Save PNG (300 DPI)</span>
              </Button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground">
              Vector resolution · Standard 85.6 × 54 mm
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
