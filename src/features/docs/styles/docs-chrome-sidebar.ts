/**
 * Shared docs sidebar row chrome highlighting contract.
 *
 * Locked map (story repair-chrome-highlighting-token-map-004):
 * - resting text = white
 * - hover = primary yellow **background** wide enough to cover outline/padding
 * - active/current remains distinguishable from resting non-current rows
 *
 * Consume `--docs-chrome-*` roles from `docs-chrome-highlighting-tokens.ts`
 * via `docs-chrome-sidebar.css`. Do not leave muted-foreground rest text or
 * accent/surface hover fills owning sidebar rows.
 */

import {
  DOCS_CHROME_HIGHLIGHTING_CSS_VARS,
  DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK,
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES,
} from "@/lib/theme/docs-chrome-highlighting-tokens";
import { FACTORY_DARK_FOUNDATION } from "@/lib/theme/host-semantic-theme-tokens";
import { cn } from "@/lib/utils";

/** Marker class owned by docs-chrome-sidebar.css. */
export const DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS = "docs-chrome-sidebar-row";

/**
 * Shared layout + marker classes for desktop and mobile sidebar rows.
 * Horizontal padding keeps the yellow hover fill visibly wide (covers
 * outline/padding). Color/background roles are enforced in CSS.
 */
export const DOCS_CHROME_SIDEBAR_ROW_CLASSES = cn(
  DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS,
  "relative flex w-full flex-row items-center gap-2 rounded-lg px-2 py-1.5 text-start text-sm whitespace-nowrap transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
);

/**
 * Desktop / drawer sidebar row anchors and folder triggers that participate
 * in the locked highlighting map. Matches `#nd-sidebar` and the mobile drawer
 * aside (`[data-mobile-docs-drawer]`).
 */
export const DOCS_CHROME_SIDEBAR_ROW_SELECTOR = `#nd-sidebar .${DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS}, [data-mobile-docs-drawer] .${DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS}`;

/** Current (active) sidebar row. */
export const DOCS_CHROME_SIDEBAR_ACTIVE_SELECTOR = `${DOCS_CHROME_SIDEBAR_ROW_SELECTOR}[data-active="true"]`;

/** Non-current sidebar rows. */
export const DOCS_CHROME_SIDEBAR_NON_ACTIVE_SELECTOR = `${DOCS_CHROME_SIDEBAR_ROW_SELECTOR}:not([data-active="true"])`;

/**
 * Semantic CSS values for sidebar rest vs hover background.
 * Hover is a fill background, not a text-only recolor.
 */
export const DOCS_CHROME_SIDEBAR_TOKENS = {
  restText: `var(${DOCS_CHROME_HIGHLIGHTING_CSS_VARS.white})`,
  hoverBackground: `var(${DOCS_CHROME_HIGHLIGHTING_CSS_VARS.primaryYellow})`,
  hoverForeground: "var(--primary-foreground)",
  /**
   * Active wash keeps current rows visible at rest without matching full
   * hover yellow. Mix against surrounding chrome so it stays a tint.
   */
  activeBackground: `color-mix(in oklch, var(${DOCS_CHROME_HIGHLIGHTING_CSS_VARS.primaryYellow}) 18%, transparent)`,
  focusRing: "var(--ring)",
} as const;

/** Factory-dark hex proofs for sidebar rest / hover / active. */
export const DOCS_CHROME_SIDEBAR_FACTORY_DARK = {
  restText: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.white,
  hoverBackground: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.primaryYellow,
  hoverForeground: FACTORY_DARK_FOUNDATION.accentInk,
} as const;

/** Surface role map entry this chrome surface must follow. */
export const DOCS_CHROME_SIDEBAR_SURFACE_ROLES =
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.sidebarRow;
