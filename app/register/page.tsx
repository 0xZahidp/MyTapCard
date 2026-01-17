import AuthCard from "@/components/auth/AuthCard";

export default function RegisterPage() {
  return (
    <AuthCard>
      <h1 className="text-2xl font-bold mb-6 text-center">
        Create your MyTapCard
      </h1>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Zahid Hasan"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
          />
        </div>

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
            placeholder="Create a password"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:opacity-90"
        >
          Create Account
        </button>
      </form>

      <p className="text-sm text-center mt-4 text-gray-600">
        Already have an account?{" "}
        <a href="/login" className="underline">
          Login
        </a>
      </p>
    </AuthCard>
  );
}
