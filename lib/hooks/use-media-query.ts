"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string, callback: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    () => window.matchMedia(query).matches,
    () => false // SSR fallback
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}
