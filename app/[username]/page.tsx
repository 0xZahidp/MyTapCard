import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import Link from "@/models/Link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ username: string }>;
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  const links = await Link.find({
    profileId: profile._id,
    isActive: true,
  })
    .sort({ order: 1 })
    .lean();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="pt-8 pb-6 px-6 text-center">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center text-gray-500">
            <span className="text-sm">Photo</span>
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.displayName}
          </h1>

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-600 mt-2 text-sm">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="px-6 pb-8 space-y-3">
          {links.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">
              No links added yet.
            </p>
          ) : (
            links.map((link: any) => {
              let href = link.value;
              let icon = "🔗";

              if (link.type === "phone") {
                href = `tel:${link.value}`;
                icon = "📞";
              }

              if (link.type === "email") {
                href = `mailto:${link.value}`;
                icon = "📧";
              }

              if (link.type === "url") {
                icon = "🌐";
              }

              return (
                <a
                  key={String(link._id)}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <span className="font-medium text-gray-800">
                      {link.label}
                    </span>
                  </div>

                  <span className="text-gray-400 text-sm">›</span>
                </a>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pb-4">
          Powered by <span className="font-medium">MyTapCard</span>
        </div>
      </div>
    </main>
  );
}
