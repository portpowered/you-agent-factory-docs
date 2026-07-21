/**
 * Representative docs chrome highlighting token-map contract.
 *
 * Locks resting vs hover roles across all five chrome surfaces in one place
 * so story-006 regressions stay reviewable without scanning CSS source
 * inventories or route registries. Sidebar also locks selected/active as a
 * muted secondary-blue wash distinct from yellow hover
 * (repair-sidebar-active-muted-secondary-003).
 *
 * Surfaces:
 * 1. search / globe / GitHub
 * 2. TOC (current + non-current)
 * 3. sidebar rows (muted secondary-blue selected wash + wide primary-yellow hover)
 * 4. header text / icons
 * 5. breadcrumb
 */

import {
  DOCS_CHROME_BREADCRUMB_FACTORY_DARK,
  DOCS_CHROME_BREADCRUMB_SURFACE_ROLES,
  DOCS_CHROME_HEADER_FACTORY_DARK,
  DOCS_CHROME_HEADER_SURFACE_ROLES,
} from "@/features/docs/styles/docs-chrome-header-breadcrumb";
import {
  DOCS_CHROME_SEARCH_GLOBE_GITHUB_FACTORY_DARK,
  DOCS_CHROME_SEARCH_GLOBE_GITHUB_SURFACE_ROLES,
} from "@/features/docs/styles/docs-chrome-search-globe-github";
import {
  DOCS_CHROME_SIDEBAR_FACTORY_DARK,
  DOCS_CHROME_SIDEBAR_SURFACE_ROLES,
  DOCS_CHROME_SIDEBAR_TOKENS,
} from "@/features/docs/styles/docs-chrome-sidebar";
import {
  DOCS_CHROME_TOC_CURRENT_SURFACE_ROLES,
  DOCS_CHROME_TOC_FACTORY_DARK,
  DOCS_CHROME_TOC_NON_CURRENT_SURFACE_ROLES,
} from "@/features/docs/styles/docs-chrome-toc";
import {
  DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK,
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES,
  type DocsChromeHighlightingRoleName,
  type DocsChromeHighlightingSurface,
} from "@/lib/theme/docs-chrome-highlighting-tokens";

/** The five reader-facing chrome surfaces covered by the locked token map. */
export const DOCS_CHROME_TOKEN_MAP_SURFACES = [
  "searchGlobeGitHub",
  "toc",
  "sidebarRow",
  "headerTextIcons",
  "breadcrumb",
] as const;

export type DocsChromeTokenMapSurface =
  (typeof DOCS_CHROME_TOKEN_MAP_SURFACES)[number];

export type DocsChromeTokenMapSurfaceExpectation = {
  /** Locked map surface key(s) this reader surface owns. */
  mapSurfaces: readonly DocsChromeHighlightingSurface[];
  /** Resting role(s) visible without hover. */
  restRoles: readonly DocsChromeHighlightingRoleName[];
  /** Hover overlay role (always primary yellow for this map). */
  hoverActiveRole: DocsChromeHighlightingRoleName;
  /** Whether hover paints a fill background or a text/icon overlay. */
  hoverActiveKind: "overlay" | "background";
  /** Factory-dark hex proofs for rest colors (color or background). */
  restProofs: readonly string[];
  /** Factory-dark hex proof for hover primary yellow. */
  hoverActiveProof: string;
  /**
   * Selected/active role at rest (sidebar only). Muted secondary blue —
   * distinct from hover yellow. Omitted on surfaces without a selected wash.
   */
  selectedActiveRole?: DocsChromeHighlightingRoleName;
  /** Factory-dark solid secondary-blue proof for the selected wash base. */
  selectedActiveProof?: string;
  /** CSS token expression for the muted selected wash (`color-mix` …). */
  selectedActiveBackgroundToken?: string;
};

/**
 * Observable resting vs hover expectations for all five surfaces.
 * Sidebar also encodes selected/active secondary-blue wash (not yellow).
 * Proofs resolve through the locked factory-dark chrome hex map.
 */
