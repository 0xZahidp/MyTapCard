import AuthCard from "@/components/auth/AuthCard";

export default function LoginPage() {
  return (
    <AuthCard>
      <h1 className="text-2xl font-bold mb-6 text-center">
        Login to MyTapCard
      </h1>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:opacity-90"
        >
          Login
        </button>
      </form>

      <p className="text-sm text-center mt-4 text-gray-600">
        Don’t have an account?{" "}
        <a href="/register" className="underline">
          Register
        </a>
      </p>
    </AuthCard>
  );
}
