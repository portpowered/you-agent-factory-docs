/**
 * Page-owned publish proof for references/packaged-factories-index/goal.
 * Covers concise reference surface: canonical name, one-sentence description,
 * concrete invocation examples, and parent definition link. Replay mount and
 * recording isolation proofs belong to later stories in this PRD.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadRegistry } from "@/lib/content/registry";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;
const REGISTRY_ID = "reference.packaged-factories-index-goal";
const ROUTE_SLUG = "packaged-factories-index/goal";

describe("packaged-factories-index/goal reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/references/packaged-factories-index/goal with concise @you/goal reference content",
    async () => {
      const fumadocsPage = source.getPage([
        "references",
        "packaged-factories-index",
        "goal",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe(
        "/docs/references/packaged-factories-index/goal",
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
      expect(loadedPage.messages.title).toBe("@you/goal");
      expect(loadedPage.messages.links?.canonicalName).toBe("@you/goal");
      expect(loadedPage.messages.description).toMatch(/@you\/goal/i);
      expect(
        String(loadedPage.messages.sections?.overview?.body ?? ""),
      ).toMatch(/packaged named factory/i);
      expect(
        String(loadedPage.messages.sections?.overview?.body ?? ""),
      ).not.toMatch(/factory\.json|on this page|workflow/i);
      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
      expect(
        loadedPage.messages.sections?.limitsAndAssumptions,
      ).toBeUndefined();
      expect(loadedPage.messages.sections?.operationalNotes).toBeUndefined();

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
        screen.getByRole("heading", { name: "Complete definition" }),
      ).toBeTruthy();

      const canonical = document.querySelector(
        "[data-packaged-factory-canonical-name]",
      );
      expect(canonical?.textContent).toContain("@you/goal");

      expect(
        screen.getByText(/you run --named @you\/goal "Ship the login bug fix"/),
      ).toBeTruthy();
      expect(
        screen.getByText(/you run --named @you\/goal --help/),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /you run --named @you\/goal "Reduce flake in the auth suite"/,
        ),
      ).toBeTruthy();

      const definitionLink = screen.getByRole("link", {
        name: /Complete @you\/goal definition on Packaged Factory Reference/i,
      });
      expect(definitionLink.getAttribute("href")).toBe(
        "/docs/references/packaged-factories-index#goal",
      );

      expect(document.body.textContent).not.toMatch(
        /"id":\s*"builtin-goal"|unabridged factory\.json/i,
      );
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
