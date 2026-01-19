import { ReactNode } from "react";

export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </section>
  );
}
