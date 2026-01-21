"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "next-auth/react";

type MeUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [me, setMe] = useState<MeUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const fetchMe = async () => {
      try {
        setLoadingMe(true);
        const res = await fetch("/api/me", { credentials: "same-origin" });
        const data = await res.json().catch(() => ({} as any));

        // If unauthorized or missing user -> treat as logged out
        if (!res.ok || !data?.user) {
          setMe(null);
          return;
        }

        setMe(data.user as MeUser);
      } finally {
        setLoadingMe(false);
      }
    };

    fetchMe();
  }, [mounted]);

  // Close dropdown on outside click + escape
  useEffect(() => {
    if (!menuOpen) return;

    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const isDashboard = useMemo(() => pathname?.startsWith("/dashboard"), [pathname]);

  if (!mounted) return null;

  const isAuthed = !!me;

  const handleLogout = async () => {
    // clear legacy cookie
    await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    // clear NextAuth session (Google/Facebook)
    await signOut({ redirect: false });

    setMe(null);
    setMenuOpen(false);
    router.push("/login");
  };

  const avatarSrc = me?.avatar || "/avatar-placeholder.png";
  const displayName = me?.name || "Account";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-semibold tracking-tight text-gray-900"
        >
          <span className="text-lg sm:text-xl">MyTapCard</span>
          <span className="hidden sm:inline text-xs font-medium text-gray-500 group-hover:text-gray-700 transition">
            digital cards
          </span>
        </Link>

        {/* Right side (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {!isAuthed ? (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 transition"
              >
                Signup
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className={cx(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  isDashboard
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                Dashboard
              </Link>

              {/* Avatar + Name */}
              <div className="flex items-center gap-2 pl-1">
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="h-9 w-9 rounded-full object-cover border border-gray-200"
                  referrerPolicy="no-referrer"
                />
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-gray-800">
                    {loadingMe ? "Loading..." : displayName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {me?.email ? me.email : " "}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2" ref={menuRef}>
          {!isAuthed ? (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-95 transition"
              >
                Signup
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 transition hover:bg-gray-50"
                aria-label="Open menu"
                aria-expanded={menuOpen}
              >
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover border border-gray-200"
                  referrerPolicy="no-referrer"
                />
                <span className="max-w-[120px] truncate text-sm font-medium text-gray-800">
                  {loadingMe ? "Account" : displayName}
                </span>

                <svg
                  className={cx("h-4 w-4 text-gray-500 transition", menuOpen && "rotate-180")}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-4 top-14 w-64 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-semibold text-gray-900">
                      {loadingMe ? "Account" : displayName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {me?.email || " "}
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className={cx(
                        "block rounded-xl px-3 py-2 text-sm font-medium transition",
                        isDashboard ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      Dashboard
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
