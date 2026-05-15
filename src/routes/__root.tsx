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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MyTapCard — Your digital business card, one tap away" },
      {
        name: "description",
        content:
          "Create a beautiful digital profile, share with a link, QR code, or NFC tap card. Built for modern professionals.",
      },
      {
        name: "keywords",
        content:
          "digital business card, NFC business card, QR code business card, link in bio, contact card, online profile",
      },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "MyTapCard" },
      { property: "og:title", content: "MyTapCard — One tap. Every link." },
      {
        property: "og:description",
        content: "Digital tap cards & shareable profile pages for modern professionals.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "MyTapCard" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "MyTapCard — Digital business cards with QR and NFC sharing",
      },
      {
        name: "twitter:description",
        content:
          "Build a polished digital profile and share it with a link, QR code, or NFC tap card.",
      },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://mytapcard.com/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap",
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
