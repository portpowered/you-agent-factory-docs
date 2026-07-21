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

/**
 * Title underline must stay off at rest and hover (DocsBody/prose underlines
 * anchors). Keep in sync with docsPageFooterTitleTextDecoration.
 */
export const FOOTER_TITLE_TEXT_DECORATION = "none";

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

/** Live family-scoped footer neighbor cards (Fumadocs Footer disabled). */
function bundledCssHasFamilyFooterCardSelector(normalized: string): boolean {
  return (
    normalized.includes("#nd-page") &&
    (normalized.includes('[data-testid="family-docs-footer-neighbors"]') ||
      normalized.includes("[data-testid=family-docs-footer-neighbors]") ||
      normalized.includes('[data-testid=\\"family-docs-footer-neighbors\\"]'))
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
 * Bundled/app CSS must override tall `p-4` / `gap-2` with compact padding and
 * gap on both the accent-hover footer fixture selector and the live
 * family-docs-footer-neighbors surface (docs pages disable Fumadocs Footer).
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
    bundledCssHasFamilyFooterCardSelector(normalized) &&
    hasCompactPadding &&
    hasCompactGap &&
    !reintroducesTallPadding &&
    !reintroducesTallGap
  );
}

/**
 * Bundled/app CSS must strip title underline / border-under-title on both
 * accent-hover and family-docs-footer-neighbors surfaces, while retaining an
 * accessible focus-visible ring (outline + ring box-shadow) on both.
 */
export function bundledCssHasFooterTitleUnderlineAbsenceRule(
  css: string,
): boolean {
  const normalized = normalizeBundledCss(css);
  const hasTextDecorationNone =
    normalized.includes("text-decoration:none!important") ||
    normalized.includes("text-decoration:none;") ||
    normalized.includes("text-decoration-line:none!important") ||
    normalized.includes("text-decoration-line:none;");
  const hasBorderUnderTitleCleared =
    normalized.includes("border-bottom-width:0!important") ||
    normalized.includes("border-bottom-width:0;") ||
    normalized.includes("border-bottom-style:none!important") ||
    normalized.includes("border-bottom-style:none;");
  const hasFocusVisibleRing =
    normalized.includes("a:focus-visible") &&
    (normalized.includes("outline-style:solid!important") ||
      normalized.includes("outline-style:solid;")) &&
    (normalized.includes("outline-width:2px!important") ||
      normalized.includes("outline-width:2px;")) &&
    // normalizeBundledCss collapses spaces, so `0 0 0 2px` becomes `0002px`.
    (normalized.includes("box-shadow:0002pxvar(--ring)!important") ||
      normalized.includes("box-shadow:0002pxvar(--ring)") ||
      normalized.includes("box-shadow:0 0 0 2px var(--ring)!important") ||
      normalized.includes("box-shadow:0 0 0 2px var(--ring)"));
  const reintroducesTitleUnderline =
    normalized.includes("text-decoration:underline!important") ||
    normalized.includes("text-decoration-line:underline!important");

  return (
    bundledCssHasAccentHoverFooterSelector(normalized) &&
    bundledCssHasFamilyFooterCardSelector(normalized) &&
    hasTextDecorationNone &&
    hasBorderUnderTitleCleared &&
    hasFocusVisibleRing &&
    !reintroducesTitleUnderline
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
 * Returns a failure reason when bundled app CSS lacks title underline absence
 * (and retained focus-visible ring) on prev/next footer cards.
 */
export function assertDocsFooterTitleUnderlineAbsenceCssConvergence(
  css: string,
): string | null {
  if (bundledCssHasFooterTitleUnderlineAbsenceRule(css)) {
    return null;
  }

  return "bundled app CSS missing footer title underline absence + focus-ring rule pairing";
}

/**
 * Combined chrome convergence: yellow highlight + dark text on hover/focus,
 * compact card padding/gap, and title underline absence with focus-ring
 * retained — the density + underline polish this lane locks together with #183.
 */
export function assertDocsFooterChromeCssConvergence(
  css: string,
): string | null {
  return (
    assertDocsFooterYellowDarkTextCssConvergence(css) ??
    assertDocsFooterCompactSizingCssConvergence(css) ??
    assertDocsFooterTitleUnderlineAbsenceCssConvergence(css)
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
