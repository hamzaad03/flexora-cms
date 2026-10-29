"use client";

import { useSyncExternalStore } from "react";

// Light/dark admin theme. The choice lives in localStorage and as the `.dark`
// class on <html> (keyed by the `dark` variant in globals.css). The initial
// class is applied before paint by public/flx-theme.js; keep the storage key
// in sync with it. Replaces next-themes, whose injected <script> React 19
// rejects ("Encountered a script tag while rendering React component").

const STORAGE_KEY = "flx-theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;

export type ThemeName = "light" | "dark";

export function setTheme(theme: ThemeName) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode etc.): the choice lasts for this page.
  }
}

export function useTheme(): { theme: ThemeName; setTheme: typeof setTheme } {
  const isDark = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return { theme: isDark ? "dark" : "light", setTheme };
}
