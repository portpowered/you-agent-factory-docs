/**
 * Compatibility render proof for /docs/documentation/dynamic-workflows → /docs/factories/dynamic-workflows (W18).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("dynamic-workflows documentation compatibility page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "serves static compatibility HTML linking to /docs/factories/dynamic-workflows",
    async () => {
      const fumadocsPage = source.getPage([
        "documentation",
        "dynamic-workflows",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/dynamic-workflows");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "dynamic-workflows",
      });

      expect(loadedPage.messages.title).toBe("Dynamic Workflows");
      expect(loadedPage.messages.description).toContain(
        "/docs/factories/dynamic-workflows",
      );
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
        "/docs/documentation/dynamic-workflows",
      );
      expect(root?.getAttribute("data-compatibility-target-route")).toBe(
        "/docs/factories/dynamic-workflows",
      );

      const link = screen.getByRole("link", {
        name: "Open the dynamic workflows page",
      });
      expect(link.getAttribute("href")).toBe(
        "/docs/factories/dynamic-workflows",
      );
      expect(link.getAttribute("data-compatibility-target-link")).toBe("");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
