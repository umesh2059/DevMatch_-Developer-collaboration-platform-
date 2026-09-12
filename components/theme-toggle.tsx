"use client";

import { useLayoutEffect } from "react";

const STORAGE_KEY = "theme";

export function ThemeToggle() {
  // React's Strict Mode remounts once in dev, resetting <html> back to the
  // JSX default (data-theme="light") and undoing the inline script. Re-apply
  // the stored choice so dev matches prod. No-op in production.
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) document.documentElement.setAttribute("data-theme", stored);
    } catch {}
  }, []);

  function toggle() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      {/* Both icons render on server/client alike; the dark: variant (tied
          to [data-theme="dark"], set by the inline script before paint)
          picks which one shows, so there's no client-only state to mismatch. */}
      <span className="dark:hidden">🌙</span>
      <span className="hidden dark:inline">☀️</span>
    </button>
  );
}
