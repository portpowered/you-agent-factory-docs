import { describe, expect, test } from "bun:test";
import {
  assertDocsFooterChromeCssConvergence,
  assertDocsFooterCompactSizingCssConvergence,
  assertDocsFooterSublabelHoverFocusCssConvergence,
  assertFooterChromeContract,
  bundledCssHasFooterCompactSizingRule,
  bundledCssHasFooterSublabelInheritRule,
  extractFooterCardAnchorHtml,
  extractNdPageHtml,
  FOOTER_COMPACT_GAP,
  FOOTER_COMPACT_PADDING,
  FOOTER_DIRECTIONAL_SUBLABELS,
  footerCardHasAccentHoverClasses,
  footerCardHasMutedDirectionalSublabel,
} from "@/lib/navigation/docs-page-footer-contract";

const SAMPLE_ND_PAGE_HTML = `
<div id="nd-page">
  <article>Token glossary body</article>
  <div class="@container grid gap-4 grid-cols-2">
    <a class="flex flex-col gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-fd-accent/80 hover:text-fd-accent-foreground" href="/docs/glossary/scaling-law">
      <div class="inline-flex items-center gap-1.5 font-medium"><p>Scaling Law</p></div>
      <p class="text-fd-muted-foreground truncate">Previous Page</p>
    </a>
    <a class="flex flex-col gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-fd-accent/80 hover:text-fd-accent-foreground text-end" href="/docs/concepts/embedding">
      <div class="inline-flex items-center gap-1.5 font-medium flex-row-reverse"><p>Embedding</p></div>
      <p class="text-fd-muted-foreground truncate">Next Page</p>
    </a>
  </div>
</div>
<div id="nd-toc"></div>
`;

