"use client";

import { useBreakpoint } from "@/hooks/media/useBreakpoint";
import { useReducedMotion } from "@/hooks/media/useReducedMotion";
import type { ResponsiveShellState, ShellViewport } from "@/types/media";
import { useSyncExternalStore } from "react";

function buildResponsiveShellState(
  viewport: ShellViewport,
  isHydrated: boolean,
  prefersReducedMotion: boolean,
): ResponsiveShellState {
  return {
    viewport,
    isMobile: viewport === "mobile",
    isTablet: viewport === "tablet",
    isDesktop: viewport === "desktop",
    isNarrowViewport: viewport !== "desktop",
    isHydrated,
    prefersReducedMotion,
  };
}

function subscribeToHydration(onStoreChange: () => void): () => void {
  onStoreChange();
  return () => {};
}

/** Canonical responsive shell state boundary for docs and landing surfaces. */
export function useResponsiveShellState(): ResponsiveShellState {
  const viewport = useBreakpoint();
  const prefersReducedMotion = useReducedMotion();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  return buildResponsiveShellState(viewport, isHydrated, prefersReducedMotion);
}
