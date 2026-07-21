/**
 * Chassis closeout: production blog/docs render without teaching-ui harness
 * content, and the public barrel stays chassis-only (no sibling recipe stubs).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import * as teachingUi from "@/features/teaching-ui";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

const HARNESS_MARKERS = [
  "teaching-ui-harness",
  "data-teaching-ui-harness",
  "Teaching UI harness",
  'data-testid="teaching-ui-harness',
] as const;

afterEach(() => {
  cleanup();
});

describe("teaching-ui chassis production untouched (004)", () => {
  test("blog/changelog HTML has no teaching-ui harness markers", async () => {
    const page = await renderBlogPostPage("changelog");
    const html = renderToStaticMarkup(page);

    expect(html).toContain('data-blog-slug="changelog"');
    for (const marker of HARNESS_MARKERS) {
      expect(html).not.toContain(marker);
    }
  });

  test("docs/concepts/harness HTML has no teaching-ui harness markers", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "harness",
    });

    const { container } = render(
      <main>
        <DocsPageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    const html = container.innerHTML;
    expect(html.length).toBeGreaterThan(0);
    for (const marker of HARNESS_MARKERS) {
      expect(html).not.toContain(marker);
    }
  });

  test("public barrel stays chassis-only (no sibling recipe stubs)", () => {
    const exportNames = Object.keys(teachingUi).sort();
    expect(exportNames).toEqual([
      "DEFAULT_FOCUS_COLOR_TOKENS",
      "focusFill",
      "mutedFill",
      "resolveFocusColor",
    ]);
    expect(teachingUi).not.toHaveProperty("ComparativeBarChart");
    expect(teachingUi).not.toHaveProperty("TeachingList");
    expect(teachingUi).not.toHaveProperty("FilterableSortableTable");
    expect(teachingUi).not.toHaveProperty("ModelCostPlayground");
  });
});
