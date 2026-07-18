/**
 * Compatibility render proof for /docs/documentation/cli-command-index → /docs/references/cli (W18).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("cli-command-index documentation compatibility page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "serves static compatibility HTML linking to /docs/references/cli",
    async () => {
      const fumadocsPage = source.getPage([
        "documentation",
        "cli-command-index",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/cli-command-index");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "cli-command-index",
      });

      expect(loadedPage.messages.title).toBe("CLI Command Index");
      expect(loadedPage.messages.description).toContain("/docs/references/cli");
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
        "/docs/documentation/cli-command-index",
      );
      expect(root?.getAttribute("data-compatibility-target-route")).toBe(
        "/docs/references/cli",
      );

      const link = screen.getByRole("link", {
        name: "Open the CLI reference",
      });
      expect(link.getAttribute("href")).toBe("/docs/references/cli");
      expect(link.getAttribute("data-compatibility-target-link")).toBe("");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
