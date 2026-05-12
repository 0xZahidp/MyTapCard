import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useProStatus } from "@/hooks/use-pro";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  User,
  Link2,
  QrCode,
  Eye,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Wallet,
  Palette,
  Settings as SettingsIcon,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/links", label: "Links", icon: Link2 },
  { to: "/design", label: "Design", icon: Palette },
  { to: "/financial", label: "Financial", icon: Wallet },
  { to: "/share", label: "Share", icon: QrCode },
  { to: "/preview", label: "Preview", icon: Eye },
  { to: "/subscription", label: "Subscription", icon: Crown },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function AuthLayout() {
  const { user, loading } = useAuth();
  const { isAdmin } = useProStatus();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navItems = isAdmin
    ? [...nav, { to: "/admin" as const, label: "Admin", icon: ShieldCheck }]
    : nav;

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/auth/login" });
    }
  }, [loading, navigate, user]);

  if (loading || !user)
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>
    );

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-cream/40">
      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <CreditCard className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">MyTapCard</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)}>
          {open ? <X /> : <Menu />}
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="hidden h-16 items-center gap-2 border-b border-border px-5 md:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
              <CreditCard className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight">MyTapCard</span>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {navItems.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth ${active ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-2 p-3">
            <div className="rounded-xl border border-border bg-secondary/50 p-3 text-xs">
              <div className="truncate font-semibold text-foreground">{user?.email}</div>
              <div className="text-muted-foreground">Signed in</div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={logout}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </aside>

        {open && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
