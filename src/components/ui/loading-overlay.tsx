import { LoaderCircle } from "lucide-react";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface LoadingOverlayContextValue {
  show: (key: string) => void;
  hide: (key: string) => void;
}

const LoadingOverlayContext = createContext<LoadingOverlayContextValue>({
  show: () => undefined,
  hide: () => undefined,
});

export function LoadingOverlayProvider({ children }: { children: ReactNode }) {
  const activeKeys = useRef(new Set<string>());
  const [visible, setVisible] = useState(false);

  const show = useCallback((key: string) => {
    activeKeys.current.add(key);
    setVisible(true);
  }, []);

  const hide = useCallback((key: string) => {
    activeKeys.current.delete(key);
    setVisible(activeKeys.current.size > 0);
  }, []);

  const value = useMemo(() => ({ show, hide }), [hide, show]);

  return (
    <LoadingOverlayContext.Provider value={value}>
      {children}
      <GlobalLoadingOverlay visible={visible} />
    </LoadingOverlayContext.Provider>
  );
}

export function useGlobalLoading(loading: boolean, key: string) {
  const ctx = useContext(LoadingOverlayContext);

  useEffect(() => {
    if (!loading) {
      ctx.hide(key);
      return;
    }

    ctx.show(key);
    return () => ctx.hide(key);
  }, [ctx, key, loading]);
}

function GlobalLoadingOverlay({ visible }: { visible: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const shouldShow = mounted && visible;

  if (!shouldShow) return null;

  return (
    <div
      aria-hidden={false}
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 opacity-100"
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div className="relative flex min-w-40 items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-elegant">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
          <LoaderCircle className="h-5 w-5 animate-spin" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">Working on it</div>
          <div className="text-xs text-muted-foreground">Please wait a moment…</div>
        </div>
      </div>
    </div>
  );
}
