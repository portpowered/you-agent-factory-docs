/**
 * Page-owned render proof for references/api.
 * Covers the published reference shell, registry alignment, and projection-first
 * MDX (no how-to-use / limits / tags / related / citations boilerplate). Under
 * happy-dom, page-mdx-components mounts the sync Fumadocs stub; real
 * createAPIPage is covered by projection unit tests and browser probes.
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
    "publishes /docs/references/api as a projection-first reference page",
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
      const operations = String(
        loadedPage.messages.sections?.operations?.body ?? "",
      );

      expect(whatItCovers).toMatch(/HTTP\/OpenAPI/i);
      expect(whatItCovers).toMatch(/published operations/i);
      expect(keyConcepts).toMatch(/OpenAPI/i);
      expect(keyConcepts).toMatch(/local-server base URL/i);
      expect(keyConcepts).toMatch(/static documentation/i);
      expect(keyConcepts).toMatch(/request playground/i);
      expect(keyConcepts).toMatch(/events reference/i);
      expect(operations).toMatch(/OpenAPI projection/i);
      expect(whatItCovers).not.toMatch(/on this page|Model Atlas/i);
      expect(keyConcepts).not.toMatch(/on this page|Model Atlas/i);
      expect(operations).not.toMatch(/on this page|Model Atlas/i);

      // Boilerplate section copy must not remain as published message keys.
      expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
      expect(
        loadedPage.messages.sections?.limitsAndAssumptions,
      ).toBeUndefined();
      expect(loadedPage.messages.sections?.related).toBeUndefined();
      expect(loadedPage.messages.sections?.tags).toBeUndefined();
      expect(loadedPage.messages.sections?.references).toBeUndefined();

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

      expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeNull();
      expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "References" })).toBeNull();

      expect(document.getElementById("how-to-use")).toBeNull();
      expect(document.getElementById("limits-and-assumptions")).toBeNull();
      expect(document.getElementById("related")).toBeNull();
      expect(document.getElementById("tags")).toBeNull();
      expect(document.getElementById("references")).toBeNull();

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
        document
          .querySelector("[data-api-fumadocs-operation]")
          ?.getAttribute("data-api-operation-summary"),
      ).toBeTruthy();
      expect(
        document.querySelector("[data-api-operation-path-token]"),
      ).not.toBeNull();
      expect(
        document.querySelectorAll('[data-api-schema-slot="request"]').length,
      ).toBeGreaterThan(0);
      expect(
        document.querySelectorAll('[data-api-schema-slot="response"]').length,
      ).toBeGreaterThan(0);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
