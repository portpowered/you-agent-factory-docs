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
