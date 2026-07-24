/**
 * Page-owned proofs for references/packaged-factories-index/quorum.
 * Asserts published nested route, registry alignment, concise reference
 * chrome (canonical name, description, invocation examples, parallelism
 * note, parent definition link), and absence of workflow/teaching chrome
 * or unabridged factory.json dump. Replay mount belongs to a later story.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
import { source } from "@/lib/source";

const PAGE_URL = "/docs/references/packaged-factories-index/quorum";
const PAGE_SLUG = "packaged-factories-index/quorum";
const REGISTRY_ID = "reference.packaged-factories-index-quorum";
const PARENT_DEFINITION_HREF =
  "/docs/references/packaged-factories-index#quorum";
const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("packaged-factories-index quorum child reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/references/packaged-factories-index/quorum as a concise @you/quorum reference",
    async () => {
      const fumadocsPage = source.getPage([
        "references",
        "packaged-factories-index",
        "quorum",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe(PAGE_URL);

      const loadedPage = await loadLocalDocsPage({
        section: "references",
        slug: PAGE_SLUG,
      });

      expect(loadedPage.frontmatter.kind).toBe("reference");
      expect(loadedPage.frontmatter.registryId).toBe(REGISTRY_ID);
      expect(loadedPage.frontmatter.status).toBe("published");
      expect(loadedPage.messages.title).toBe("Quorum");
      expect(loadedPage.messages.description).toMatch(/@you\/quorum/i);
      expect(loadedPage.messages.sections?.overview?.title).toBe("@you/quorum");
      expect(
        String(loadedPage.messages.sections?.overview?.body ?? ""),
      ).toMatch(/two independent branch assessments/i);
      expect(
        String(loadedPage.messages.sections?.parallelism?.body ?? ""),
      ).toMatch(/independent assessments before the merge worker synthesizes/i);
      expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
      expect(
        loadedPage.messages.sections?.limitsAndAssumptions,
      ).toBeUndefined();
      expect(loadedPage.messages.sections?.related).toBeUndefined();
      expect(loadedPage.messages.sections?.tags).toBeUndefined();
      expect(loadedPage.messages.sections?.references).toBeUndefined();
      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();

      render(
        <main>
          <DocsPageProviders
            assets={loadedPage.assets}
            messages={loadedPage.messages}
          >
            {loadedPage.content}
          </DocsPageProviders>
        </main>,
      );

      expect(screen.getByRole("heading", { name: "@you/quorum" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Invocation examples" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Parallelism" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Complete definition" }),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /two independent branch assessments, then synthesizes them/i,
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /independent assessments before the merge worker synthesizes them/i,
        ),
      ).toBeTruthy();

      expect(
        screen.getByText(
          'you run --named @you/quorum "Compare the two proposed release plans."',
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(
          'echo "Compare the two proposed release plans." | you run --named @you/quorum',
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(
          /you run --named @you\/quorum --branch-provider CODEX --branch-model gpt-5 --merge-provider CLAUDE --merge-model claude-sonnet-4-20250514/,
        ),
      ).toBeTruthy();

      const parentLink = screen.getByRole("link", {
        name: "Complete @you/quorum definition",
      });
      expect(parentLink.getAttribute("href")).toBe(PARENT_DEFINITION_HREF);

      expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeNull();
      expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
      expect(document.getElementById("related")).toBeNull();
      expect(document.querySelector("[data-factory-replay]")).toBeNull();
      expect(screen.queryByText(/"name": "@you\/quorum"/)).toBeNull();
      expect(screen.queryByText(/builtin-quorum/)).toBeNull();
    },
    PAGE_RENDER_TIMEOUT_MS,
  );

  test("exposes a published multi-segment registry record for the quorum child", async () => {
    const indexes = await loadRegistry();
    const record = getRegistryRecord(indexes, REGISTRY_ID);

    expect(record).toBeTruthy();
    expect(record?.kind).toBe("reference");
    expect(record?.id).toBe(REGISTRY_ID);
    expect(record?.slug).toBe(PAGE_SLUG);
    expect(record?.status).toBe("published");
    expect(record?.aliases).toContain("@you/quorum");
    expect(record?.relatedIds).toContain("reference.packaged-factories-index");
  });
});
