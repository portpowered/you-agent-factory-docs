/**
 * Compatibility render proof for /docs/documentation/api-doc → /docs/references/api (W18).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("api-doc documentation compatibility page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "serves static compatibility HTML linking to /docs/references/api",
    async () => {
      const fumadocsPage = source.getPage(["documentation", "api-doc"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/api-doc");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "api-doc",
      });

      expect(loadedPage.messages.title).toBe("API");
      expect(loadedPage.messages.description).toContain("/docs/references/api");
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
        "/docs/documentation/api-doc",
      );
      expect(root?.getAttribute("data-compatibility-target-route")).toBe(
        "/docs/references/api",
      );

      const link = screen.getByRole("link", {
        name: "Open the API reference",
      });
      expect(link.getAttribute("href")).toBe("/docs/references/api");
      expect(link.getAttribute("data-compatibility-target-link")).toBe("");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
