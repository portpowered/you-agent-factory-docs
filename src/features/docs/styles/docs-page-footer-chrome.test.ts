import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DOCS_PAGE_FOOTER_HOVER_TOKENS,
  docsPageFooterCardSelector,
  docsPageFooterCompactGap,
  docsPageFooterCompactPadding,
  docsPageFooterHoverStateSelector,
  docsPageFooterMutedSublabelSelector,
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

  test("selector exports stay wired into the shared chrome stylesheet", () => {
    const normalizedCss = normalizeSelectorContract(footerChromeCss);

    expect(normalizedCss).toContain(
      normalizeSelectorContract(docsPageFooterCardSelector),
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
