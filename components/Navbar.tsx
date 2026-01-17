"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <nav className="w-full border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          MyTapCard
        </Link>

        <div className="space-x-4">
          <Link href="/dashboard">Dashboard</Link>
          <button
            onClick={handleLogout}
            className="text-red-600 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
