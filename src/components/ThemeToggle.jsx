"use client";

import { useEffect, useSyncExternalStore } from "react";

const storageKey = "adnex:theme";

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" ? stored : getSystemTheme();
  } catch {
    return getSystemTheme();
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function subscribe(onStoreChange) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("adnex-theme-change", onStoreChange);
  media.addEventListener("change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("adnex-theme-change", onStoreChange);
    media.removeEventListener("change", onStoreChange);
  };
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getStoredTheme, () => "light");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(storageKey, nextTheme);
    } catch {
      // Storage can be blocked; the theme still applies for this page view.
    }
    applyTheme(nextTheme);
    window.dispatchEvent(new Event("adnex-theme-change"));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-btn"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      suppressHydrationWarning
    >
      {theme === "dark" ? "LIGHT" : "DARK"}
    </button>
  );
}
