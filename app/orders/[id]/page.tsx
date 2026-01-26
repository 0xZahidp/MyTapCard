import { redirect } from "next/navigation";
import { getAuthedEmail } from "@/lib/auth-server";
import OrderTrackingClient from "./ui/OrderTrackingClient";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const email = await getAuthedEmail();
  if (!email) redirect("/login?next=/orders");

  const { id } = await params;
  return <OrderTrackingClient id={id} />;
}
