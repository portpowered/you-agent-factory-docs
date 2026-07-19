/**
 * Shared docs header text/icons + breadcrumb chrome highlighting contract.
 *
 * Locked map (story repair-chrome-highlighting-token-map-005):
 * - header text/icons: rest = white; hover/active = primary yellow overlay
 * - breadcrumb: rest = muted white; hover = primary yellow overlay
 *
 * Consume `--docs-chrome-*` roles from `docs-chrome-highlighting-tokens.ts`
 * via `docs-chrome-header-breadcrumb.css`. Do not leave muted-foreground /
 * foreground hover owning these chrome surfaces.
 */

import {
  DOCS_CHROME_HIGHLIGHTING_CSS_VARS,
  DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK,
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES,
} from "@/lib/theme/docs-chrome-highlighting-tokens";
import { cn } from "@/lib/utils";

/** Marker class owned by docs-chrome-header-breadcrumb.css for header text. */
export const DOCS_CHROME_HEADER_TEXT_MARKER_CLASS = "docs-chrome-header-text";

/** Marker class for header icon controls (e.g. mobile menu). */
export const DOCS_CHROME_HEADER_ICON_MARKER_CLASS = "docs-chrome-header-icon";

/** Marker class for interactive breadcrumb links. */
export const DOCS_CHROME_BREADCRUMB_LINK_MARKER_CLASS =
  "docs-chrome-breadcrumb-link";

/** Marker class for the current (non-link) breadcrumb page crumb. */
export const DOCS_CHROME_BREADCRUMB_PAGE_MARKER_CLASS =
  "docs-chrome-breadcrumb-page";

/**
 * Shared layout + marker classes for header brand and primary-nav text links.
 * Color roles are enforced in CSS.
 */
export const DOCS_CHROME_HEADER_TEXT_CLASSES = cn(
  DOCS_CHROME_HEADER_TEXT_MARKER_CLASS,
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

/**
 * Shared layout + marker classes for header icon buttons (menu control).
 * Search / globe / GitHub stay on the story-002 fill contract.
 */
export const DOCS_CHROME_HEADER_ICON_CLASSES = cn(
  DOCS_CHROME_HEADER_ICON_MARKER_CLASS,
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

/**
 * Shared typography + marker classes for breadcrumb links.
 * Rest/hover colors are enforced in CSS.
 */
export const DOCS_CHROME_BREADCRUMB_LINK_CLASSES = cn(
  DOCS_CHROME_BREADCRUMB_LINK_MARKER_CLASS,
  "text-xs font-medium uppercase tracking-[0.18em] transition-colors",
);

/**
 * Shared typography + marker classes for the current breadcrumb page crumb.
 */
export const DOCS_CHROME_BREADCRUMB_PAGE_CLASSES = cn(
  DOCS_CHROME_BREADCRUMB_PAGE_MARKER_CLASS,
  "text-xs font-medium uppercase tracking-[0.18em]",
);

/** Header brand + primary-nav text links inside the docs header shell. */
export const DOCS_CHROME_HEADER_TEXT_SELECTOR = `header .${DOCS_CHROME_HEADER_TEXT_MARKER_CLASS}`;

/** Header icon controls inside the docs header shell. */
export const DOCS_CHROME_HEADER_ICON_SELECTOR = `header .${DOCS_CHROME_HEADER_ICON_MARKER_CLASS}`;

/** Interactive breadcrumb anchors. */
export const DOCS_CHROME_BREADCRUMB_LINK_SELECTOR = `nav[aria-label="breadcrumb"] .${DOCS_CHROME_BREADCRUMB_LINK_MARKER_CLASS}`;

/** Current breadcrumb page crumb. */
export const DOCS_CHROME_BREADCRUMB_PAGE_SELECTOR = `nav[aria-label="breadcrumb"] .${DOCS_CHROME_BREADCRUMB_PAGE_MARKER_CLASS}`;

/**
 * Semantic CSS values for header text/icon rest vs hover overlay.
 * Color roles only — hover is a text/icon overlay, not a fill background.
 */
export const DOCS_CHROME_HEADER_TOKENS = {
  restText: `var(${DOCS_CHROME_HIGHLIGHTING_CSS_VARS.white})`,
  hoverOverlay: `var(${DOCS_CHROME_HIGHLIGHTING_CSS_VARS.primaryYellow})`,
  focusRing: "var(--ring)",
} as const;

/**
 * Semantic CSS values for breadcrumb rest vs hover overlay.
 */
export const DOCS_CHROME_BREADCRUMB_TOKENS = {
  restText: `var(${DOCS_CHROME_HIGHLIGHTING_CSS_VARS.mutedWhite})`,
  hoverOverlay: `var(${DOCS_CHROME_HIGHLIGHTING_CSS_VARS.primaryYellow})`,
  focusRing: "var(--ring)",
} as const;

/** Factory-dark hex proofs for header text/icons. */
export const DOCS_CHROME_HEADER_FACTORY_DARK = {
  restText: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.white,
  hoverOverlay: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.primaryYellow,
} as const;

/** Factory-dark hex proofs for breadcrumb. */
export const DOCS_CHROME_BREADCRUMB_FACTORY_DARK = {
  restText: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.mutedWhite,
  hoverOverlay: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.primaryYellow,
} as const;

/** Surface role map entries these chrome surfaces must follow. */
export const DOCS_CHROME_HEADER_SURFACE_ROLES =
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.headerTextIcons;

export const DOCS_CHROME_BREADCRUMB_SURFACE_ROLES =
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.breadcrumb;
