import { redirect } from "next/navigation";
import { getAuthedEmail } from "@/lib/auth-server";
import CheckoutClient from "./ui/CheckoutClient";

export default async function CheckoutPage() {
  const email = await getAuthedEmail();
  if (!email) redirect("/login?next=/checkout");

  return <CheckoutClient />;
}
