/**
 * Compatibility render proof for /docs/documentation/inference-workers → /docs/workers/inference (W18).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("inference-workers documentation compatibility page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "serves static compatibility HTML linking to /docs/workers/inference",
    async () => {
      const fumadocsPage = source.getPage([
        "documentation",
        "inference-workers",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/inference-workers");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "inference-workers",
      });

      expect(loadedPage.messages.title).toBe("Inference workers");
      expect(loadedPage.messages.description).toContain(
        "/docs/workers/inference",
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
        "/docs/documentation/inference-workers",
      );
      expect(root?.getAttribute("data-compatibility-target-route")).toBe(
        "/docs/workers/inference",
      );

      const link = screen.getByRole("link", {
        name: "Open the inference workers page",
      });
      expect(link.getAttribute("href")).toBe("/docs/workers/inference");
      expect(link.getAttribute("data-compatibility-target-link")).toBe("");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
