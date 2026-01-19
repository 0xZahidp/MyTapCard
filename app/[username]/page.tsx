import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import Link from "@/models/Link";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ username: string }>;
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ===============================
   LINK DISPLAY FORMATTER (KEY FIX)
================================= */
function formatLinkValue(type: string, value: string) {
  if (!value) return "";

  // Phone & Email → show as-is
  if (type === "phone" || type === "email") {
    return value;
  }

  // URL handling
  try {
    const url = new URL(value);
    const host = url.hostname.replace("www.", "");
    const path = url.pathname.replace(/^\/+/, "");

    // Platform-specific cleanup
    if (host.includes("facebook.com")) {
      return "facebook.com";
    }

    if (host.includes("t.me")) {
      return path ? `@${path}` : "Telegram";
    }

    if (host.includes("instagram.com")) {
      return path ? `@${path}` : "Instagram";
    }

    if (host.includes("linkedin.com")) {
      return "linkedin.com";
    }

    // Default: show domain only
    return host;
  } catch {
    return value;
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const usernameParam = (username || "").trim();

  if (!usernameParam) notFound();

  await dbConnect();

  const profile = await Profile.findOne({
    username: { $regex: `^${escapeRegex(usernameParam)}$`, $options: "i" },
    isActive: true,
  }).lean();

  if (!profile) notFound();

  const user = await User.findById(profile.userId).select("avatar").lean();
  const avatarUrl = user?.avatar || "";

  const links = await Link.find({
    profileId: profile._id,
    isActive: true,
  })
    .sort({ order: 1 })
    .lean();

  const subscription = await Subscription.findOne({
    userId: profile.userId,
  }).lean();

  const isPro = subscription?.plan === "pro";

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
                  alt={`${profile.displayName} avatar`}
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
                {profile.displayName}
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

          {/* Links */}
          <div className="px-6 py-6">
            {links.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No links yet
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  This profile doesn’t have any active links.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {links.map((link: any) => {
                  let href = link.value;
                  let icon = "🔗";

                  if (link.type === "phone") {
                    href = `tel:${link.value}`;
                    icon = "📞";
                  } else if (link.type === "email") {
                    href = `mailto:${link.value}`;
                    icon = "📧";
                  } else if (link.type === "url") {
                    icon = "🌐";
                  }

                  const displayValue = formatLinkValue(
                    link.type,
                    link.value
                  );

                  return (
                    <a
                      key={String(link._id)}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 transition hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99]"
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
                            {displayValue}
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
            )}
          </div>

          {!isPro && (
            <div className="px-6 pb-6">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-center">
                <p className="text-xs text-gray-500">
                  Powered by{" "}
                  <span className="font-semibold text-gray-700">
                    MyTapCard
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          © {new Date().getFullYear()} MyTapCard
        </p>
      </div>
    </main>
  );
}
