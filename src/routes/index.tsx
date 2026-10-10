import { createFileRoute, Link } from "@tanstack/react-router";
import { DotLottieReact, type DotLottie } from "@lottiefiles/dotlottie-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
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
  Menu,
  X,
  ChevronDown,
  HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyTapCard — Digital Business Card, NFC Smart Card & Link in Bio" },
      {
        name: "description",
        content:
          "Create your free digital business card with MyTapCard. Share contact details, portfolio links, social profiles, and payment channels instantly via NFC tap or QR code.",
      },
      {
        name: "keywords",
        content:
          "digital business card, NFC card, smart business card, QR code business card, link in bio, vCard contact, contactless card, digital identity, Bangladesh NFC card",
      },
      {
        property: "og:title",
        content: "MyTapCard — Digital Business Card & Contactless Smart Card",
      },
      {
        property: "og:description",
        content:
          "Create a polished profile, organize every link, and share it instantly with dynamic QR or contactless NFC tap.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.mytapcard.online/" },
      { property: "og:image", content: "https://www.mytapcard.online/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MyTapCard — Digital Business Card, NFC & QR Profile" },
      {
        name: "twitter:description",
        content:
          "Share contact info, social channels, and payment details in a single tap with MyTapCard.",
      },
      { name: "twitter:image", content: "https://www.mytapcard.online/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://www.mytapcard.online/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "SoftwareApplication",
              name: "MyTapCard",
              operatingSystem: "All (Web, iOS, Android)",
              applicationCategory: "BusinessApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Next-generation digital business card and contactless identity platform with NFC tap and dynamic QR code sharing.",
              url: "https://www.mytapcard.online/",
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is MyTapCard?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "MyTapCard is a contactless digital identity platform that replaces traditional paper business cards with an interactive web profile, smart NFC tap cards, and dynamic QR codes.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Do other people need an app to view my card?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No app or account is required. Anyone can tap your NFC card or scan your QR code with their smartphone camera to open your live profile immediately in their browser.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does NFC tap sharing work?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Simply tap your MyTapCard physical NFC card against any modern iPhone or Android phone. The phone detects the contactless chip and instantly opens your digital card.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can people save my contact details directly to their phone?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. MyTapCard includes a 1-tap Save Contact (.vcf vCard) feature that allows anyone to save your name, phone number, email, and website directly into their phone address book.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What links and payment methods can I connect?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "You can connect 70+ social networks, messaging apps (WhatsApp, Telegram), portfolios, and payment options including bKash, Nagad, Stripe, PayPal, and crypto wallets.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is MyTapCard free to use?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, MyTapCard offers a generous free forever plan with customizable themes, unlimited link sharing, dynamic QR code generation, and instant contact sharing.",
                  },
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <Header />
      <Hero />
      <BrandShowcase />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <Footer />
      <MobileActionBar />
    </div>
  );
}

const SHOWCASE_BRANDS = [
  { name: "LinkedIn", icon: "/brand-icons/linkedin.svg" },
  { name: "WhatsApp", icon: "/brand-icons/whatsapp.svg" },
  { name: "GitHub", icon: "/brand-icons/github.svg" },
  { name: "Instagram", icon: "/brand-icons/instagram.svg" },
  { name: "Telegram", icon: "/brand-icons/telegram.svg" },
  { name: "X", icon: "/brand-icons/x.svg" },
  { name: "YouTube", icon: "/brand-icons/youtube.svg" },
  { name: "Discord", icon: "/brand-icons/discord.svg" },
  { name: "Spotify", icon: "/brand-icons/spotify.svg" },
  { name: "PayPal", icon: "/brand-icons/paypal.svg" },
  { name: "Stripe", icon: "/brand-icons/stripe.svg" },
  { name: "bKash", icon: "/brand-icons/bkash.svg" },
  { name: "Binance", icon: "/brand-icons/binance.svg" },
];

