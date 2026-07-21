/**
 * Selector contract for Fumadocs DocsPage previous/next footer cards.
 * Keep in sync with docs-page-footer-chrome.css.
 */
export const docsPageFooterCardSelector =
  '#nd-page a[class*="hover:bg-fd-accent"][class*="hover:text-fd-accent-foreground"]';

/**
 * Live docs Previous/Next cards rendered by FamilyDocsFooterNeighbors
 * (Fumadocs Footer is disabled). Compact density must target this surface.
 * Keep in sync with docs-page-footer-chrome.css.
 */
export const docsPageFooterFamilyCardSelector =
  '#nd-page [data-testid="family-docs-footer-neighbors"] a';

/**
 * Hover/focus card state: primary yellow fill + dark accent-ink text.
 * Same interactive language as collection resource-card hover.
 */
export const docsPageFooterHoverStateSelector = `${docsPageFooterCardSelector}:is(:hover, :focus-visible)`;

/** Directional Previous/Next sublabel under the hover/focus yellow highlight. */
export const docsPageFooterMutedSublabelSelector = `${docsPageFooterHoverStateSelector} > p.text-fd-muted-foreground`;

/**
 * Locked hover/focus roles for docs Previous/Next footer cards.
 * Background = primary yellow; foreground = accent ink for contrast on yellow.
 */
export const DOCS_PAGE_FOOTER_HOVER_TOKENS = {
  hoverBackground: "var(--docs-chrome-primary-yellow)",
  hoverForeground: "var(--primary-foreground)",
} as const;

/**
 * Compact padding override for Fumadocs footer cards (`p-4` = 1rem).
 * Vertical/horizontal rem pair keeps titles + directional sublabels readable.
 * Keep in sync with FOOTER_COMPACT_PADDING in docs-page-footer-contract.
 */
export const docsPageFooterCompactPadding = "0.5rem 0.75rem";

/**
 * Compact flex gap override for Fumadocs footer cards (`gap-2` = 0.5rem).
 * Keep in sync with FOOTER_COMPACT_GAP in docs-page-footer-contract.
 */
export const docsPageFooterCompactGap = "0.25rem";

/**
 * Title underline must stay off at rest and hover (prose/DocsBody underlines
 * anchors). Keep in sync with FOOTER_TITLE_TEXT_DECORATION in
 * docs-page-footer-contract and docs-page-footer-chrome.css.
 */
export const docsPageFooterTitleTextDecoration = "none";
