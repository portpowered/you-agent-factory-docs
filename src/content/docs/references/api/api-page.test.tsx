/**
 * Page-owned render proof for references/api.
 * Covers the published reference shell, registry alignment, and sibling
 * discovery links. Under happy-dom, page-mdx-components mounts the sync
 * Fumadocs stub; real createAPIPage is covered by projection unit tests and
 * `assert-api-page-fumadocs-browser.ts`.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getPublishedDocsEntryByRegistryId } from "@/lib/content/published-docs-registry-ids";
import { source } from "@/lib/source";

// Cold MDX compile + full-page render can exceed Bun's 5s default under load.
const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("api reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/references/api as a reference-kind page",
    async () => {
      const fumadocsPage = source.getPage(["references", "api"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/references/api");

      const published = getPublishedDocsEntryByRegistryId("reference.api");
      expect(published).toBeDefined();
      expect(published?.url).toBe("/docs/references/api");
      expect(published?.pageKind).toBe("reference");
      expect(published?.section).toBe("references");
      expect(published?.docsSlug).toBe("references/api");

      const loadedPage = await loadLocalDocsPage({
        section: "references",
        slug: "api",
      });

      expect(loadedPage.frontmatter.kind).toBe("reference");
      expect(loadedPage.frontmatter.registryId).toBe("reference.api");
      expect(loadedPage.frontmatter.status).toBe("published");
      expect(loadedPage.messages.title).toBe("API");
      expect(loadedPage.messages.description).toMatch(/HTTP\/OpenAPI/i);
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

      const whatItCovers = String(
        loadedPage.messages.sections?.whatItCovers?.body ?? "",
      );
      const keyConcepts = String(
        loadedPage.messages.sections?.keyConcepts?.body ?? "",
      );
      const howToUse = String(
        loadedPage.messages.sections?.howToUse?.body ?? "",
      );
      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );

      expect(whatItCovers).toMatch(/HTTP\/OpenAPI/i);
      expect(whatItCovers).toMatch(/published operations/i);
      expect(keyConcepts).toMatch(/OpenAPI/i);
      expect(keyConcepts).toMatch(/local-server base URL/i);
      expect(howToUse).toMatch(/tag-grouped navigation/i);
      expect(howToUse).toMatch(/documentation host/i);
      expect(limits).toMatch(/static documentation/i);
      expect(limits).toMatch(/request playground/i);
      expect(limits).toMatch(/\/docs\/references\/events/);
      expect(whatItCovers).not.toMatch(/on this page|Model Atlas/i);
      expect(keyConcepts).not.toMatch(/on this page|Model Atlas/i);
      expect(howToUse).not.toMatch(/on this page|Model Atlas/i);
      expect(limits).not.toMatch(/on this page|Model Atlas/i);

      render(
        <main>
          <DocsPageProviders
            messages={loadedPage.messages}
            assets={loadedPage.assets}
          >
            {loadedPage.content}
          </DocsPageProviders>
        </main>,
      );

      expect(
        screen.getByRole("heading", { name: "What It Covers" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Key Concepts" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Operations" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();

      expect(screen.getByTestId("api-reference-projection")).toBeTruthy();
      expect(
        document
          .querySelector('[data-testid="api-surface"]')
          ?.getAttribute("data-api-status"),
      ).toBe("ready");
      expect(document.querySelector('[data-testid="api-status"]')).toBeNull();
      expect(
        document.querySelector("[data-api-operation-navigator]"),
      ).not.toBeNull();
      expect(
        document.querySelector("[data-api-fumadocs-operations]"),
      ).not.toBeNull();
      expect(
        document.querySelectorAll("[data-api-operation-section]").length,
      ).toBeGreaterThan(0);
      expect(
        document
          .querySelector("[data-api-reference-projection]")
          ?.getAttribute("data-api-playground-suppressed"),
      ).toBe("true");
      expect(
        document.querySelectorAll("[data-api-fumadocs-operation]").length,
      ).toBeGreaterThan(0);

      expect(
        screen
          .getByRole("link", { name: "Events reference" })
          .getAttribute("href"),
      ).toBe("/docs/references/events");
      expect(
        screen
          .getByRole("link", { name: "API documentation orientation" })
          .getAttribute("href"),
      ).toBe("/docs/references/api");
      expect(
        screen.getByRole("link", { name: "CLI" }).getAttribute("href"),
      ).toBe("/docs/documentation/cli");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
