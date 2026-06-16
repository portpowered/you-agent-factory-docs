import type { ShellViewport } from "@/types/media";

/** Shared breakpoint values in pixels; keep globals.css media queries aligned. */
export const RESPONSIVE_BREAKPOINTS_PX = {
  mobileMax: 639,
  tabletMax: 1023,
} as const;

export const DEFAULT_SHELL_VIEWPORT: ShellViewport = "desktop";

export function classifyShellViewport(widthPx: number): ShellViewport {
  if (widthPx <= RESPONSIVE_BREAKPOINTS_PX.mobileMax) {
    return "mobile";
  }

  if (widthPx <= RESPONSIVE_BREAKPOINTS_PX.tabletMax) {
    return "tablet";
  }

  return "desktop";
}
