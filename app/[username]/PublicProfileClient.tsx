"use client";

import { useMemo, useState } from "react";

type AnyObj = Record<string, any>;

type ProfileLike = {
  _id: any;
  userId: any;
  username?: string;
  displayName?: string;
  bio?: string;
};

type LinkGroupLike = {
  _id: any;
  name: string;
  order: number;
  isActive: boolean;
};

type LinkLike = {
  _id: any;
  type: string; // url/phone/email/sms/social/messaging/video/vcard...
  label: string;
  value: string;
  order: number;
  isActive: boolean;
  groupId?: any | null;
  platform?: string;
  meta?: AnyObj;
};

type FinancialItemLike = {
  _id: any;
  type: "mfs" | "bank";
  provider?: string;
  fields?: AnyObj;
  order: number;
  isActive: boolean;
};

const OTHER_GROUP_ID = "__other__";

function str(v: any) {
  return v == null ? "" : String(v);
}

function isHttpUrl(v: string) {
  return /^https?:\/\//i.test(v || "");
}

function cleanHandle(input: string) {
  let s = (input || "").trim();
  s = s.replace(/^@+/, "");
  // if user pasted full URL, attempt to extract last path segment
  if (isHttpUrl(s)) {
    try {
      const u = new URL(s);
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || "";
    } catch {
      return s;
    }
  }
  return s;
}

function truncateHandle(h: string, n = 10) {
  if (!h) return "";
  return h.length > n ? `${h.slice(0, n)}…` : h;
}

