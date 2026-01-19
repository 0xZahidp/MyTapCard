"use client";

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold text-gray-900">
              MyTapCard
            </Link>
            <span className="hidden sm:inline text-xs text-gray-500">
              Digital profile & tap card links
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900">
              Contact
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
              Terms
            </Link>
          </nav>
        </div>

        {/* Bottom */}
        <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            © {year} <span className="font-semibold text-gray-700">MyTapCard</span>. All rights reserved.
          </p>

          <p className="text-xs text-gray-400">
            Built for fast sharing.
          </p>
        </div>
      </div>
    </footer>
  );
}
