import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  docsPageFooterCardSelector,
  docsPageFooterCompactGap,
  docsPageFooterCompactPadding,
  docsPageFooterMutedSublabelSelector,
  docsPageFooterStableTextColorSelector,
} from "@/features/docs/styles/docs-page-footer-chrome";
import {
  assertDocsFooterChromeCssConvergence,
  assertDocsFooterCompactSizingCssConvergence,
  assertDocsFooterSublabelHoverFocusCssConvergence,
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
    expect(docsPageFooterStableTextColorSelector).toContain(":hover");
    expect(docsPageFooterStableTextColorSelector).toContain(":focus-visible");
    expect(docsPageFooterMutedSublabelSelector).toContain(
      "p.text-fd-muted-foreground",
    );
  });

  test("shared chrome stylesheet converges on no-text-recolor and compact sizing together", () => {
    expect(assertDocsFooterChromeCssConvergence(footerChromeCss)).toBeNull();
    expect(
      assertDocsFooterSublabelHoverFocusCssConvergence(footerChromeCss),
    ).toBeNull();
    expect(
      assertDocsFooterCompactSizingCssConvergence(footerChromeCss),
    ).toBeNull();

    // Non-text affordances still present alongside stable title color.
    expect(footerChromeCss).toContain(
      "background-color: color-mix(in oklch, var(--color-fd-accent) 80%, transparent)",
    );
    expect(footerChromeCss).toContain("outline-width: 2px");
    expect(footerChromeCss).toContain("box-shadow: 0 0 0 2px var(--ring)");
    expect(footerChromeCss).not.toContain(
      "color: var(--color-fd-accent-foreground)",
    );
  });

  test("selector exports stay wired into the shared chrome stylesheet", () => {
    const normalizedCss = normalizeSelectorContract(footerChromeCss);

    expect(normalizedCss).toContain(
      normalizeSelectorContract(docsPageFooterCardSelector),
    );
    expect(normalizedCss).toContain(
      normalizeSelectorContract(docsPageFooterStableTextColorSelector),
    );
    expect(normalizedCss).toContain(
      normalizeSelectorContract(docsPageFooterMutedSublabelSelector),
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
