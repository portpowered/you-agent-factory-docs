/**
 * Production API accent chrome contract for tabs / method badges / status chips.
 *
 * CSS lives in `references-api-accents.css` and remaps Fumadocs primary-yellow
 * utilities under {@link API_THEME_ROOT_ATTR}. Token roles come from
 * `theme-tokens.ts` (`API_ACCENT_TOKEN_CLASSES` / `API_ACCENT_CSS_VARS`).
 */

import { API_ACCENT_CSS_VARS, API_THEME_ROOT_ATTR } from "./theme-tokens";

/** Stylesheet imported by the published API projection (and harness). */
export const API_ACCENT_CHROME_STYLESHEET =
  "@/features/docs/styles/references-api-accents.css" as const;

/** Theme-root attribute the accent CSS scopes under. */
export const API_ACCENT_CHROME_ROOT_ATTR = API_THEME_ROOT_ATTR;

/**
 * Selected / active tab triggers (language tabs + response status chips).
 * Matches Fumadocs TabsTrigger / CodeBlockTabsTrigger role=tab markup.
 */
export const API_ACCENT_TAB_SELECTED_SELECTOR = `[${API_THEME_ROOT_ATTR}] [role="tab"][data-state="active"]`;

/** Quieter / unselected tab triggers. */
export const API_ACCENT_TAB_QUIET_SELECTOR = `[${API_THEME_ROOT_ATTR}] [role="tab"]:not([data-state="active"])`;

/**
 * Fumadocs MethodLabel Tailwind color utilities remapped to secondary under
 * the API theme root. Meaning stays in the uppercase method text.
 */
export const API_ACCENT_METHOD_LABEL_COLOR_CLASSES = [
  "text-green-600",
  "dark:text-green-400",
  "text-blue-600",
  "dark:text-blue-400",
  "text-yellow-600",
  "dark:text-yellow-400",
  "text-orange-600",
  "dark:text-orange-400",
  "text-red-600",
  "dark:text-red-400",
] as const;

/** Selected / emphasis CSS value (secondary blue). */
export const API_ACCENT_CHROME_SELECTED_COLOR = API_ACCENT_CSS_VARS.selected;

/** Quieter / unselected CSS value (muted secondary via muted-foreground). */
export const API_ACCENT_CHROME_QUIET_COLOR = API_ACCENT_CSS_VARS.quiet;
