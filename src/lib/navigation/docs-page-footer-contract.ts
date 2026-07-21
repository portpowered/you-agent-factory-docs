export const FOOTER_DIRECTIONAL_SUBLABELS = {
  previous: "Previous Page",
  next: "Next Page",
} as const;

export type FooterDirectionalSublabel =
  (typeof FOOTER_DIRECTIONAL_SUBLABELS)[keyof typeof FOOTER_DIRECTIONAL_SUBLABELS];

/** Extracts the Fumadocs main page region from built route HTML. */
export function extractNdPageHtml(html: string): string {
  const pageStart = html.indexOf('id="nd-page"');
  if (pageStart < 0) {
    return "";
  }

  const tocStart = html.indexOf('id="nd-toc"', pageStart);
  const searchEnd = tocStart > pageStart ? tocStart : html.length;
  return html.slice(pageStart, searchEnd);
}

/** Extracts the footer previous/next card anchor that contains the directional sublabel. */
export function extractFooterCardAnchorHtml(
  ndPageHtml: string,
  sublabel: FooterDirectionalSublabel,
): string {
  const marker = `>${sublabel}<`;
  const sublabelIndex = ndPageHtml.indexOf(marker);
  if (sublabelIndex < 0) {
    return "";
  }

  const anchorStart = ndPageHtml.lastIndexOf("<a ", sublabelIndex);
  const anchorEnd = ndPageHtml.indexOf("</a>", sublabelIndex);
  if (anchorStart < 0 || anchorEnd < 0) {
    return "";
  }

  return ndPageHtml.slice(anchorStart, anchorEnd + "</a>".length);
}

export function footerCardHasAccentHoverClasses(anchorHtml: string): boolean {
  return (
    anchorHtml.includes("hover:bg-fd-accent") &&
    anchorHtml.includes("hover:text-fd-accent-foreground")
  );
}

export function footerCardHasMutedDirectionalSublabel(
  anchorHtml: string,
  sublabel: FooterDirectionalSublabel,
): boolean {
  return (
    anchorHtml.includes('class="text-fd-muted-foreground truncate"') &&
    anchorHtml.includes(sublabel)
  );
}

/** Minified bundled CSS drops whitespace and attribute-selector quotes. */
export function normalizeBundledCss(css: string): string {
  return css.replaceAll(/\s+/g, "").toLowerCase();
}

/** Compact padding expected from docs-page-footer-chrome (beats Fumadocs `p-4`). */
export const FOOTER_COMPACT_PADDING = "0.5rem 0.75rem";

/** Compact gap expected from docs-page-footer-chrome (beats Fumadocs `gap-2`). */
export const FOOTER_COMPACT_GAP = "0.25rem";

function bundledCssHasAccentHoverFooterSelector(normalized: string): boolean {
  const hasAccentHoverSelector =
    normalized.includes('a[class*="hover:bg-fd-accent"]') ||
    normalized.includes("a[class*=hover\\:bg-fd-accent]") ||
    normalized.includes("a[class*=hover:bg-fd-accent]");
  const hasAccentForegroundSelector =
    normalized.includes('[class*="hover:text-fd-accent-foreground"]') ||
    normalized.includes("[class*=hover\\:text-fd-accent-foreground]") ||
    normalized.includes("[class*=hover:text-fd-accent-foreground]");

  return (
    normalized.includes("#nd-page") &&
    hasAccentHoverSelector &&
    hasAccentForegroundSelector
  );
}

/**
 * App CSS footer hover/focus on the Fumadocs accent-hover card selector chain.
 *
 * Expects: primary yellow fill (`--docs-chrome-primary-yellow`) and dark
 * accent-ink text (`--primary-foreground`) — not the superseded color:inherit
 * / muted-sublabel-stable pairing, and not Fumadocs accent-foreground.
 */
