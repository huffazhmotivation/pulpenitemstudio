"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/Toast";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Wraps a non-redirecting server action call so it can be invoked from a
 * client component with toast + inline "Saved / Error" feedback instead of
 * a full page navigation. Not for actions that call redirect() internally
 * (createFont, deleteFont) — those should stay as native <form action>.
 */
export function useSavedAction() {
  const [state, setState] = useState<SaveState>("idle");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const run = useCallback(
    (fn: () => Promise<unknown>, opts?: { successMessage?: string; silent?: boolean }) => {
      setState("saving");
      startTransition(async () => {
        try {
          await fn();
          setState("saved");
          if (opts?.successMessage) toast.success(opts.successMessage);
          router.refresh();
          window.setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 2200);
        } catch (err) {
          setState("error");
          const message = err instanceof Error ? err.message : "Something went wrong.";
          if (!opts?.silent) toast.error(message);
        }
      });
    },
    [router, toast]
  );

  return { run, state, isPending };
}
