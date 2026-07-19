/**
 * Locked docs chrome highlighting token map.
 *
 * Source of truth for resting vs hover/active roles across search, globe,
 * GitHub, TOC, sidebar, header, and breadcrumb. Values resolve through host
 * shadcn semantic tokens → factory-dark foundation keys — do not scatter
 * one-off hex values across page trees.
 *
 * Keep CSS custom properties in `src/app/globals.css` aligned with
 * {@link DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS}.
 *
 * @see docs/temp/meta-files/implementation-issues.md (Chrome highlighting token map)
 */

import {
  FACTORY_DARK_FOUNDATION,
  type HostSemanticThemeTokenName,
} from "@/lib/theme/host-semantic-theme-tokens";

/** Locked map role names used by docs chrome controls. */
export const DOCS_CHROME_HIGHLIGHTING_ROLE_NAMES = [
  "surroundingChromeBackground",
  "primaryYellow",
  "secondaryBlue",
  "white",
  "mutedWhite",
] as const;

export type DocsChromeHighlightingRoleName =
  (typeof DOCS_CHROME_HIGHLIGHTING_ROLE_NAMES)[number];

/**
 * CSS custom-property names for the locked chrome highlighting roles.
 * Defined on `:root` in `src/app/globals.css`.
 */
export const DOCS_CHROME_HIGHLIGHTING_CSS_VARS = {
  surroundingChromeBackground: "--docs-chrome-surrounding-background",
  primaryYellow: "--docs-chrome-primary-yellow",
  secondaryBlue: "--docs-chrome-secondary-blue",
  white: "--docs-chrome-white",
  mutedWhite: "--docs-chrome-muted-white",
} as const satisfies Record<
  DocsChromeHighlightingRoleName,
  `--docs-chrome-${string}`
>;

/**
 * Host semantic token each chrome role binds to.
 * Primary yellow is `--primary` (foundation accent), not accent-strong.
 */
export const DOCS_CHROME_HIGHLIGHTING_HOST_BINDINGS = {
  surroundingChromeBackground: "background",
  primaryYellow: "primary",
  secondaryBlue: "secondary",
  white: "foreground",
  mutedWhite: "muted-foreground",
} as const satisfies Record<
  DocsChromeHighlightingRoleName,
  HostSemanticThemeTokenName
>;

/** CSS `var(...)` expressions written into `globals.css` `:root`. */
export const DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS = {
  surroundingChromeBackground: "var(--background)",
  primaryYellow: "var(--primary)",
  secondaryBlue: "var(--secondary)",
  white: "var(--foreground)",
  mutedWhite: "var(--muted-foreground)",
} as const satisfies Record<DocsChromeHighlightingRoleName, string>;

/**
 * Concrete factory-dark hex proofs for the locked roles.
 * Matches resolved host semantic tokens on `data-color-palette="factory-dark"`.
 */
export const DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK = {
  surroundingChromeBackground: FACTORY_DARK_FOUNDATION.background,
  primaryYellow: FACTORY_DARK_FOUNDATION.accent,
  secondaryBlue: FACTORY_DARK_FOUNDATION.secondaryAccent,
  white: FACTORY_DARK_FOUNDATION.ink,
  mutedWhite: FACTORY_DARK_FOUNDATION.secondaryAccentInk,
} as const satisfies Record<DocsChromeHighlightingRoleName, string>;

/** Docs chrome surfaces covered by the locked highlighting token map. */
export const DOCS_CHROME_HIGHLIGHTING_SURFACES = [
  "searchGlobeGitHub",
  "tocCurrent",
  "tocNonCurrent",
  "sidebarRow",
  "headerTextIcons",
  "breadcrumb",
] as const;

export type DocsChromeHighlightingSurface =
  (typeof DOCS_CHROME_HIGHLIGHTING_SURFACES)[number];

/**
 * Per-surface default and hover/active overlay roles from the locked map.
 * Sidebar hover is a primary-yellow **background** (not text-only recolor).
 */
export const DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES = {
  searchGlobeGitHub: {
    default: "surroundingChromeBackground",
    hoverActive: "primaryYellow",
    hoverActiveKind: "overlay",
  },
  tocCurrent: {
    default: "secondaryBlue",
    hoverActive: "primaryYellow",
    hoverActiveKind: "overlay",
  },
  tocNonCurrent: {
    default: "mutedWhite",
    hoverActive: "primaryYellow",
    hoverActiveKind: "overlay",
  },
  sidebarRow: {
    default: "white",
    hoverActive: "primaryYellow",
    hoverActiveKind: "background",
  },
  headerTextIcons: {
    default: "white",
    hoverActive: "primaryYellow",
    hoverActiveKind: "overlay",
  },
  breadcrumb: {
    default: "mutedWhite",
    hoverActive: "primaryYellow",
    hoverActiveKind: "overlay",
  },
} as const satisfies Record<
  DocsChromeHighlightingSurface,
  {
    default: DocsChromeHighlightingRoleName;
    hoverActive: DocsChromeHighlightingRoleName;
    hoverActiveKind: "overlay" | "background";
  }
>;

/**
 * Resolve locked chrome roles to concrete CSS color values for factory-dark.
 */
export function resolveDocsChromeHighlightingTokens(
  factoryDark: typeof DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK = DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK,
): Record<DocsChromeHighlightingRoleName, string> {
  return { ...factoryDark };
}