function domainOnly(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function normalizePhoneDigits(input: string) {
  // keep digits only
  const digits = (input || "").replace(/\D/g, "");
  // remove leading zeros commonly used as international prefix
  return digits.replace(/^00/, "");
}

function platformIcon(platform: string, type: string) {
  const p = (platform || "").toLowerCase();
  const t = (type || "").toLowerCase();

  if (t === "email") return "📧";
  if (t === "phone") return "📞";
  if (t === "sms") return "💬";
  if (t === "url") return "🌐";

  // platforms
  if (p === "whatsapp") return "🟢";
  if (p === "telegram") return "✈️";
  if (p === "signal") return "🔵";
  if (p === "facebook") return "📘";
  if (p === "instagram") return "📸";
  if (p === "linkedin") return "💼";
  if (p === "x" || p === "twitter") return "𝕏";
  if (p === "youtube") return "▶️";
  if (p === "tiktok") return "🎵";
  if (p === "github") return "🐙";

  // fallback
  if (t === "social") return "👤";
  if (t === "messaging") return "💬";
  if (t === "video") return "🎬";
  if (t === "vcard") return "💾";

  return "🔗";
}

function buildHref(link: LinkLike) {
  const type = (link.type || "").toLowerCase();
  const platform = (link.platform || "").toLowerCase();
  const raw = str(link.value).trim();

  if (!raw) return "#";

  // Basic types
  if (type === "phone") return `tel:${raw}`;
  if (type === "email") return `mailto:${raw}`;
  if (type === "sms") return `sms:${raw}`;
  if (type === "url") return raw;

  // If value is already a URL, just open it
  if (isHttpUrl(raw)) return raw;

  // Platform-based building for username/phone inputs
  const handle = cleanHandle(raw);

  if (platform === "telegram") {
    // username
    return `https://t.me/${handle}`;
  }

  if (platform === "whatsapp") {
    // phone or handle; WhatsApp works best with digits
    const digits = normalizePhoneDigits(raw);
    if (digits) return `https://wa.me/${digits}`;
    return raw;
  }

  if (platform === "signal") {
    // if phone number exists, try signal.me deep link
    // expects +<digits> or digits; we'll format as +digits
    const digits = normalizePhoneDigits(raw);
    if (digits) return `https://signal.me/#p/+${digits}`;
    return raw;
  }

  if (platform === "facebook") return `https://facebook.com/${handle}`;
  if (platform === "instagram") return `https://instagram.com/${handle}`;
  if (platform === "linkedin") return `https://linkedin.com/in/${handle}`;
  if (platform === "x" || platform === "twitter") return `https://x.com/${handle}`;
  if (platform === "youtube") return `https://youtube.com/@${handle}`;
  if (platform === "tiktok") return `https://tiktok.com/@${handle}`;
  if (platform === "github") return `https://github.com/${handle}`;

  // Unknown platform: treat as a handle-ish thing, but no safe default
  // return raw so it still shows/copies
  return raw;
}

function displaySecondary(link: LinkLike) {
  const type = (link.type || "").toLowerCase();
  const platform = (link.platform || "").toLowerCase();
  const raw = str(link.value).trim();

  if (!raw) return "";

  if (type === "phone" || type === "email" || type === "sms") return raw;

  // If URL, show domain / special platform handle
  if (isHttpUrl(raw) || type === "url") {
    // if platform exists and url has a path, show @handle when possible
    if (platform && isHttpUrl(raw)) {
      const h = cleanHandle(raw);
      if (h) return `@${truncateHandle(h, 10)}`;
    }
    return domainOnly(raw);
  }

  // For social/messaging where user enters username
  if (type === "social" || type === "messaging") {
    const h = cleanHandle(raw);
    return h ? `@${truncateHandle(h, 10)}` : raw;
  }

  // fallback
  return raw.length > 24 ? `${raw.slice(0, 24)}…` : raw;
}

async function copyText(text: string) {
  const t = str(text);
  if (!t) return false;

  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function prettyProvider(p?: string) {
  const s = (p || "").trim().toLowerCase();
  if (!s) return "Financial";
  if (s === "bkash") return "bKash";
  if (s === "nagad") return "Nagad";
  if (s === "rocket") return "Rocket";
  if (s === "upay") return "Upay";
  return p!;
}

function orderedFinancialFields(item: FinancialItemLike) {
  const fields = (item.fields || {}) as AnyObj;

  if (item.type === "mfs") {
    const keys = ["accountName", "number", "personalOrAgent", "phone"];
    const out: Array<{ key: string; label: string; value: string }> = [];
    for (const k of keys) {
      if (fields[k]) {
        out.push({
          key: k,
          label:
            k === "accountName"
              ? "Name"
              : k === "number"
              ? "Number"
              : k === "personalOrAgent"
              ? "Type"
              : "Phone",
          value: str(fields[k]),
        });
      }
    }
    // include any extra keys
    for (const k of Object.keys(fields)) {
      if (keys.includes(k)) continue;
      out.push({ key: k, label: k, value: str(fields[k]) });
    }
    return out;
  }

  // bank
  const keys = [
    "bankName",
    "holderName",
    "accountNo",
    "branch",
    "routingNo",
    "swift",
    "phone",
  ];

  const labelMap: AnyObj = {
    bankName: "Bank",
    holderName: "Holder",
    accountNo: "A/C No",
    branch: "Branch",
    routingNo: "Routing",
    swift: "SWIFT",
    phone: "Phone",
  };

  const out: Array<{ key: string; label: string; value: string }> = [];
  for (const k of keys) {
    if (fields[k]) out.push({ key: k, label: labelMap[k], value: str(fields[k]) });
  }
  for (const k of Object.keys(fields)) {
    if (keys.includes(k)) continue;
    out.push({ key: k, label: k, value: str(fields[k]) });
  }
  return out;
}

export default function PublicProfileClient(props: {
  profile: ProfileLike;
  avatarUrl: string;
  isPro: boolean;
  groups: LinkGroupLike[];
  links: LinkLike[];
  showFinancialTab: boolean;
  financialItems: FinancialItemLike[];
}) {
  const { profile, avatarUrl, isPro } = props;

  const [tab, setTab] = useState<"links" | "financial">("links");
  const [toast, setToast] = useState<string | null>(null);

  const activeGroups = useMemo(() => {
    // Only active groups should be eligible to show publicly
    return (props.groups || [])
      .filter((g) => g && g.isActive)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [props.groups]);

  const activeLinks = useMemo(() => {
    return (props.links || [])
      .filter((l) => l && l.isActive)
      .sort((a, b) => {
        const ga = str(a.groupId || "");
        const gb = str(b.groupId || "");
        if (ga < gb) return -1;
        if (ga > gb) return 1;
        return (a.order ?? 0) - (b.order ?? 0);
      });
  }, [props.links]);

  const groupedForPublic = useMemo(() => {
    // build in group order, hide empty groups, include Other if has items
    const byGroup = new Map<string, LinkLike[]>();
    const other: LinkLike[] = [];

    for (const l of activeLinks) {
      const gid = l.groupId ? str(l.groupId) : "";
      if (!gid) {
        other.push(l);
        continue;
      }
      if (!byGroup.has(gid)) byGroup.set(gid, []);
      byGroup.get(gid)!.push(l);
    }

    const sections: Array<{ id: string; name: string; links: LinkLike[] }> = [];

    for (const g of activeGroups) {
      const list = byGroup.get(str(g._id)) || [];
      if (list.length === 0) continue; // hide empty group
      sections.push({ id: str(g._id), name: g.name, links: list });
    }

    if (other.length > 0) {
      sections.push({ id: OTHER_GROUP_ID, name: "Other", links: other });
    }

    return sections;
  }, [activeGroups, activeLinks]);

  const activeFinancialItems = useMemo(() => {
    return (props.financialItems || [])
      .filter((it) => it && it.isActive)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [props.financialItems]);

  const canShowFinancial =
    props.showFinancialTab && activeFinancialItems.length > 0;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1400);
  };

  const onCopy = async (value: string) => {
    const ok = await copyText(value);
    showToast(ok ? "Copied ✅" : "Copy failed");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          {/* Header */}
          <div className="px-6 pt-8 pb-6 text-center">
            <div className="mx-auto mb-4 h-24 w-24">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${profile.displayName || "Profile"} avatar`}
                  className="h-24 w-24 rounded-full object-cover border border-gray-200 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
                  <span className="text-sm font-medium">No Photo</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                {profile.displayName || "Unnamed"}
              </h1>

              {isPro && (
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                  PRO
                </span>
              )}
            </div>

            {profile.username && (
              <p className="mt-1 text-sm text-gray-500">@{profile.username}</p>
            )}

            {profile.bio && (
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="h-px w-full bg-gray-100" />

          {/* Tabs */}
          <div className="px-6 pt-5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab("links")}
                className={[
                  "flex-1 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                  tab === "links"
                    ? "border-gray-900 text-gray-900 bg-white"
                    : "border-gray-200 text-gray-600 bg-gray-50 hover:bg-white",
                ].join(" ")}
              >
                Links
              </button>

              <button
                type="button"
                onClick={() => setTab("financial")}
                disabled={!canShowFinancial}
                className={[
                  "flex-1 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                  tab === "financial"
                    ? "border-gray-900 text-gray-900 bg-white"
                    : "border-gray-200 text-gray-600 bg-gray-50 hover:bg-white",
                  !canShowFinancial && "opacity-50 cursor-not-allowed hover:bg-gray-50",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                Financial
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {tab === "links" ? (
              groupedForPublic.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-gray-700">No links yet</p>
                  <p className="mt-1 text-xs text-gray-500">
                    This profile doesn’t have any active links.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedForPublic.map((section) => (
                    <div key={section.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                          {section.name}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {section.links.map((link) => {
                          const href = buildHref(link);
                          const icon = platformIcon(link.platform || "", link.type);
                          const secondary = displaySecondary(link);

                          const isClickable = href && href !== "#";

                          return (
                            <a
                              key={str(link._id)}
                              href={isClickable ? href : undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 transition hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99]"
                              onClick={(e) => {
                                if (!isClickable) {
                                  e.preventDefault();
                                  // If unknown/invalid href, copy instead
                                  onCopy(link.value);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-gray-50 text-lg">
                                  {icon}
                                </span>

                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-gray-900">
                                    {link.label}
                                  </div>
                                  <div className="truncate text-xs text-gray-500">
                                    {secondary}
                                  </div>
                                </div>
                              </div>

                              <span className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition group-hover:text-gray-600">
                                <svg
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="h-4 w-4"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M7.21 14.77a.75.75 0 010-1.06L10.94 10 7.21 6.29a.75.75 0 111.06-1.06l4.24 4.24a.75.75 0 010 1.06l-4.24 4.24a.75.75 0 01-1.06 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : !canShowFinancial ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                <p className="text-sm font-medium text-gray-700">No financial info</p>
                <p className="mt-1 text-xs text-gray-500">
                  This profile doesn’t have any active financial details.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeFinancialItems.map((item) => {
                  const title =
                    item.type === "mfs"
                      ? prettyProvider(item.provider)
                      : "Bank Account";

                  const rows = orderedFinancialFields(item);

                  return (
                    <div
                      key={str(item._id)}
                      className="rounded-2xl border border-gray-200 bg-white p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900">
                          {title}
                        </div>

                        <button
                          type="button"
                          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white"
                          onClick={() => {
                            // Copy "all" in a nice format
                            const all = rows
                              .map((r) => `${r.label}: ${r.value}`)
                              .join("\n");
                            onCopy(all);
                          }}
                        >
                          Copy all
                        </button>
                      </div>

                      <div className="space-y-2">
                        {rows.map((r) => (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => onCopy(r.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left transition hover:bg-white"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold text-gray-500">
                                  {r.label}
                                </div>
                                <div className="truncate text-sm font-semibold text-gray-900">
                                  {r.value}
                                </div>
                              </div>

                              <span className="shrink-0 text-xs font-semibold text-gray-500">
                                Copy
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      <p className="mt-3 text-[11px] text-gray-500">
                        Tap any field to copy.
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!isPro && (
            <div className="px-6 pb-6">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-center">
                <p className="text-xs text-gray-500">
                  Powered by{" "}
                  <span className="font-semibold text-gray-700">MyTapCard</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          © {new Date().getFullYear()} MyTapCard
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </main>
  );
}
