/**
 * Comparative-chart focus presentation tokens.
 *
 * Accent = factory-dark primary yellow; muted = muted whitish secondary ink.
 * Matches the graph-pages focus contract so later teaching-ui recipes can
 * converge without changing chart public props.
 */

export const COMPARATIVE_CHART_FOCUS_COLORS = {
  accent: "#f5c76f",
  muted: "#8aaeb8",
} as const;

export type ComparativeChartFocusColors = {
  accent: string;
  muted: string;
};

/**
 * Resolve series (or category) color against an optional focus id.
 * When `focusId` is omitted, returns accent so default presentation stays usable.
 */
export function resolveFocusColor(
  id: string,
  focusId: string | undefined,
  colors: ComparativeChartFocusColors = COMPARATIVE_CHART_FOCUS_COLORS,
): string {
  if (focusId === undefined) {
    return colors.accent;
  }
  return id === focusId ? colors.accent : colors.muted;
}

export type ResolveBarFillArgs = {
  seriesId: string;
  categoryId: string;
  focusSeriesId?: string;
  focusCategoryId?: string;
  colors?: ComparativeChartFocusColors;
};

/**
 * Resolve a grouped-bar fill for series + optional category focus.
 * Non-focused series stay muted; focused series stays accent unless a category
 * focus further mutes sibling categories within that series.
 */
export function resolveBarFill({
  seriesId,
  categoryId,
  focusSeriesId,
  focusCategoryId,
  colors = COMPARATIVE_CHART_FOCUS_COLORS,
}: ResolveBarFillArgs): string {
  if (focusSeriesId === undefined) {
    return colors.accent;
  }

  if (seriesId !== focusSeriesId) {
    return colors.muted;
  }

  if (focusCategoryId === undefined) {
    return colors.accent;
  }

  return categoryId === focusCategoryId ? colors.accent : colors.muted;
}
