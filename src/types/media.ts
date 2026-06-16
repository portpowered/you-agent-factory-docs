/** Canonical shell viewport bands derived from shared responsive tokens. */
export type ShellViewport = "mobile" | "tablet" | "desktop";

/** Shared responsive shell state boundary consumed by shell surfaces. */
export type ResponsiveShellState = {
  viewport: ShellViewport;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** True when the viewport is mobile or tablet (not desktop). */
  isNarrowViewport: boolean;
  /** True after client hydration has applied viewport measurements. */
  isHydrated: boolean;
};
