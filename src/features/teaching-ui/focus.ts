/**
 * Teaching-ui focus color tokens and resolve helpers.
 *
 * Charts and matrix cells share one accent (secondary blue) vs muted
 * (whitish / on-surface muted) pair per graph-pages focus contract.
 * Values bind to the locked docs-chrome / host semantic CSS vars — do not
 * invent per-recipe hex schemas here.
 *
 * Policy when `focusId` is undefined: every compared id resolves to muted.
 * Accent is returned only on an explicit `id === focusId` match.
 *
 * @see docs/temp/graph-pages/contracts.md (Focus contract)
 */

import { DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS } from "@/lib/theme/docs-chrome-highlighting-tokens";

/** Typed accent (focused) vs muted (non-focused) CSS color pair. */
export type FocusColorTokens = {
  accent: string;
  muted: string;
};

/**
 * Default teaching-ui focus token pair.
 * Accent = site secondary blue; muted = whitish / muted-foreground.
 */
export const DEFAULT_FOCUS_COLOR_TOKENS = {
  accent: DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS.secondaryBlue,
  muted: DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS.mutedWhite,
} as const satisfies FocusColorTokens;

/** Accent CSS color for callers that do not need per-id resolution. */
export const focusFill: string = DEFAULT_FOCUS_COLOR_TOKENS.accent;

/** Muted CSS color for callers that do not need per-id resolution. */
export const mutedFill: string = DEFAULT_FOCUS_COLOR_TOKENS.muted;

/**
 * Resolve fill/stroke for a datum id against an optional focus id.
 *
 * Returns `tokens.accent` when `id` matches `focusId`; otherwise
 * `tokens.muted`. When `focusId` is undefined, all ids resolve to muted.
 */
export function resolveFocusColor(
  id: string,
  focusId: string | undefined,
  tokens: FocusColorTokens,
): string {
  if (focusId !== undefined && id === focusId) {
    return tokens.accent;
  }
  return tokens.muted;
}
