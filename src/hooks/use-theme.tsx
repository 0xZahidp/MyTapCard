import { useEffect, type ReactNode } from "react";

// Light mode only. The dark/light user preference was removed.
// This provider keeps a stable export name in case other modules import it,
// but it always forces the document into light mode.
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    try {
      localStorage.removeItem("mtc-theme");
    } catch {
      // Storage can be unavailable in private browsing or embedded contexts.
    }
  }, []);
  return <>{children}</>;
}

// Kept for backward compatibility — always reports "light" and is a no-op.
export const useTheme = () => ({
  theme: "light" as const,
  toggle: () => {},
  setTheme: () => {},
});
