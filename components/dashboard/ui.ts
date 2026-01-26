// components/dashboard/ui.ts

export const ui = {
  pageBg: "min-h-screen w-full bg-gradient-to-b from-white via-gray-50 to-gray-100",
  container: "mx-auto w-full max-w-5xl px-4 py-8",

  card: "rounded-3xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
  cardPad: "p-6",

  sectionTitle: "text-base font-semibold tracking-tight text-gray-900",
  sectionDesc: "mt-1 text-sm leading-6 text-gray-600",
  label: "text-xs font-semibold text-gray-700",

  row: "flex items-center justify-between gap-3",
  col: "flex flex-col gap-2",
  divider: "h-px w-full bg-gray-100",
  helpText: "text-xs text-gray-500",

  // ✅ FIX: caret + disabled styling (prevents “invisible typing” issues)
  input:
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 caret-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed",
  select:
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 caret-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed",

  primaryBtn:
    "inline-flex w-full items-center justify-center rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60",
  softBtn:
    "inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60",

  miniBtn:
    "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition",
  dangerMiniBtn:
    "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition",
} as const;
