import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DOCS_PAGE_FOOTER_HOVER_TOKENS,
  docsPageFooterCardSelector,
  docsPageFooterCompactGap,
  docsPageFooterCompactPadding,
  docsPageFooterFamilyCardSelector,
  docsPageFooterHoverStateSelector,
  docsPageFooterMutedSublabelSelector,
  docsPageFooterTitleTextDecoration,
} from "@/features/docs/styles/docs-page-footer-chrome";
import {
  assertDocsFooterChromeCssConvergence,
  assertDocsFooterCompactSizingCssConvergence,
  assertDocsFooterYellowDarkTextCssConvergence,
  FOOTER_COMPACT_GAP,
  FOOTER_COMPACT_PADDING,
} from "@/lib/navigation/docs-page-footer-contract";

const footerChromeCss = readFileSync(
  join(process.cwd(), "src/features/docs/styles/docs-page-footer-chrome.css"),
  "utf8",
);

function normalizeSelectorContract(value: string): string {
  return value.replaceAll(/\s+/g, "");
}

describe("docs page footer chrome CSS contract", () => {
  test("chrome token exports stay aligned with footer contract constants", () => {
    expect(docsPageFooterCompactPadding).toBe(FOOTER_COMPACT_PADDING);
    expect(docsPageFooterCompactGap).toBe(FOOTER_COMPACT_GAP);
    expect(docsPageFooterCardSelector).toContain("hover:bg-fd-accent");
    expect(docsPageFooterCardSelector).toContain(
      "hover:text-fd-accent-foreground",
    );
    expect(docsPageFooterFamilyCardSelector).toContain(
      'data-testid="family-docs-footer-neighbors"',
    );
    expect(docsPageFooterHoverStateSelector).toContain(":hover");
    expect(docsPageFooterHoverStateSelector).toContain(":focus-visible");
    expect(docsPageFooterMutedSublabelSelector).toContain(
      "p.text-fd-muted-foreground",
    );
    expect(DOCS_PAGE_FOOTER_HOVER_TOKENS.hoverBackground).toBe(
      "var(--docs-chrome-primary-yellow)",
    );
    expect(DOCS_PAGE_FOOTER_HOVER_TOKENS.hoverForeground).toBe(
      "var(--primary-foreground)",
    );
    expect(docsPageFooterTitleTextDecoration).toBe("none");
  });

  test("shared chrome stylesheet converges on yellow+dark-text and compact sizing together", () => {
    expect(assertDocsFooterChromeCssConvergence(footerChromeCss)).toBeNull();
    expect(
      assertDocsFooterYellowDarkTextCssConvergence(footerChromeCss),
    ).toBeNull();
    expect(
      assertDocsFooterCompactSizingCssConvergence(footerChromeCss),
    ).toBeNull();

    expect(footerChromeCss).toContain(
      "background-color: var(--docs-chrome-primary-yellow)",
    );
    expect(footerChromeCss).toContain("color: var(--primary-foreground)");
    expect(footerChromeCss).toContain("outline-width: 2px");
    expect(footerChromeCss).toContain("box-shadow: 0 0 0 2px var(--ring)");
    expect(footerChromeCss).not.toContain("color: inherit");
    expect(footerChromeCss).not.toContain(
      "background-color: color-mix(in oklch, var(--color-fd-accent)",
    );
  });

  test("shared chrome stylesheet strips title underline and keeps focus-visible ring", () => {
    expect(footerChromeCss).toContain(
      `text-decoration: ${docsPageFooterTitleTextDecoration} !important`,
    );
    expect(footerChromeCss).toContain("text-decoration-line: none !important");
    expect(footerChromeCss).toContain("border-bottom-width: 0 !important");
    expect(footerChromeCss).toContain("outline-style: none");
    // Focus ring retained on both accent-hover and live family footer cards.
    expect(footerChromeCss).toContain("a:focus-visible");
    expect(footerChromeCss).toContain("outline-style: solid !important");
    expect(footerChromeCss).toContain("outline-width: 2px");
    expect(footerChromeCss).toContain("box-shadow: 0 0 0 2px var(--ring)");
    // Must not invent a second hover palette while polishing underlines.
    expect(footerChromeCss).toContain(
      "background-color: var(--docs-chrome-primary-yellow)",
    );
    expect(footerChromeCss).toContain("color: var(--primary-foreground)");
  });

  test("selector exports stay wired into the shared chrome stylesheet", () => {
    const normalizedCss = normalizeSelectorContract(footerChromeCss);

    expect(normalizedCss).toContain(
      normalizeSelectorContract(docsPageFooterCardSelector),
    );
    expect(normalizedCss).toContain(
      normalizeSelectorContract(docsPageFooterFamilyCardSelector),
    );
    expect(normalizedCss).toContain(
      normalizeSelectorContract(docsPageFooterHoverStateSelector),
    );
    expect(footerChromeCss).toContain("@layer utilities");
    expect(footerChromeCss).toContain(
      `padding: ${docsPageFooterCompactPadding} !important`,
    );
    expect(footerChromeCss).toContain(
      `gap: ${docsPageFooterCompactGap} !important`,
    );
  });
});
