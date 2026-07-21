/**
 * Shared Tailwind classes for non-prose bulletless list surfaces and card-style
 * resource links used across home browse, docs index, tags index, and tag resources.
 */

/**
 * Removes list markers and resets prose list inset.
 * DocsBody `prose` applies `padding-inline-start` to `ul`/`ol`; `list-none` alone
 * does not clear that, so card stacks (home Browse, indexes) would drift inward.
 * Zero the start padding at the source — do not compensate with negative margins.
 */
export const bulletlessListMarkersClassName = "list-none ps-0";

/** Base flex column list without markers. Pair with a margin-top utility. */
export const bulletlessListBaseClassName = `flex ${bulletlessListMarkersClassName} flex-col gap-3`;

export type BulletlessListMargin = "mt-3" | "mt-4" | "mt-8";

export function bulletlessListClassName(
  marginTop: BulletlessListMargin = "mt-3",
): string {
  return `${marginTop} ${bulletlessListBaseClassName}`;
}

/**
 * Marker class for collection resource-card hover chrome.
 * Paired with `docs-resource-card-hover.css` (imported from globals.css).
 */
export const DOCS_RESOURCE_CARD_LINK_MARKER_CLASS = "docs-resource-card-link";

/**
 * Locked hover/focus roles for collection resource cards.
 * Background = primary yellow; foreground = accent ink for contrast on yellow.
 */
export const DOCS_RESOURCE_CARD_HOVER_TOKENS = {
  hoverBackground: "var(--docs-chrome-primary-yellow)",
  hoverBorder: "var(--docs-chrome-primary-yellow)",
  hoverForeground: "var(--primary-foreground)",
} as const;

/**
 * Card-style resource link used on browse and index surfaces.
 * Explicit no-underline utilities override Fumadocs prose/link defaults inside DocsBody.
 * Hover/focus-visible yellow fill + dark text live in docs-resource-card-hover.css
 * so child `text-*` utilities yield without per-page one-off hover classes.
 */
export const docsResourceCardLinkClassName = `${DOCS_RESOURCE_CARD_LINK_MARKER_CLASS} group block rounded-lg border border-border bg-card/40 p-4 no-underline transition-colors hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`;

/** Bulletless /search inline results list with bordered row dividers. */
export const searchInlineResultsListClassName = `${bulletlessListMarkersClassName} divide-y divide-border rounded-lg border border-border`;
