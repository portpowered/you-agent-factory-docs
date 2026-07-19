/**
 * Shared search / globe / GitHub header chrome highlighting contract.
 *
 * Locked map (story repair-chrome-highlighting-token-map-002):
 * - default = surrounding chrome background
 * - hover/active = primary yellow overlay
 *
 * Consume `--docs-chrome-*` roles from `docs-chrome-highlighting-tokens.ts`
 * via `globals.css`. Do not scatter `--accent` or secondary color-mix hovers
 * on these three controls.
 */

import type { CSSProperties } from "react";
import {
  DOCS_CHROME_HIGHLIGHTING_CSS_VARS,
  DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK,
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES,
} from "@/lib/theme/docs-chrome-highlighting-tokens";
import { FACTORY_DARK_FOUNDATION } from "@/lib/theme/host-semantic-theme-tokens";
import { cn } from "@/lib/utils";

/** Marker class owned by globals.css chrome rules. */
export const DOCS_CHROME_HEADER_ACTION_ICON_CLASS = "header-action-icon";

/**
 * Outline icon button classes for globe / GitHub. Overrides outline-variant
 * `dark:!bg-input/30` and secondary color-mix hover with locked chrome tokens.
 */
export const DOCS_CHROME_HEADER_ACTION_ICON_CLASSES = cn(
  DOCS_CHROME_HEADER_ACTION_ICON_CLASS,
  "!bg-[var(--docs-chrome-surrounding-background)]",
  "dark:!bg-[var(--docs-chrome-surrounding-background)]",
  "hover:!bg-[var(--docs-chrome-primary-yellow)]",
  "hover:!border-[var(--docs-chrome-primary-yellow)]",
  "hover:!text-primary-foreground",
  "dark:hover:!bg-[var(--docs-chrome-primary-yellow)]",
  "aria-expanded:!bg-[var(--docs-chrome-primary-yellow)]",
  "aria-expanded:!border-[var(--docs-chrome-primary-yellow)]",
  "aria-expanded:!text-primary-foreground",
);

/**
 * Semantic CSS values for rest vs hover/active on search / globe / GitHub.
 * Foreground on yellow fill uses primary-foreground (accent ink) for contrast.
 */
export const DOCS_CHROME_SEARCH_GLOBE_GITHUB_TOKENS = {
  restBackground: `var(${DOCS_CHROME_HIGHLIGHTING_CSS_VARS.surroundingChromeBackground})`,
  hoverActiveOverlay: `var(${DOCS_CHROME_HIGHLIGHTING_CSS_VARS.primaryYellow})`,
  hoverActiveForeground: "var(--primary-foreground)",
} as const;

/** Factory-dark hex proofs for the search/globe/GitHub surface. */
export const DOCS_CHROME_SEARCH_GLOBE_GITHUB_FACTORY_DARK = {
  restBackground:
    DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.surroundingChromeBackground,
  hoverActiveOverlay: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.primaryYellow,
  hoverActiveForeground: FACTORY_DARK_FOUNDATION.accentInk,
} as const;

/** Surface role map entry this chrome surface must follow. */
export const DOCS_CHROME_SEARCH_GLOBE_GITHUB_SURFACE_ROLES =
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.searchGlobeGitHub;

/**
 * Inline hover style for search trigger / header action icons when JS hover
 * state is used (happy-dom / SSR-safe fallback alongside CSS :hover rules).
 */
export function docsChromeSearchGlobeGitHubHoverStyle(
  hovered: boolean,
): CSSProperties | undefined {
  if (!hovered) {
    return undefined;
  }

  return {
    backgroundColor: DOCS_CHROME_SEARCH_GLOBE_GITHUB_TOKENS.hoverActiveOverlay,
    borderColor: DOCS_CHROME_SEARCH_GLOBE_GITHUB_TOKENS.hoverActiveOverlay,
    color: DOCS_CHROME_SEARCH_GLOBE_GITHUB_TOKENS.hoverActiveForeground,
  };
}

/**
 * Shortcut kbd chip colors when the search trigger is hovered/active.
 * Mixes against primary-foreground so chips stay readable on yellow fill.
 */
export function docsChromeSearchKbdHoverStyle(
  hovered: boolean,
): CSSProperties | undefined {
  if (!hovered) {
    return undefined;
  }

  const ink = DOCS_CHROME_SEARCH_GLOBE_GITHUB_TOKENS.hoverActiveForeground;
  return {
    borderColor: `color-mix(in oklch, ${ink} 25%, transparent)`,
    backgroundColor: `color-mix(in oklch, ${ink} 10%, transparent)`,
    color: ink,
  };
}
