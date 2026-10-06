import { useCallback, useSyncExternalStore } from "react";

/** Live result of a CSS media query; false during server render. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/** Phones and small touch screens get the lighter render budget. */
export const usePhone = () => useMediaQuery("(max-width: 767px), (pointer: coarse)");
