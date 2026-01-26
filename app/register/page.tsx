import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-6">
          Loading…
        </main>
      }
    >
      <RegisterClient />
    </Suspense>
  );
}
