/**
 * Compatibility render proof for /docs/documentation/mock-workers → /docs/workers/mock (W18).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("mock-workers documentation compatibility page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "serves static compatibility HTML linking to /docs/workers/mock",
    async () => {
      const fumadocsPage = source.getPage(["documentation", "mock-workers"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/mock-workers");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "mock-workers",
      });

      expect(loadedPage.messages.title).toBe("Mock workers");
      expect(loadedPage.messages.description).toContain("/docs/workers/mock");
      expect(String(loadedPage.messages.sections?.moved?.body ?? "")).toMatch(
        /moved to a new family route/i,
      );

      render(
        <main>
          <DocsPageProviders
            messages={loadedPage.messages}
            assets={loadedPage.assets}
          >
            <article data-registry-id={loadedPage.frontmatter.registryId}>
              {loadedPage.content}
            </article>
          </DocsPageProviders>
        </main>,
      );

      const root = document.querySelector(
        "[data-documentation-route-compatibility]",
      );
      expect(root).toBeTruthy();
      expect(root?.getAttribute("data-compatibility-old-route")).toBe(
        "/docs/documentation/mock-workers",
      );
      expect(root?.getAttribute("data-compatibility-target-route")).toBe(
        "/docs/workers/mock",
      );

      const link = screen.getByRole("link", {
        name: "Open the mock workers page",
      });
      expect(link.getAttribute("href")).toBe("/docs/workers/mock");
      expect(link.getAttribute("data-compatibility-target-link")).toBe("");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