function BrandShowcase() {
  return (
    <section className="border-y border-border/60 bg-card/30 py-6 overflow-hidden">
      <div className="container mx-auto max-w-6xl px-4 mb-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Seamlessly connect 70+ social, professional & payment channels
        </p>
      </div>
      <Marquee speed={34} pauseOnHover>
        {SHOWCASE_BRANDS.map((b) => (
          <div
            key={b.name}
            className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card/90 px-4 py-2 shadow-soft backdrop-blur hover:border-primary/50 transition-colors"
          >
            <img src={b.icon} alt={b.name} className="h-5 w-5 object-contain" />
            <span className="text-xs font-semibold text-foreground/90">{b.name}</span>
          </div>
        ))}
      </Marquee>
    </section>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16">
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
          <a href="#faq" className="hover:text-foreground transition-smooth">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth/login">Log in</Link>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/auth/register" className="hidden sm:inline-flex">
              Get started
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {menuOpen && (
        <nav className="border-t border-border/60 bg-background/95 px-4 py-3 shadow-soft md:hidden">
          <div className="mx-auto grid max-w-6xl gap-1">
            {[
              ["Features", "#features"],
              ["How it works", "#how"],
              ["Pricing", "#pricing"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-secondary"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link to="/auth/login">Log in</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-hero relative overflow-hidden">
      <HeroDots />
      <div className="container relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 sm:py-16 md:py-24 lg:grid-cols-2 lg:gap-12">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            One link. Tap. QR. NFC.
          </span>
          <h1 className="mt-5 text-[2.6rem] font-bold leading-[1.02] tracking-[-0.04em] sm:text-5xl md:text-6xl">
            Your <span className="text-gradient">digital identity</span>,
            <br className="hidden sm:block" />
            shared in a single tap.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[0.95rem] leading-7 text-muted-foreground sm:text-lg lg:mx-0">
            Build a beautiful profile page, collect every link in one place, and share it with a QR
            code or premium NFC tap card.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button asChild variant="hero" size="lg" className="w-full sm:w-auto">
              <Link to="/auth/register">
                Create your card <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <a href="#how">See how it works</a>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:justify-start">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" /> Free forever plan
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" /> No credit card
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[22rem] sm:max-w-xl">
          <PhoneMock />
        </div>
      </div>
    </section>
  );
}

function PhoneMock() {
  const { reduceMotion, setPlayer } = useLottiePlayback();

  return (
    <div className="relative">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-primary opacity-20 blur-3xl" />
      <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card p-2 shadow-elegant sm:rounded-[2.5rem] sm:p-3">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-sand sm:rounded-[2rem]">
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-[0.65rem] font-semibold text-primary shadow-soft backdrop-blur sm:left-5 sm:top-5 sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-accent shadow-glow" />
            Build once. Share everywhere.
          </div>
          <div className="aspect-[921/622] w-full">
            <DotLottieReact
              src="/animations/mytapcard-app-list-v2.lottie"
              autoplay={!reduceMotion}
              loop={!reduceMotion}
              speed={0.85}
              dotLottieRefCallback={setPlayer}
              className="h-full w-full"
              aria-label="Animated MyTapCard profile link list"
              role="img"
              renderConfig={{ autoResize: true, devicePixelRatio: 1.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroDots() {
  const { reduceMotion, setPlayer } = useLottiePlayback();

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.16] mix-blend-multiply"
      aria-hidden="true"
    >
      <DotLottieReact
        src="/animations/mytapcard-hero-dots.lottie"
        autoplay={!reduceMotion}
        loop={!reduceMotion}
        speed={0.65}
        dotLottieRefCallback={setPlayer}
        className="h-full w-full scale-110"
        renderConfig={{ autoResize: true, devicePixelRatio: 1 }}
      />
    </div>
  );
}

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches);

    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  return reduceMotion;
}

function useLottiePlayback() {
  const reduceMotion = useReducedMotion();
  const [player, setPlayer] = useState<DotLottie | null>(null);

  useEffect(() => {
    if (!player) return;

    const syncPlayback = () => {
      if (reduceMotion) player.pause();
      else player.play();
    };

    syncPlayback();
    player.addEventListener("load", syncPlayback);
    return () => player.removeEventListener("load", syncPlayback);
  }, [player, reduceMotion]);

  return { reduceMotion, setPlayer };
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

const FAQS = [
  {
    q: "What is MyTapCard and how does it work?",
    a: "MyTapCard is a contactless digital identity platform that replaces traditional paper cards. You create a polished profile with your contact details, social accounts, and payment links, then share it instantly with a single NFC card tap or dynamic QR code scan.",
  },
  {
    q: "Do other people need an app to view my card?",
    a: "No! Anyone can tap your NFC card or scan your QR code with their regular smartphone camera. Your live card opens directly in their browser without requiring any download or account creation.",
  },
  {
    q: "How does NFC tap sharing work with phones?",
    a: "Simply hold your physical MyTapCard against the back of any modern iPhone or Android device. The phone's built-in NFC reader detects your card and instantly prompts to open your digital profile.",
  },
  {
    q: "Can recipients save my contact details directly to their phone?",
    a: "Yes! Every MyTapCard page features a 1-tap 'Save Contact' (.vcf vCard) action. When tapped, it immediately imports your name, phone numbers, email, job title, and website directly into the recipient's phone address book.",
  },
  {
    q: "What links and payment methods can I connect?",
    a: "You can connect over 70+ social networks, professional platforms (LinkedIn, GitHub), messaging apps (WhatsApp, Telegram), and payment options including bKash, Nagad, Stripe, PayPal, and major crypto wallets.",
  },
  {
    q: "Is MyTapCard free to use?",
    a: "Yes! MyTapCard offers a generous Free Forever plan that includes unlimited profile views, social links, dynamic QR code generation, and instant contact sharing. Pro upgrades are available for advanced themes and analytics.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-border/60 bg-hero py-16 sm:py-24">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <HelpCircle className="h-3.5 w-3.5 text-accent" />
            Frequently Asked Questions
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to know about <span className="text-gradient">MyTapCard</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Got questions? Here are the answers to the most common questions about our contactless smart cards and digital profiles.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-soft backdrop-blur transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left text-base font-semibold hover:text-accent transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground animate-in fade-in-50 duration-200">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
              <CreditCard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>© 2026 MyTapCard. All rights reserved.</span>
          </div>
          <p className="text-xs text-muted-foreground/80 sm:pl-9">
            Built by{" "}
            <a
              href="https://zahidp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline transition-colors"
            >
              Zahid
            </a>
          </p>
        </div>
        <div className="flex gap-5">
          <Link to="/auth/login">Log in</Link>
          <Link to="/auth/register">Sign up</Link>
        </div>
      </div>
    </footer>
  );
}

function MobileActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/90 p-3 backdrop-blur-xl sm:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Your card is minutes away</p>
          <p className="text-xs text-muted-foreground">Free plan · No credit card</p>
        </div>
        <Button asChild variant="hero" size="sm" className="shrink-0">
          <Link to="/auth/register">
            Create card <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
