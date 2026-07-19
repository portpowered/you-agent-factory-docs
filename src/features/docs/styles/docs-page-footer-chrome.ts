/**
 * Selector contract for Fumadocs DocsPage previous/next footer cards.
 * Keep in sync with docs-page-footer-chrome.css.
 */
export const docsPageFooterCardSelector =
  '#nd-page a[class*="hover:bg-fd-accent"][class*="hover:text-fd-accent-foreground"]';

/** Hover/focus card state where title text must not recolor. */
export const docsPageFooterStableTextColorSelector = `${docsPageFooterCardSelector}:is(:hover, :focus-visible)`;

/** Muted Previous/Next sublabel must keep muted color on hover/focus. */
export const docsPageFooterMutedSublabelSelector = `${docsPageFooterStableTextColorSelector} > p.text-fd-muted-foreground`;

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
