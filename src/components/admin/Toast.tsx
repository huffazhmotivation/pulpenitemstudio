"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  push: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fail soft — admin surfaces should never crash because a toast
    // provider was missing higher up the tree.
    return {
      push: () => {},
      success: () => {},
      error: () => {},
    };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, kind === "error" ? 5000 : 2800);
  }, []);

  const value: ToastContextValue = {
    push,
    success: (message: string) => push(message, "success"),
    error: (message: string) => push(message, "error"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-xs flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-md border px-4 py-3 text-sm shadow-[0_8px_24px_-6px_rgba(0,0,0,0.6)] animate-[toast-in_0.18s_ease-out]",
              t.kind === "success" && "border-line bg-panel text-ink",
              t.kind === "error" && "border-sale/40 bg-panel text-sale",
              t.kind === "info" && "border-line bg-panel text-ink-soft"
            )}
          >
            <span className="mt-0.5 shrink-0">
              {t.kind === "success" && (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {t.kind === "error" && (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </span>
            <span className="leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Small inline "Saved ✓ / Saving… / Error" pill used next to sticky-bar and section titles. */
export function SavedIndicator({
  state,
}: {
  state: "idle" | "saving" | "saved" | "error";
}) {
  if (state === "idle") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium transition-opacity duration-200",
        state === "saving" && "text-ink-soft",
        state === "saved" && "text-ink",
        state === "error" && "text-sale"
      )}
    >
      {state === "saving" && (
        <>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-soft" />
          Saving…
        </>
      )}
      {state === "saved" && (
        <>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Saved
        </>
      )}
      {state === "error" && (
        <>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Error
        </>
      )}
    </span>
  );
}
