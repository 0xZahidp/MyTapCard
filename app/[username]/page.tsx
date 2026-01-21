import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import Link from "@/models/Link";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import LinkGroup from "@/models/LinkGroup";
import FinancialItem from "@/models/Financial";
import { notFound } from "next/navigation";
import PublicProfileClient from "./PublicProfileClient";

interface Props {
  params: Promise<{ username: string }>;
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ✅ Converts ObjectId/Date into plain JSON-safe values
function toPlain<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
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

  const subscription = await Subscription.findOne({ userId: profile.userId }).lean();
  const isPro = subscription?.plan === "pro";

  const groups = await LinkGroup.find({ profileId: profile._id }).sort({ order: 1 }).lean();
  const links = await Link.find({ profileId: profile._id }).sort({ groupId: 1, order: 1 }).lean();
  const financialItems = await FinancialItem.find({ profileId: profile._id }).sort({ order: 1 }).lean();

  return (
    <PublicProfileClient
      profile={toPlain(profile)}
      avatarUrl={avatarUrl}
      isPro={isPro}
      groups={toPlain(groups)}
      links={toPlain(links)}
      showFinancialTab={(profile as any).showFinancialTab ?? true}
      financialItems={toPlain(financialItems)}
    />
  );
}