export const DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS = {
  searchGlobeGitHub: {
    mapSurfaces: ["searchGlobeGitHub"],
    restRoles: ["surroundingChromeBackground"],
    hoverActiveRole: "primaryYellow",
    hoverActiveKind: "overlay",
    restProofs: [DOCS_CHROME_SEARCH_GLOBE_GITHUB_FACTORY_DARK.restBackground],
    hoverActiveProof:
      DOCS_CHROME_SEARCH_GLOBE_GITHUB_FACTORY_DARK.hoverActiveOverlay,
  },
  toc: {
    mapSurfaces: ["tocCurrent", "tocNonCurrent"],
    restRoles: ["secondaryBlue", "mutedWhite"],
    hoverActiveRole: "primaryYellow",
    hoverActiveKind: "overlay",
    restProofs: [
      DOCS_CHROME_TOC_FACTORY_DARK.currentRest,
      DOCS_CHROME_TOC_FACTORY_DARK.nonCurrentRest,
    ],
    hoverActiveProof: DOCS_CHROME_TOC_FACTORY_DARK.hoverOverlay,
  },
  sidebarRow: {
    mapSurfaces: ["sidebarRow"],
    restRoles: ["white"],
    hoverActiveRole: "primaryYellow",
    hoverActiveKind: "background",
    restProofs: [DOCS_CHROME_SIDEBAR_FACTORY_DARK.restText],
    hoverActiveProof: DOCS_CHROME_SIDEBAR_FACTORY_DARK.hoverBackground,
    selectedActiveRole: "secondaryBlue",
    selectedActiveProof: DOCS_CHROME_SIDEBAR_FACTORY_DARK.activeBackground,
    selectedActiveBackgroundToken: DOCS_CHROME_SIDEBAR_TOKENS.activeBackground,
  },
  headerTextIcons: {
    mapSurfaces: ["headerTextIcons"],
    restRoles: ["white"],
    hoverActiveRole: "primaryYellow",
    hoverActiveKind: "overlay",
    restProofs: [DOCS_CHROME_HEADER_FACTORY_DARK.restText],
    hoverActiveProof: DOCS_CHROME_HEADER_FACTORY_DARK.hoverOverlay,
  },
  breadcrumb: {
    mapSurfaces: ["breadcrumb"],
    restRoles: ["mutedWhite"],
    hoverActiveRole: "primaryYellow",
    hoverActiveKind: "overlay",
    restProofs: [DOCS_CHROME_BREADCRUMB_FACTORY_DARK.restText],
    hoverActiveProof: DOCS_CHROME_BREADCRUMB_FACTORY_DARK.hoverOverlay,
  },
} as const satisfies Record<
  DocsChromeTokenMapSurface,
  DocsChromeTokenMapSurfaceExpectation
>;

/**
 * Per-surface role bindings must match the locked highlighting map and the
 * individual chrome surface modules (search, TOC, sidebar, header, breadcrumb).
 */
export function assertDocsChromeTokenMapSurfaceRolesAligned(): {
  searchGlobeGitHub: typeof DOCS_CHROME_SEARCH_GLOBE_GITHUB_SURFACE_ROLES;
  tocCurrent: typeof DOCS_CHROME_TOC_CURRENT_SURFACE_ROLES;
  tocNonCurrent: typeof DOCS_CHROME_TOC_NON_CURRENT_SURFACE_ROLES;
  sidebarRow: typeof DOCS_CHROME_SIDEBAR_SURFACE_ROLES;
  headerTextIcons: typeof DOCS_CHROME_HEADER_SURFACE_ROLES;
  breadcrumb: typeof DOCS_CHROME_BREADCRUMB_SURFACE_ROLES;
} {
  return {
    searchGlobeGitHub: DOCS_CHROME_SEARCH_GLOBE_GITHUB_SURFACE_ROLES,
    tocCurrent: DOCS_CHROME_TOC_CURRENT_SURFACE_ROLES,
    tocNonCurrent: DOCS_CHROME_TOC_NON_CURRENT_SURFACE_ROLES,
    sidebarRow: DOCS_CHROME_SIDEBAR_SURFACE_ROLES,
    headerTextIcons: DOCS_CHROME_HEADER_SURFACE_ROLES,
    breadcrumb: DOCS_CHROME_BREADCRUMB_SURFACE_ROLES,
  };
}

/** Factory-dark hex proofs for the five locked map roles. */
export const DOCS_CHROME_TOKEN_MAP_FACTORY_DARK_PROOFS = {
  surroundingChromeBackground:
    DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.surroundingChromeBackground,
  primaryYellow: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.primaryYellow,
  secondaryBlue: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.secondaryBlue,
  white: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.white,
  mutedWhite: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.mutedWhite,
} as const;

/** Canonical locked surface role map (shared theme module). */
export const DOCS_CHROME_TOKEN_MAP_LOCKED_SURFACE_ROLES =
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES;
