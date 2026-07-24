/**
 * Page-owned publish proof for references/packaged-factories-index/fusion.
 * Covers concise reference surface: canonical name, one-sentence description,
 * concrete invocation examples, operational notes, and parent definition link.
 * Replay mount and recording isolation proofs belong to later stories.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadRegistry } from "@/lib/content/registry";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;
const REGISTRY_ID = "reference.packaged-factories-index-fusion";
const ROUTE_SLUG = "packaged-factories-index/fusion";

describe("packaged-factories-index/fusion reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/references/packaged-factories-index/fusion with concise @you/fusion reference content",
    async () => {
      const fumadocsPage = source.getPage([
        "references",
        "packaged-factories-index",
        "fusion",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe(
        "/docs/references/packaged-factories-index/fusion",
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
      expect(loadedPage.messages.title).toBe("@you/fusion");
      expect(loadedPage.messages.links?.canonicalName).toBe("@you/fusion");
      expect(loadedPage.messages.description).toMatch(/@you\/fusion/i);

      const overviewBody = String(
        loadedPage.messages.sections?.overview?.body ?? "",
      );
      expect(overviewBody).toMatch(/draft-then-refine|draft then refine/i);
      expect(overviewBody.split(/(?<=[.!?])\s+/).filter(Boolean)).toHaveLength(
        1,
      );
      expect(overviewBody).not.toMatch(/factory\.json|on this page|workflow/i);

      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
      expect(
        loadedPage.messages.sections?.limitsAndAssumptions,
      ).toBeUndefined();

      const notesBody = String(
        loadedPage.messages.sections?.operationalNotes?.body ?? "",
      );
      expect(notesBody).toMatch(/draft|refine|sequential/i);
      expect(notesBody).toMatch(/provider|model|effort/i);
      expect(notesBody).toMatch(/output/i);

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
      expect(canonical?.textContent).toContain("@you/fusion");

      expect(
        screen.getByText(
          /you run --named @you\/fusion "Draft a release summary" --first-provider CLAUDE --second-provider CODEX --output fusion-summary\.md/,
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /echo "Draft a release summary" \| you run --named @you\/fusion --first-model claude-sonnet-4-20250514 --second-model gpt-5/,
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /you run --named @you\/fusion "Draft a release summary" --first-effort high --second-effort medium/,
        ),
      ).toBeTruthy();

      const definitionLink = screen.getByRole("link", {
        name: /Complete @you\/fusion definition on Packaged Factory Reference/i,
      });
      expect(definitionLink.getAttribute("href")).toBe(
        "/docs/references/packaged-factories-index#fusion",
      );

      expect(document.body.textContent).not.toMatch(
        /"id":\s*"builtin-fusion"|fusion-drafter|fusion-refiner/i,
      );
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
