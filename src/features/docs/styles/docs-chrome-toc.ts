/**
 * Shared “On this page” TOC chrome highlighting contract.
 *
 * Locked map (story repair-chrome-highlighting-token-map-003):
 * - current item = secondary blue
 * - non-current items = muted white
 * - hover = primary yellow overlay
 *
 * Consume `--docs-chrome-*` roles from `docs-chrome-highlighting-tokens.ts`
 * via `docs-chrome-toc.css` / `globals.css`. Do not leave Fumadocs defaults
 * (`data-[active=true]:text-fd-primary`, `hover:text-fd-accent-foreground`)
 * owning TOC colors.
 */

import {
  DOCS_CHROME_HIGHLIGHTING_CSS_VARS,
  DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK,
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES,
} from "@/lib/theme/docs-chrome-highlighting-tokens";

/**
 * Right-rail and popover TOC item anchors. Matches Fumadocs `#nd-toc` and
 * `[data-toc-popover]` item links that set `data-active="true"` when current.
 */
export const DOCS_CHROME_TOC_ITEM_SELECTOR =
  '#nd-toc a[href^="#"], [data-toc-popover] a[href^="#"]';

/** Current (active) TOC item. */
export const DOCS_CHROME_TOC_CURRENT_SELECTOR = `${DOCS_CHROME_TOC_ITEM_SELECTOR}[data-active="true"]`;

/** Non-current TOC items. */
export const DOCS_CHROME_TOC_NON_CURRENT_SELECTOR = `${DOCS_CHROME_TOC_ITEM_SELECTOR}:not([data-active="true"])`;

/**
 * Active-track thumb beside the TOC list (Fumadocs `bg-fd-primary` bar).
 * Retarget to secondary blue so the current marker matches current text.
 */
export const DOCS_CHROME_TOC_THUMB_SELECTOR =
  "#nd-toc .bg-fd-primary, [data-toc-popover] .bg-fd-primary";

/**
 * Semantic CSS values for TOC rest vs hover overlay.
 * Color roles only — hover is a text overlay, not a fill background.
 */
export const DOCS_CHROME_TOC_TOKENS = {
  currentRest: `var(${DOCS_CHROME_HIGHLIGHTING_CSS_VARS.secondaryBlue})`,
  nonCurrentRest: `var(${DOCS_CHROME_HIGHLIGHTING_CSS_VARS.mutedWhite})`,
  hoverOverlay: `var(${DOCS_CHROME_HIGHLIGHTING_CSS_VARS.primaryYellow})`,
  focusRing: "var(--ring)",
} as const;

/** Factory-dark hex proofs for TOC current / non-current / hover. */
export const DOCS_CHROME_TOC_FACTORY_DARK = {
  currentRest: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.secondaryBlue,
  nonCurrentRest: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.mutedWhite,
  hoverOverlay: DOCS_CHROME_HIGHLIGHTING_FACTORY_DARK.primaryYellow,
} as const;

/** Surface role map entries this chrome surface must follow. */
export const DOCS_CHROME_TOC_CURRENT_SURFACE_ROLES =
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.tocCurrent;

export const DOCS_CHROME_TOC_NON_CURRENT_SURFACE_ROLES =
  DOCS_CHROME_HIGHLIGHTING_SURFACE_ROLES.tocNonCurrent;
