/**
 * Page-owned render proof for documentation/api (Program Interfaces Mode A how-to).
 * Covers documentation shell, API how-to identity, default base URL / factory-running
 * / typical-flow teaching, and the dual-page contract: link to /docs/references/api
 * with no ApiReferenceProjection / OpenAPI catalog UI on this how-to.
 * Does not assert explorer sidebar membership, route inventories, or Lane A maps.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getPublishedDocsEntryByRegistryId } from "@/lib/content/published-docs-registry-ids";
import { source } from "@/lib/source";

// Cold MDX compile + full-page render can exceed Bun's 5s default under load.
const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("api documentation how-to page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/documentation/api as a Mode A API how-to",
    async () => {
      const fumadocsPage = source.getPage(["documentation", "api"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/api");

      const published = getPublishedDocsEntryByRegistryId("documentation.api");
      expect(published).toBeDefined();
      expect(published?.url).toBe("/docs/documentation/api");
      expect(published?.pageKind).toBe("documentation");
      expect(published?.section).toBe("documentation");
      expect(published?.docsSlug).toBe("documentation/api");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "api",
      });

      expect(loadedPage.frontmatter.kind).toBe("documentation");
      expect(loadedPage.frontmatter.registryId).toBe("documentation.api");
      expect(loadedPage.frontmatter.status).toBe("published");
      expect(loadedPage.messages.title).toBe("API");
      expect(loadedPage.messages.description).toMatch(/local HTTP API/i);
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
      expect(loadedPage.messages.openingSummary).toMatch(
        /http:\/\/localhost:7437/i,
      );
      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

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
        screen.queryByRole("heading", { name: "What It Covers" }),
      ).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Key Concepts" }),
      ).toBeNull();
      expect(document.getElementById("what-it-covers")).toBeNull();
      expect(document.getElementById("key-concepts")).toBeNull();

      expect(
        screen.getByRole("heading", { name: "How To Reach" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Typical Session Flow" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Trust Boundaries" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    },
    PAGE_RENDER_TIMEOUT_MS,
  );

  test(
    "teaches default base URL, factory-running precondition, and session flow",
    async () => {
      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "api",
      });

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

      const reachSection = document.getElementById("how-to-reach");
      expect(reachSection).toBeTruthy();
      expect(reachSection?.textContent).toMatch(/http:\/\/localhost:7437/);
      expect(reachSection?.textContent).toMatch(
        /factory service must already be running/i,
      );
      expect(reachSection?.textContent).toMatch(/\byou\b/);

      const flowSection = document.getElementById("typical-session-flow");
      expect(flowSection).toBeTruthy();
      expect(flowSection?.textContent).toMatch(/you session list/);
      expect(flowSection?.textContent).toMatch(/you session show/);
      expect(flowSection?.textContent).toMatch(
        /\/factory-sessions\/~default\/status/,
      );

      const trustSection = document.getElementById("trust-boundaries");
      expect(trustSection).toBeTruthy();
      expect(trustSection?.textContent).toMatch(
        /Security \/ Trust Boundaries/i,
      );

      const limitsSection = document.getElementById("limits-and-assumptions");
      expect(limitsSection).toBeTruthy();
      expect(limitsSection?.textContent).toMatch(/not the operations catalog/i);
      expect(limitsSection?.textContent).toMatch(/not an OpenAPI playground/i);
      expect(limitsSection?.textContent).toMatch(
        /not agent CLI-ingress policy replacement/i,
      );
    },
    PAGE_RENDER_TIMEOUT_MS,
  );

  test(
    "links to Reference API catalog without OpenAPI / ApiReferenceProjection embed",
    async () => {
      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "api",
      });

      const howToUse = String(
        loadedPage.messages.sections?.howToUse?.body ?? "",
      );
      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );
      expect(howToUse).toMatch(/Reference API catalog/i);
      expect(limits).toMatch(/operations catalog/i);
      expect(limits).toMatch(/does not render OpenAPI/i);

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

      const howToUseSection = document.getElementById("how-to-use");
      expect(howToUseSection).toBeTruthy();
      const catalogLinks = Array.from(
        howToUseSection?.querySelectorAll('a[href="/docs/references/api"]') ??
          [],
      );
      expect(catalogLinks.length).toBeGreaterThan(0);
      expect(howToUseSection?.textContent).toMatch(/operations catalog/i);

      const relatedSection = document.getElementById("related");
      expect(relatedSection).toBeTruthy();
      const relatedCatalogLinks = Array.from(
        relatedSection?.querySelectorAll('a[href="/docs/references/api"]') ??
          [],
      );
      expect(relatedCatalogLinks.length).toBeGreaterThan(0);

      // Dual-page: catalog UI stays on /docs/references/api only.
      expect(
        document.querySelector("[data-api-reference-projection]"),
      ).toBeNull();
      expect(
        document.querySelector("[data-api-operation-navigator]"),
      ).toBeNull();
      expect(
        document.querySelector("[data-api-fumadocs-operations]"),
      ).toBeNull();
      expect(
        document.querySelector("[data-api-fumadocs-operation]"),
      ).toBeNull();
      expect(screen.queryByTestId("api-reference-projection")).toBeNull();
      expect(document.querySelector('[data-testid="api-surface"]')).toBeNull();
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