describe("docs page footer contract", () => {
  test("extractNdPageHtml scopes to the main page region before nd-toc", () => {
    const ndPage = extractNdPageHtml(SAMPLE_ND_PAGE_HTML);
    expect(ndPage).toContain('id="nd-page"');
    expect(ndPage).toContain("Previous Page");
    expect(ndPage).toContain("Next Page");
    expect(ndPage).not.toContain('id="nd-toc"');
  });

  test("extractFooterCardAnchorHtml returns accent-hover anchors for both directions", () => {
    const ndPage = extractNdPageHtml(SAMPLE_ND_PAGE_HTML);

    const previousCard = extractFooterCardAnchorHtml(
      ndPage,
      FOOTER_DIRECTIONAL_SUBLABELS.previous,
    );
    const nextCard = extractFooterCardAnchorHtml(
      ndPage,
      FOOTER_DIRECTIONAL_SUBLABELS.next,
    );

    expect(previousCard).toContain("hover:bg-fd-accent");
    expect(previousCard).toContain("hover:text-fd-accent-foreground");
    expect(previousCard).toContain("Previous Page");

    expect(nextCard).toContain("hover:bg-fd-accent");
    expect(nextCard).toContain("hover:text-fd-accent-foreground");
    expect(nextCard).toContain("Next Page");
  });

  test("footer card helpers detect accent-hover classes and muted sublabels", () => {
    const ndPage = extractNdPageHtml(SAMPLE_ND_PAGE_HTML);
    const previousCard = extractFooterCardAnchorHtml(
      ndPage,
      FOOTER_DIRECTIONAL_SUBLABELS.previous,
    );

    expect(footerCardHasAccentHoverClasses(previousCard)).toBe(true);
    expect(
      footerCardHasMutedDirectionalSublabel(
        previousCard,
        FOOTER_DIRECTIONAL_SUBLABELS.previous,
      ),
    ).toBe(true);
  });

  test("bundledCssHasFooterSublabelInheritRule matches production no-text-recolor selector chain", () => {
    const bundledCss = `
      #nd-page a[class*=hover\\:bg-fd-accent][class*=hover\\:text-fd-accent-foreground]:is(:hover,:focus-visible){color:inherit!important}
      #nd-page a[class*=hover\\:bg-fd-accent][class*=hover\\:text-fd-accent-foreground]:is(:hover,:focus-visible)>p.text-fd-muted-foreground{color:var(--color-fd-muted-foreground)!important}
    `;

    expect(bundledCssHasFooterSublabelInheritRule(bundledCss)).toBe(true);
  });

  test("bundledCssHasFooterCompactSizingRule matches compact padding/gap overrides", () => {
    const bundledCss = `
      #nd-page a[class*=hover\\:bg-fd-accent][class*=hover\\:text-fd-accent-foreground]{padding:${FOOTER_COMPACT_PADDING}!important;gap:${FOOTER_COMPACT_GAP}!important}
    `;

    expect(bundledCssHasFooterCompactSizingRule(bundledCss)).toBe(true);
    expect(assertDocsFooterCompactSizingCssConvergence(bundledCss)).toBeNull();
  });

  test("assertDocsFooterChromeCssConvergence requires both no-text-recolor and compact sizing", () => {
    const bothRepairsCss = `
      #nd-page a[class*=hover\\:bg-fd-accent][class*=hover\\:text-fd-accent-foreground]{padding:${FOOTER_COMPACT_PADDING}!important;gap:${FOOTER_COMPACT_GAP}!important}
      #nd-page a[class*=hover\\:bg-fd-accent][class*=hover\\:text-fd-accent-foreground]:is(:hover,:focus-visible){color:inherit!important}
      #nd-page a[class*=hover\\:bg-fd-accent][class*=hover\\:text-fd-accent-foreground]:is(:hover,:focus-visible)>p.text-fd-muted-foreground{color:var(--color-fd-muted-foreground)!important}
    `;

    expect(assertDocsFooterChromeCssConvergence(bothRepairsCss)).toBeNull();

    const missingCompact = `
      #nd-page a[class*=hover\\:bg-fd-accent][class*=hover\\:text-fd-accent-foreground]:is(:hover,:focus-visible){color:inherit!important}
      #nd-page a[class*=hover\\:bg-fd-accent][class*=hover\\:text-fd-accent-foreground]:is(:hover,:focus-visible)>p.text-fd-muted-foreground{color:var(--color-fd-muted-foreground)!important}
    `;
    expect(assertDocsFooterChromeCssConvergence(missingCompact)).toContain(
      "missing footer compact padding/gap",
    );

    const missingInherit = `
      #nd-page a[class*=hover\\:bg-fd-accent][class*=hover\\:text-fd-accent-foreground]{padding:${FOOTER_COMPACT_PADDING}!important;gap:${FOOTER_COMPACT_GAP}!important}
    `;
    expect(assertDocsFooterChromeCssConvergence(missingInherit)).toContain(
      "missing footer hover/focus no-text-recolor",
    );
  });

  test("assertDocsFooterSublabelHoverFocusCssConvergence returns reason when no-text-recolor rule is missing", () => {
    expect(
      assertDocsFooterSublabelHoverFocusCssConvergence(
        "#nd-page a:hover>p.text-fd-muted-foreground{color:var(--color-fd-muted-foreground)}",
      ),
    ).toContain("missing footer hover/focus no-text-recolor");
  });

  test("bundledCssHasFooterSublabelInheritRule rejects accent-foreground title recolor", () => {
    const bundledCss = `
      #nd-page a[class*=hover\\:bg-fd-accent][class*=hover\\:text-fd-accent-foreground]:is(:hover,:focus-visible){color:var(--color-fd-accent-foreground)}
      #nd-page a[class*=hover\\:bg-fd-accent][class*=hover\\:text-fd-accent-foreground]:is(:hover,:focus-visible)>p.text-fd-muted-foreground{color:var(--color-fd-muted-foreground)!important}
    `;

    expect(bundledCssHasFooterSublabelInheritRule(bundledCss)).toBe(false);
  });

  test("bundledCssHasFooterCompactSizingRule rejects tall Fumadocs padding/gap defaults", () => {
    const tallCss = `
      #nd-page a[class*=hover\\:bg-fd-accent][class*=hover\\:text-fd-accent-foreground]{padding:1rem;gap:0.5rem}
    `;

    expect(bundledCssHasFooterCompactSizingRule(tallCss)).toBe(false);
    expect(assertDocsFooterCompactSizingCssConvergence(tallCss)).toContain(
      "missing footer compact padding/gap",
    );
  });

  test("assertFooterChromeContract passes on accent-hover footer cards with muted sublabels", () => {
    expect(assertFooterChromeContract(SAMPLE_ND_PAGE_HTML)).toBeNull();
  });

  test("assertFooterChromeContract fails when accent-hover classes are missing", () => {
    const html = `
      <div id="nd-page">
        <a href="/docs/glossary/scaling-law">
          <p class="text-fd-muted-foreground truncate">Previous Page</p>
        </a>
        <a class="hover:bg-fd-accent/80 hover:text-fd-accent-foreground" href="/docs/concepts/embedding">
          <p class="text-fd-muted-foreground truncate">Next Page</p>
        </a>
      </div>
    `;

    expect(assertFooterChromeContract(html)).toContain(
      "Previous Page card missing accent-hover utility classes",
    );
  });
});
