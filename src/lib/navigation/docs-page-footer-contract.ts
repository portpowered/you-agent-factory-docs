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

/**
 * Production Tailwind bundles the footer no-text-recolor rules as a single
 * #nd-page selector chain with escaped hover utility class names.
 *
 * Expects: hover/focus keeps background affordance, neutralizes title color
 * (color:inherit), and keeps muted sublabels muted — not accent-foreground.
 */
export function bundledCssHasFooterSublabelInheritRule(css: string): boolean {
  const normalized = normalizeBundledCss(css);
  const hasAccentHoverSelector =
    normalized.includes('a[class*="hover:bg-fd-accent"]') ||
    normalized.includes("a[class*=hover\\:bg-fd-accent]") ||
    normalized.includes("a[class*=hover:bg-fd-accent]");
  const hasAccentForegroundSelector =
    normalized.includes('[class*="hover:text-fd-accent-foreground"]') ||
    normalized.includes("[class*=hover\\:text-fd-accent-foreground]") ||
    normalized.includes("[class*=hover:text-fd-accent-foreground]");
  const hasStableTitleColorRule =
    normalized.includes("{color:inherit!important}") ||
    normalized.includes("{color:inherit}");
  const hasMutedSublabelRule =
    normalized.includes(
      ">p.text-fd-muted-foreground{color:var(--color-fd-muted-foreground)!important}",
    ) ||
    normalized.includes(
      ">p.text-fd-muted-foreground{color:var(--color-fd-muted-foreground)}",
    );
  const forcesAccentForegroundText =
    normalized.includes("color:var(--color-fd-accent-foreground)") ||
    normalized.includes("color:var(--color-fd-accent-foreground)!important");

  return (
    normalized.includes("#nd-page") &&
    hasAccentHoverSelector &&
    hasAccentForegroundSelector &&
    normalized.includes(":is(:hover,:focus-visible)") &&
    hasStableTitleColorRule &&
    hasMutedSublabelRule &&
    !forcesAccentForegroundText
  );
}

/**
 * Returns a failure reason when bundled app CSS lacks the footer no-text-recolor
 * hover/focus pairing enforced by built HTML/CSS convergence checks.
 */
export function assertDocsFooterSublabelHoverFocusCssConvergence(
  css: string,
): string | null {
  if (bundledCssHasFooterSublabelInheritRule(css)) {
    return null;
  }

  return "bundled app CSS missing footer hover/focus no-text-recolor rule pairing";
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
