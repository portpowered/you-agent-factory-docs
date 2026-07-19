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

const footerChromeCss = readFileSync(
  join(process.cwd(), "src/features/docs/styles/docs-page-footer-chrome.css"),
  "utf8",
);

function normalizeSelectorContract(value: string): string {
  return value.replaceAll(/\s+/g, "");
}

describe("docs page footer chrome CSS contract", () => {
  test("footer card hover/focus keeps non-text affordances without title recolor", () => {
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
    expect(footerChromeCss).toContain('class*="hover:bg-fd-accent"');
    expect(footerChromeCss).toContain(
      'class*="hover:text-fd-accent-foreground"',
    );
    expect(footerChromeCss).toContain("@layer utilities");
    expect(footerChromeCss).toContain("color: inherit !important");
    expect(footerChromeCss).toContain(
      "color: var(--color-fd-muted-foreground) !important",
    );
    expect(footerChromeCss).toContain(":focus-visible");
    expect(footerChromeCss).toContain(
      "background-color: color-mix(in oklch, var(--color-fd-accent) 80%, transparent)",
    );
    expect(footerChromeCss).toContain("outline-width: 2px");
    expect(footerChromeCss).toContain("box-shadow: 0 0 0 2px var(--ring)");
    // Title must not receive accent-foreground text highlight on hover/focus.
    expect(footerChromeCss).not.toContain(
      "color: var(--color-fd-accent-foreground)",
    );
  });

  test("footer cards use compact padding and gap below Fumadocs p-4/gap-2", () => {
    expect(docsPageFooterCompactPadding).toBe("0.5rem 0.75rem");
    expect(docsPageFooterCompactGap).toBe("0.25rem");
    expect(footerChromeCss).toContain(
      `padding: ${docsPageFooterCompactPadding} !important`,
    );
    expect(footerChromeCss).toContain(
      `gap: ${docsPageFooterCompactGap} !important`,
    );
    // Must not reintroduce the tall Fumadocs spacing values as chrome defaults.
    expect(footerChromeCss).not.toContain("padding: 1rem");
    expect(footerChromeCss).not.toContain("gap: 0.5rem");
  });
});
