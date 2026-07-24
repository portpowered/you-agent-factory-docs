/**
 * Page-owned publish proof for references/packaged-factories-index/review.
 * Story 003 covers concise reference content only; full-mode replay +
 * recording isolation belong to later stories.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadRegistry } from "@/lib/content/registry";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;
const REGISTRY_ID = "reference.packaged-factories-index-review";
const ROUTE_SLUG = "packaged-factories-index/review";

describe("packaged-factories-index/review reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/references/packaged-factories-index/review with concise @you/review reference content",
    async () => {
      const fumadocsPage = source.getPage([
        "references",
        "packaged-factories-index",
        "review",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe(
        "/docs/references/packaged-factories-index/review",
      );

      const registry = await loadRegistry();
      const record = registry.byId.get(REGISTRY_ID);
      expect(record?.kind).toBe("reference");
      expect(record?.slug).toBe(ROUTE_SLUG);
      expect(record?.status).toBe("published");

      const loadedPage = await loadLocalDocsPage({
        section: "references",
        slug: ROUTE_SLUG,
      });

      expect(loadedPage.frontmatter.kind).toBe("reference");
      expect(loadedPage.frontmatter.registryId).toBe(REGISTRY_ID);
      expect(loadedPage.messages.title).toBe("@you/review");
      expect(loadedPage.messages.links?.canonicalName).toBe("@you/review");
      expect(loadedPage.messages.description).toMatch(/@you\/review/i);

      const overviewBody = String(
        loadedPage.messages.sections?.overview?.body ?? "",
      );
      expect(overviewBody).toMatch(
        /independent(?:ly)? review|review(?:ed|s)? .* before return/i,
      );
      expect(overviewBody.split(/(?<=[.!?])\s+/).filter(Boolean)).toHaveLength(
        1,
      );
      expect(overviewBody).not.toMatch(/factory\.json|on this page|workflow/i);

      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
      expect(
        loadedPage.messages.sections?.limitsAndAssumptions,
      ).toBeUndefined();
      expect(loadedPage.messages.sections?.deterministicReplay).toBeUndefined();

      const notesBody = String(
        loadedPage.messages.sections?.operationalNotes?.body ?? "",
      );
      expect(notesBody).toMatch(/execute|independent/i);
      expect(notesBody).toMatch(/reject|init/i);
      expect(notesBody).toMatch(/approved/i);

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

      expect(screen.getByRole("heading", { name: "Overview" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Invocation examples" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Operational notes" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Complete definition" }),
      ).toBeTruthy();

      const canonical = document.querySelector(
        "[data-packaged-factory-canonical-name]",
      );
      expect(canonical?.textContent).toContain("@you/review");

      expect(
        screen.getByText(
          /you run --named @you\/review "Draft the release notes"/,
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /echo "Draft the release notes" \| you run --named @you\/review/,
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /you run --named @you\/review "Review draft release notes\."/,
        ),
      ).toBeTruthy();

      const definitionLink = screen.getByRole("link", {
        name: /Complete @you\/review definition on Packaged Factory Reference/i,
      });
      expect(definitionLink.getAttribute("href")).toBe(
        "/docs/references/packaged-factories-index#review",
      );

      expect(document.body.textContent).not.toMatch(
        /"id":\s*"builtin-review"|unabridged factory\.json/i,
      );
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
