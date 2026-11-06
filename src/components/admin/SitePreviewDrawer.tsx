"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PAGES = [
  { href: "/", label: "Home" },
  { href: "/fonts", label: "Fonts" },
  { href: "/about", label: "About" },
  { href: "/license", label: "License" },
  { href: "/contact", label: "Contact" },
];

const DEVICES = {
  desktop: { label: "Desktop", width: 1280 },
  mobile: { label: "Mobile", width: 390 },
} as const;
type Device = keyof typeof DEVICES;

const STORAGE_KEY = "pi-admin-preview-open";

function readOpen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * A slide-over with the real public site inside, available on every admin page.
 * It reloads itself whenever an admin save (a Server Action) finishes, so the
 * result of an edit is visible without leaving the admin.
 */
export function SitePreviewDrawer() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState("/");
  const [device, setDevice] = useState<Device>("desktop");
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(readOpen()), []);

  const toggle = useCallback((next: boolean) => {
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // storage can be unavailable; the drawer still works
    }
  }, []);

  // Reload the preview shortly after any Server Action completes (i.e. after a save).
  useEffect(() => {
    if (!open) return;
    const original = window.fetch;
    let timer: ReturnType<typeof setTimeout> | undefined;
    window.fetch = async function patched(input: RequestInfo | URL, init?: RequestInit) {
      const res = await original.call(window, input, init);
      try {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (headers.has("Next-Action")) {
          clearTimeout(timer);
          timer = setTimeout(() => {
            setLoading(true);
            setReloadKey((k) => k + 1);
          }, 700);
        }
      } catch {
        // never let preview bookkeeping break a save
      }
      return res;
    };
    return () => {
      window.fetch = original;
      clearTimeout(timer);
    };
  }, [open]);

  // Measure the stage so the page can be scaled to fit it.
  useEffect(() => {
    if (!open) return;
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && toggle(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, toggle]);

  const frameWidth = DEVICES[device].width;
  const scale = box.w ? Math.min(1, box.w / frameWidth) : 1;
  const frameHeight = box.h && scale ? box.h / scale : 800;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => toggle(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lift transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <span className="h-2 w-2 rounded-full bg-signal" aria-hidden />
          Preview site
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Site preview"
          className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-panel shadow-lift sm:w-[min(560px,92vw)] sm:rounded-l-3xl"
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <select
              value={page}
              onChange={(e) => {
                setLoading(true);
                setPage(e.target.value);
              }}
              aria-label="Page to preview"
              className="rounded-full bg-paper px-3 py-1.5 text-xs font-semibold text-ink outline-none"
            >
              {PAGES.map((p) => (
                <option key={p.href} value={p.href}>
                  {p.label}
                </option>
              ))}
            </select>

            <div className="flex rounded-full bg-paper p-1">
              {(Object.keys(DEVICES) as Device[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    device === d ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {DEVICES[d].label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setReloadKey((k) => k + 1);
                }}
                className="rounded-full bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:text-ink"
              >
                Refresh
              </button>
              <a
                href={page}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-paper px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:text-ink"
              >
                Open ↗
              </a>
              <button
                type="button"
                onClick={() => toggle(false)}
                aria-label="Close preview"
                className="grid h-8 w-8 place-items-center rounded-full bg-ink text-sm text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden bg-paper-dim">
            {loading && (
              <div className="absolute inset-0 z-10 grid place-items-center text-xs font-semibold text-ink-soft">
                Loading preview…
              </div>
            )}
            <div
              style={{
                width: frameWidth,
                height: frameHeight,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                marginLeft: device === "mobile" && box.w > frameWidth ? (box.w - frameWidth) / 2 : 0,
              }}
            >
              <iframe
                key={`${page}-${reloadKey}`}
                src={page}
                title="Site preview"
                onLoad={() => setLoading(false)}
                className="h-full w-full border-0 bg-white"
              />
            </div>
          </div>

          <p className="border-t border-line px-4 py-2 text-[11px] text-ink-faint">
            Shows the live site. It refreshes by itself after you save a change.
          </p>
        </div>
      )}
    </>
  );
}
