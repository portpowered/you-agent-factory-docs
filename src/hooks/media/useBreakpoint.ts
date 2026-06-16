"use client";

import {
  DEFAULT_SHELL_VIEWPORT,
  RESPONSIVE_BREAKPOINTS_PX,
  classifyShellViewport,
} from "@/lib/responsive-tokens";
import type { ShellViewport } from "@/types/media";
import { useSyncExternalStore } from "react";

function getViewportSnapshot(): ShellViewport {
  return classifyShellViewport(window.innerWidth);
}

function subscribeToViewportChanges(onStoreChange: () => void): () => void {
  const mobileQuery = window.matchMedia(
    `(max-width: ${RESPONSIVE_BREAKPOINTS_PX.mobileMax}px)`,
  );
  const tabletQuery = window.matchMedia(
    `(max-width: ${RESPONSIVE_BREAKPOINTS_PX.tabletMax}px)`,
  );

  const handleChange = () => {
    onStoreChange();
  };

  mobileQuery.addEventListener("change", handleChange);
  tabletQuery.addEventListener("change", handleChange);
  window.addEventListener("resize", handleChange);

  return () => {
    mobileQuery.removeEventListener("change", handleChange);
    tabletQuery.removeEventListener("change", handleChange);
    window.removeEventListener("resize", handleChange);
  };
}

/** SSR-safe viewport band derived from shared responsive tokens. */
export function useBreakpoint(): ShellViewport {
  return useSyncExternalStore(
    subscribeToViewportChanges,
    getViewportSnapshot,
    () => DEFAULT_SHELL_VIEWPORT,
  );
}
