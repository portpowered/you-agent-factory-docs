/**
 * Compatibility render proof for /docs/documentation/factory-session → /docs/factories/sessions (W18).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("factory-session documentation compatibility page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "serves static compatibility HTML linking to /docs/factories/sessions",
    async () => {
      const fumadocsPage = source.getPage(["documentation", "factory-session"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/factory-session");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "factory-session",
      });

      expect(loadedPage.messages.title).toBe("Factory Session");
      expect(loadedPage.messages.description).toContain(
        "/docs/factories/sessions",
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
        "/docs/documentation/factory-session",
      );
      expect(root?.getAttribute("data-compatibility-target-route")).toBe(
        "/docs/factories/sessions",
      );

      const link = screen.getByRole("link", {
        name: "Open the factory sessions page",
      });
      expect(link.getAttribute("href")).toBe("/docs/factories/sessions");
      expect(link.getAttribute("data-compatibility-target-link")).toBe("");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
