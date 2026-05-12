import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Zap,
  QrCode,
  Link2,
  Smartphone,
  Palette,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Check,
  CreditCard,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyTapCard — One tap. Every link. Every contact." },
      {
        name: "description",
        content:
          "A premium digital business card. Share your profile, links, and payment details with a single tap or QR scan.",
      },
      {
        name: "keywords",
        content:
          "digital business card, NFC card, QR profile, professional link page, share contact details",
      },
      {
        property: "og:title",
        content: "MyTapCard — Digital business cards for modern professionals",
      },
      {
        property: "og:description",
        content:
          "Create a polished profile, organize every link, and share it instantly with QR or NFC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
            <CreditCard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">MyTapCard</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-smooth">
            Features
          </a>
          <a href="#how" className="hover:text-foreground transition-smooth">
            How it works
          </a>
          <a href="#pricing" className="hover:text-foreground transition-smooth">
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth/login">Log in</Link>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/auth/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-hero relative overflow-hidden">
      <div className="container mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            One link. Tap. QR. NFC.
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Your <span className="text-gradient">digital identity</span>,<br />
            shared in a single tap.
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
            Build a beautiful profile page, collect every link in one place, and share it with a QR
            code or premium NFC tap card.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="hero" size="lg">
              <Link to="/auth/register">
                Create your card <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" /> Free forever plan
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" /> No credit card
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <PhoneMock />
        </div>
      </div>
    </section>
  );
}

function PhoneMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-primary opacity-20 blur-3xl" />
      <div className="rounded-[2.5rem] border border-border bg-card p-3 shadow-elegant">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-sand">
          <div className="bg-gradient-primary p-6 pb-16 text-primary-foreground">
            <div className="mx-auto h-20 w-20 rounded-full border-4 border-primary-foreground/30 bg-sand shadow-glow" />
            <h3 className="mt-3 text-center text-xl font-bold">Alex Morgan</h3>
            <p className="text-center text-sm text-primary-foreground/80">@alexmorgan</p>
            <p className="mx-auto mt-2 max-w-[14rem] text-center text-xs text-primary-foreground/80">
              Product designer · coffee enthusiast · always shipping
            </p>
          </div>
          <div className="-mt-10 space-y-2 px-4 pb-6">
            {["Portfolio", "LinkedIn", "Email me", "WhatsApp"].map((l) => (
              <div
                key={l}
                className="rounded-xl bg-card px-4 py-3 text-center text-sm font-semibold shadow-soft"
              >
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Features() {
  const items = [
    {
      icon: Link2,
      title: "Unlimited links",
      body: "Group links, reorder them, hide and show on the fly.",
    },
    {
      icon: QrCode,
      title: "Auto QR code",
      body: "Every profile gets a downloadable QR you can print anywhere.",
    },
    {
      icon: Smartphone,
      title: "NFC tap cards",
      body: "Order a premium card. One tap shares your profile instantly.",
    },
    {
      icon: Palette,
      title: "Custom design",
      body: "Theme your page with light, dark, or system mode.",
    },
    {
      icon: ShieldCheck,
      title: "You own your data",
      body: "Toggle public visibility and control every field.",
    },
    {
      icon: Zap,
      title: "Lightning fast",
      body: "Mobile-first, instantly shareable, never sluggish.",
    },
  ];
  return (
    <section id="features" className="container mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Everything you need, nothing you don't.</h2>
        <p className="mt-3 text-muted-foreground">Built for the way you actually share.</p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="group rounded-3xl border border-border bg-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Create your profile", d: "Pick a username, add your bio, drop your avatar." },
    { n: "02", t: "Add your links", d: "Group them, reorder them, hide what you want." },
    {
      n: "03",
      t: "Share by tap or QR",
      d: "Send your profile URL, scan a QR, or tap an NFC card.",
    },
  ];
  return (
    <section id="how" className="bg-linen py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">From zero to shared in minutes.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl border border-border bg-card p-7 shadow-soft">
              <div className="text-sm font-bold text-accent">{s.n}</div>
              <h3 className="mt-3 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="container mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Simple, fair pricing.</h2>
        <p className="mt-3 text-muted-foreground">Start free. Upgrade when you outgrow it.</p>
      </div>
      <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
        <PlanCard
          name="Free"
          price="$0"
          features={[
            "Public profile page",
            "Unlimited links",
            "Auto QR code",
            "Standard page footer",
          ]}
          cta={
            <Button asChild className="w-full" variant="outline" size="lg">
              <Link to="/auth/register">Start free</Link>
            </Button>
          }
        />
        <PlanCard
          highlighted
          name="Pro"
          price="$5"
          period="/mo"
          features={[
            "Everything in Free",
            "Remove branding",
            "Priority support",
            "Early access to new themes",
          ]}
          cta={
            <Button asChild className="w-full" variant="hero" size="lg">
              <Link to="/auth/register">Go Pro</Link>
            </Button>
          }
        />
      </div>
    </section>
  );
}

function PlanCard({
  name,
  price,
  period,
  features,
  cta,
  highlighted,
}: {
  name: string;
  price: string;
  period?: string;
  features: string[];
  cta: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative rounded-3xl border p-7 shadow-soft transition-smooth ${highlighted ? "border-accent bg-gradient-primary text-primary-foreground shadow-elegant" : "border-border bg-card"}`}
    >
      {highlighted && (
        <span className="absolute -top-3 right-6 rounded-full bg-sand px-3 py-1 text-xs font-bold text-sand-foreground shadow-soft">
          Most popular
        </span>
      )}
      <div className="text-sm font-semibold uppercase tracking-wider opacity-80">{name}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-bold">{price}</span>
        {period && (
          <span
            className={`text-sm ${highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}
          >
            {period}
          </span>
        )}
      </div>
      <ul className="mt-6 space-y-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className={`mt-0.5 h-4 w-4 ${highlighted ? "text-sand" : "text-accent"}`} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7">{cta}</div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
            <CreditCard className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>© 2026 MyTapCard. All rights reserved.</span>
        </div>
        <div className="flex gap-5">
          <Link to="/auth/login">Log in</Link>
          <Link to="/auth/register">Sign up</Link>
        </div>
      </div>
    </footer>
  );
}
