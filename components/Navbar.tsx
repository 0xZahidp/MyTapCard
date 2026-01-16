import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          MyTapCard
        </Link>

        {/* Links */}
        <div className="space-x-4">
          <Link href="/login" className="text-gray-600 hover:text-black">
            Login
          </Link>
          <Link href="/register" className="font-medium">
            Get Started
          </Link>
        </div>

      </div>
    </nav>
  );
}
