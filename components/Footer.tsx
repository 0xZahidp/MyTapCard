"use client";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        {/* Bottom only */}
        <div className="flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-gray-500">
            © {year}{" "}
            <span className="font-semibold text-gray-700">MyTapCard</span>. All rights reserved.
          </p>

          <p className="text-xs text-gray-400">Built for fast sharing.</p>
        </div>
      </div>
    </footer>
  );
}
