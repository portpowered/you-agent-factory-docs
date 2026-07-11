import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { DocsPre } from "@/features/docs/components/DocsCodeBlock";
import {
  assertViewportScrollDoesNotOverlapRail,
  collectDocsCodeBlockLayout,
  copyControlIsOutsideScrollViewport,
} from "@/lib/verify/docs-code-block-layout";

const LONG_LINE =
  "curl -fsSL https://example.invalid/very-long-install-script-path-that-should-scroll-horizontally-inside-its-viewport-and-never-cover-the-copy-control | sh";

describe("DocsCodeBlock responsive overflow layout", () => {
  afterEach(() => {
    cleanup();
  });

  test("copy rail stays outside the scroll viewport so long lines cannot overlap it", () => {
    render(<DocsPre className="language-sh">{LONG_LINE}</DocsPre>);

    const hits = collectDocsCodeBlockLayout(document);
    expect(hits.length).toBe(1);

    const hit = hits[0];
    expect(hit.viewport).toBeTruthy();
    expect(hit.rail).toBeTruthy();
    expect(hit.copyControl).toBeTruthy();
    expect(copyControlIsOutsideScrollViewport(hit)).toBe(true);

    const scroll = assertViewportScrollDoesNotOverlapRail(hit);
    expect(scroll.viewportCanScroll).toBe(true);
    expect(scroll.railOutsideViewport).toBe(true);
    expect(scroll.copyOutsideViewport).toBe(true);
  });

  test("rich-content scroll marker remains on the viewport column only", () => {
    render(<DocsPre className="language-sh">{LONG_LINE}</DocsPre>);

    const hit = collectDocsCodeBlockLayout(document)[0];
    expect(hit.viewport?.getAttribute("data-rich-content-scroll")).toBe("code");
    expect(hit.rail?.getAttribute("data-rich-content-scroll")).toBeNull();
    expect(hit.viewport?.className).toContain("docs-code-block__viewport");
    expect(hit.rail?.getAttribute("data-docs-code-actions")).toBe("rail");
  });
});
