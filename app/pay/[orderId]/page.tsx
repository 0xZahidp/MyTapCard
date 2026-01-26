import { redirect } from "next/navigation";
import { getAuthedEmail } from "@/lib/auth-server";
import { ui } from "@/components/dashboard/ui";

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ provider?: string }>;
}) {
  const email = await getAuthedEmail();
  if (!email) redirect("/login?next=/orders");

  const { orderId } = await params;
  const { provider } = await searchParams;

  const box =
    "mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800";

  return (
    <main className={ui.pageBg}>
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <div className={`${ui.card} p-6`}>
          <h1 className="text-xl font-semibold text-gray-900">Payment</h1>

          <p className="mt-2 text-sm text-gray-600">
            Provider: <span className="font-semibold">{provider || "uddokta"}</span>
          </p>

          <div className={box}>
            Order ID: <span className="font-semibold">{orderId}</span>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Payment gateway integration is next. This page proves the redirect flow works.
          </p>

          <a href={`/orders/${orderId}`} className={`${ui.primaryBtn} mt-6`}>
            Back to tracking
          </a>
        </div>
      </div>
    </main>
  );
}