export function bundledCssHasFooterYellowDarkTextRule(css: string): boolean {
  const normalized = normalizeBundledCss(css);
  const hasYellowBackground =
    normalized.includes(
      "background-color:var(--docs-chrome-primary-yellow)!important",
    ) ||
    normalized.includes("background-color:var(--docs-chrome-primary-yellow)");
  const hasDarkForeground =
    normalized.includes("color:var(--primary-foreground)!important") ||
    normalized.includes("color:var(--primary-foreground)");
  const forcesAccentForegroundText =
    normalized.includes("color:var(--color-fd-accent-foreground)!important") ||
    normalized.includes("color:var(--color-fd-accent-foreground);") ||
    normalized.includes("color:var(--color-fd-accent-foreground)}");
  const keepsStableInheritOnly =
    (normalized.includes("{color:inherit!important}") ||
      normalized.includes("{color:inherit}")) &&
    !hasDarkForeground;

  return (
    bundledCssHasAccentHoverFooterSelector(normalized) &&
    normalized.includes(":is(:hover,:focus-visible)") &&
    hasYellowBackground &&
    hasDarkForeground &&
    !forcesAccentForegroundText &&
    !keepsStableInheritOnly
  );
}

/**
 * Bundled/app CSS must override Fumadocs tall `p-4` / `gap-2` with compact
 * padding and gap on the same accent-hover footer card selector.
 */
export function bundledCssHasFooterCompactSizingRule(css: string): boolean {
  const normalized = normalizeBundledCss(css);
  const compactPadding = normalizeBundledCss(FOOTER_COMPACT_PADDING);
  const compactGap = normalizeBundledCss(FOOTER_COMPACT_GAP);
  const hasCompactPadding =
    normalized.includes(`padding:${compactPadding}!important`) ||
    normalized.includes(`padding:${compactPadding}`);
  const hasCompactGap =
    normalized.includes(`gap:${compactGap}!important`) ||
    normalized.includes(`gap:${compactGap}`);
  const reintroducesTallPadding =
    normalized.includes("padding:1rem!important") ||
    normalized.includes("padding:1rem;");
  const reintroducesTallGap =
    normalized.includes("gap:0.5rem!important") ||
    normalized.includes("gap:0.5rem;");

  return (
    bundledCssHasAccentHoverFooterSelector(normalized) &&
    hasCompactPadding &&
    hasCompactGap &&
    !reintroducesTallPadding &&
    !reintroducesTallGap
  );
}

/**
 * Returns a failure reason when app CSS lacks footer yellow-highlight +
 * dark-text hover/focus pairing enforced by chrome convergence checks.
 */
export function assertDocsFooterYellowDarkTextCssConvergence(
  css: string,
): string | null {
  if (bundledCssHasFooterYellowDarkTextRule(css)) {
    return null;
  }

  return "bundled app CSS missing footer hover/focus yellow + dark-text rule pairing";
}

/**
 * Returns a failure reason when bundled app CSS lacks compact footer card
 * padding/gap overrides for the accent-hover prev/next cards.
 */
export function assertDocsFooterCompactSizingCssConvergence(
  css: string,
): string | null {
  if (bundledCssHasFooterCompactSizingRule(css)) {
    return null;
  }

  return "bundled app CSS missing footer compact padding/gap rule pairing";
}

/**
 * Combined chrome convergence: yellow highlight + dark text on hover/focus
 * AND compact card padding/gap — the two repairs this lane locks together.
 */
export function assertDocsFooterChromeCssConvergence(
  css: string,
): string | null {
  return (
    assertDocsFooterYellowDarkTextCssConvergence(css) ??
    assertDocsFooterCompactSizingCssConvergence(css)
  );
}

/**
 * Returns a failure reason when built HTML footer cards inside #nd-page do not
 * match the accent-hover anchor and muted directional sublabel contract.
 */
export function assertFooterChromeContract(html: string): string | null {
  const ndPageHtml = extractNdPageHtml(html);
  if (ndPageHtml.length === 0) {
    return "footer #nd-page region missing from built HTML";
  }

  for (const sublabel of Object.values(FOOTER_DIRECTIONAL_SUBLABELS)) {
    const footerCard = extractFooterCardAnchorHtml(ndPageHtml, sublabel);

    if (footerCard.length === 0) {
      return `footer ${sublabel} card missing from #nd-page`;
    }

    if (!footerCardHasAccentHoverClasses(footerCard)) {
      return `footer ${sublabel} card missing accent-hover utility classes`;
    }

    if (!footerCardHasMutedDirectionalSublabel(footerCard, sublabel)) {
      return `footer ${sublabel} card missing muted directional sublabel`;
    }
  }

  return null;
}
