"use client";

import { useMemo, useSyncExternalStore } from "react";

function subscribe(onChange) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const noopSubscribe = () => () => {};

// True once running in the browser, so pages can skip empty states during hydration.
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

// Reads JSON saved in browser storage without a server/client hydration mismatch:
// the server snapshot is null, and the raw string snapshot keeps renders stable.
export function useBrowserStorage(area, keys, fallback = null) {
  const keyList = Array.isArray(keys) ? keys : [keys];
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        const storage = area === "session" ? sessionStorage : localStorage;
        for (const key of keyList) {
          const value = storage.getItem(key);
          if (value) return value;
        }
      } catch {
        // Storage can be unavailable (private mode, blocked site data).
      }
      return null;
    },
    () => null,
  );

  return useMemo(() => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }, [raw, fallback]);
}
