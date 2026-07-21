/**
 * Table-row focus presentation helpers for teaching-ui tables.
 *
 * Shares the graph-pages accent/muted token pair (secondary blue vs muted
 * whitish) used by teaching-ui focus helpers. When `focusRowId` is set, the
 * matching row is accent and siblings are muted; when unset, rows stay neutral.
 *
 * @see docs/temp/graph-pages/contracts.md (Focus contract)
 */

import { DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS } from "@/lib/theme/docs-chrome-highlighting-tokens";

/** Accent (focused) vs muted (non-focused) CSS color pair for table rows. */
export type TableFocusColorTokens = {
  accent: string;
  muted: string;
};

/**
 * Default table focus tokens — same CSS vars as teaching-ui `focus.ts`.
 * Accent = site secondary blue; muted = whitish / muted-foreground.
 */
export const TABLE_FOCUS_COLOR_TOKENS = {
  accent: DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS.secondaryBlue,
  muted: DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS.mutedWhite,
} as const satisfies TableFocusColorTokens;

export type TableRowFocusState = "accent" | "muted" | "neutral";

/** Stable class markers for accent / muted / neutral row presentation. */
export const TABLE_ROW_FOCUS_CLASS = {
  accent:
    "teaching-ui-focus-accent bg-[color-mix(in_oklch,var(--secondary)_18%,transparent)] text-foreground",
  muted: "teaching-ui-focus-muted text-muted-foreground opacity-70",
  neutral: "teaching-ui-focus-neutral",
} as const;

/**
 * Resolve a table row's focus presentation against an optional focus row id.
 *
 * When `focusRowId` is undefined, every row is neutral (no accent/mute).
 * When set, the matching row is accent and all other rows are muted.
 */
export function resolveTableRowFocusState(
  rowId: string,
  focusRowId: string | undefined,
): TableRowFocusState {
  if (focusRowId === undefined) {
    return "neutral";
  }
  return rowId === focusRowId ? "accent" : "muted";
}

/**
 * Resolve DataTable `rowClassName` for focus accent vs muted presentation.
 */
export function resolveTableRowFocusClassName(
  rowId: string,
  focusRowId: string | undefined,
): string {
  return TABLE_ROW_FOCUS_CLASS[resolveTableRowFocusState(rowId, focusRowId)];
}

/**
 * Resolve a CSS color for a row id (useful for style proofs / matrix cells).
 * Neutral (no focus) returns muted so callers still get a defined token.
 */
export function resolveTableFocusColor(
  rowId: string,
  focusRowId: string | undefined,
  tokens: TableFocusColorTokens = TABLE_FOCUS_COLOR_TOKENS,
): string {
  if (focusRowId !== undefined && rowId === focusRowId) {
    return tokens.accent;
  }
  return tokens.muted;
}
