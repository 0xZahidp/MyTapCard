import Link from "next/link";

function FeatureCard({
  title,
  desc,
  tag,
}: {
  title: string;
  desc: string;
  tag: string;
}) {
  return (
    <div className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
      {/* “Image” */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="h-36 w-full" />
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-gray-200 blur-2xl" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-gray-300 blur-2xl" />
        </div>

        <div className="absolute left-3 top-3 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700">
          {tag}
        </div>
      </div>

      <h3 className="mt-4 text-base font-semibold tracking-tight text-gray-900">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-gray-600">{desc}</p>
    </div>
  );
}

function Step({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800">
        {n}
      </div>
      <h4 className="mt-3 text-sm font-semibold text-gray-900">{title}</h4>
      <p className="mt-1 text-sm leading-6 text-gray-600">{desc}</p>
    </div>
  );
}

function PricingCard({
  title,
  price,
  subtitle,
  bullets,
  primary,
}: {
  title: string;
  price: string;
  subtitle: string;
  bullets: string[];
  primary?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-3xl border bg-white p-6",
        primary
          ? "border-gray-900 shadow-[0_12px_40px_rgba(0,0,0,0.10)]"
          : "border-gray-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        </div>
        {primary && (
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
            Popular
          </span>
        )}
      </div>

      <div className="mt-4 text-3xl font-semibold tracking-tight text-gray-900">
        {price}
        <span className="text-sm font-medium text-gray-500"> /month</span>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-xs">
              ✓
            </span>
            <span className="leading-6">{b}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/register"
        className={[
          "mt-6 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99]",
          primary
            ? "bg-gray-900 text-white hover:opacity-95"
            : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
        ].join(" ")}
      >
        Get started
      </Link>
    </div>
  );
}

function FAQItem({
  q,
  a,
}: {
  q: string;
  a: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-900">{q}</p>
      <p className="mt-2 text-sm leading-6 text-gray-600">{a}</p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-14 pb-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-900" />
              Share your profile instantly
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              Your digital profile,
              <br className="hidden sm:block" /> one tap away.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
              MyTapCard lets you create a clean public profile page, add your
              important links, and share it with a QR or tap card — fast, modern,
              and mobile-first.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99]"
              >
                Create your card
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.99]"
              >
                Login
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
                No dark mode (yet)
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
                Mobile-first
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1">
                QR ready
              </span>
            </div>
          </div>

          {/* Hero “mock image” */}
          <div className="relative">
            <div className="rounded-3xl border border-gray-200 bg-white shadow-[0_14px_50px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="h-12 border-b border-gray-100 bg-gray-50 px-4 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                <div className="ml-3 text-xs font-semibold text-gray-600">
                  MyTapCard preview
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full border border-gray-200 bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 w-40 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-56 rounded bg-gray-100" />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl border border-gray-200 bg-gray-50" />
                        <div>
                          <div className="h-3 w-28 rounded bg-gray-200" />
                          <div className="mt-2 h-3 w-44 rounded bg-gray-100" />
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full border border-gray-200 bg-gray-50" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-52 rounded bg-gray-100" />
                </div>
              </div>
            </div>

            {/* subtle blobs */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-gray-200 blur-3xl opacity-50" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-gray-300 blur-3xl opacity-40" />
          </div>
        </div>
      </section>

      {/* Features (Image Cards) */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Everything you need
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Simple tools to build your public profile and share it anywhere.
            </p>
          </div>
          <Link
            href="/register"
            className="hidden sm:inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Start free
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            tag="Profile"
            title="Clean public page"
            desc="A modern profile page that looks great on mobile and desktop."
          />
          <FeatureCard
            tag="Links"
            title="Add & reorder links"
            desc="Website, phone, email—organize your important links in one place."
          />
          <FeatureCard
            tag="QR"
            title="Generate QR instantly"
            desc="Create and download your QR code anytime from your dashboard."
          />
          <FeatureCard
            tag="Avatar"
            title="Profile photo"
            desc="Upload a photo and keep your profile looking professional."
          />
          <FeatureCard
            tag="Pro"
            title="Upgrade when ready"
            desc="Unlock pro features (and remove branding) with an easy upgrade flow."
          />
          <FeatureCard
            tag="Share"
            title="Works everywhere"
            desc="Share by QR, link, or NFC tap card—fast and reliable."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            How it works
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your profile in minutes.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Step
              n="1"
              title="Create your profile"
              desc="Add your name, username, bio and avatar."
            />
            <Step
              n="2"
              title="Add your links"
              desc="Website, WhatsApp, email, phone—whatever matters."
            />
            <Step
              n="3"
              title="Share your QR"
              desc="Download your QR and share it anywhere."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Simple pricing
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Start free. Upgrade when you’re ready.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <PricingCard
            title="Free"
            price="৳0"
            subtitle="Perfect to get started"
            bullets={[
              "Public profile page",
              "Add links (URL, phone, email)",
              "QR generation",
              "Powered by MyTapCard badge",
            ]}
          />
          <PricingCard
            title="Pro"
            price="৳499"
            subtitle="For brands & professionals"
            primary
            bullets={[
              "Remove MyTapCard branding",
              "More customization (coming soon)",
              "Priority support (coming soon)",
              "Best for business use",
            ]}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-14">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
          FAQ
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Quick answers to common questions.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FAQItem
            q="Can I use MyTapCard for my business?"
            a="Yes. Create a Pro profile to remove branding and present a more professional page."
          />
          <FAQItem
            q="Do I need an NFC card to use this?"
            a="No. You can share using a normal link or QR code. NFC tap cards are optional."
          />
          <FAQItem
            q="Can I update my links anytime?"
            a="Yes. Add, delete, or reorder links from your dashboard whenever you want."
          />
          <FAQItem
            q="Is this mobile friendly?"
            a="Yes — every page is designed mobile-first and looks great on any screen."
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Ready to build your MyTapCard?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your profile, add links, and start sharing today.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.99]"
            >
              Get started
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 active:scale-[0.99]"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
