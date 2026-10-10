import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { LoadingOverlayProvider } from "@/components/ui/loading-overlay";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4">
      <div className="max-w-md text-center glass rounded-3xl p-10 shadow-elegant">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This card doesn't exist — yet.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft hover:shadow-elegant transition-smooth"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-xl border border-border px-4 py-2 text-sm font-medium">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
      { title: "MyTapCard — Your digital business card, one tap away" },
      {
        name: "description",
        content:
          "Create a beautiful digital profile, share with a link, dynamic QR code, or contactless NFC tap card. Built for modern professionals, creators & teams.",
      },
      {
        name: "keywords",
        content:
          "digital business card, NFC business card, smart business card, QR code business card, link in bio, contact card, contactless card, vCard generator, digital identity, Bangladesh NFC card",
      },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      {
        name: "googlebot",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { name: "bingbot", content: "index, follow" },
      { name: "author", content: "MyTapCard" },
      { name: "creator", content: "Zahid" },
      { name: "publisher", content: "MyTapCard" },
      { name: "theme-color", content: "#090d16" },
      { name: "application-name", content: "MyTapCard" },
      { name: "apple-mobile-web-app-title", content: "MyTapCard" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "format-detection", content: "telephone=no" },

      // Open Graph
      { property: "og:site_name", content: "MyTapCard" },
      { property: "og:title", content: "MyTapCard — One tap. Every link. Shared everywhere." },
      {
        property: "og:description",
        content:
          "Next-generation digital business card. Share your profile, contacts, links, and payment options with a single NFC tap or QR scan.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.mytapcard.online/" },
      { property: "og:image", content: "https://www.mytapcard.online/og-image.png" },
      { property: "og:image:secure_url", content: "https://www.mytapcard.online/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "MyTapCard — Digital Business Card Platform" },
      { property: "og:locale", content: "en_US" },

      // Twitter / X
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@mytapcard" },
      { name: "twitter:creator", content: "@zahidp" },
      {
        name: "twitter:title",
        content: "MyTapCard — Smart NFC & QR Digital Business Cards",
      },
      {
        name: "twitter:description",
        content:
          "Build a polished digital profile and share it instantly with a link, QR code, or NFC tap card.",
      },
      { name: "twitter:image", content: "https://www.mytapcard.online/og-image.png" },
      { name: "twitter:image:alt", content: "MyTapCard — Digital Business Card Preview" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://www.mytapcard.online/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://www.mytapcard.online/#website",
              url: "https://www.mytapcard.online/",
              name: "MyTapCard",
              description: "Next-generation digital business card and contactless identity platform",
              inLanguage: "en-US",
              publisher: {
                "@id": "https://www.mytapcard.online/#organization",
              },
            },
            {
              "@type": "Organization",
              "@id": "https://www.mytapcard.online/#organization",
              name: "MyTapCard",
              url: "https://www.mytapcard.online/",
              logo: {
                "@type": "ImageObject",
                url: "https://www.mytapcard.online/og-image.png",
              },
              founder: {
                "@type": "Person",
                name: "Zahid Hasan",
                url: "https://zahidp.com",
              },
              sameAs: ["https://zahidp.com"],
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LoadingOverlayProvider>
          <AuthProvider>
            <Outlet />
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </LoadingOverlayProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
