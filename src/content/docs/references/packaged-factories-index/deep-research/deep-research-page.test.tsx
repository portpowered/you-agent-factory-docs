/**
 * Page-owned proofs for references/packaged-factories-index/deep-research.
 * Story 001: published nested route, purpose description, and non-replay
 * component-map resolution. Later stories extend usage, links, and forbidden-
 * surface proofs in this same colocated suite.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
import { loadRouteFamilyPageMdxComponents } from "@/lib/content/route-family-local-docs-page-load";
import { source } from "@/lib/source";
import {
  packagedFactoriesIndexChildComponentMapKind as deepResearchMapKind,
  pageMdxComponents as deepResearchPageMdxComponents,
} from "../deep-research-page-mdx-components";
import { pageMdxComponents as replayPageMdxComponents } from "../replay-page-mdx-components";

const PAGE_URL = "/docs/references/packaged-factories-index/deep-research";
const REGISTRY_ID = "reference.packaged-factories-index-deep-research";
const PURPOSE_BODY =
  "@you/deep-research investigates a research topic with a lead research pass. When the topic needs more breadth, it can call specialist investigators and then synthesize the findings into one result.";

describe("packaged-factories-index/deep-research nested reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes the nested deep-research route with a concise purpose description", async () => {
    const fumadocsPage = source.getPage([
      "references",
      "packaged-factories-index",
      "deep-research",
    ]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe(PAGE_URL);

    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "packaged-factories-index/deep-research",
    });

    expect(loadedPage.frontmatter.kind).toBe("reference");
    expect(loadedPage.frontmatter.registryId).toBe(REGISTRY_ID);
    expect(loadedPage.frontmatter.status).toBe("published");
    expect(loadedPage.messages.title).toBe("@you/deep-research");
    expect(loadedPage.messages.description).toMatch(/@you\/deep-research/i);
    expect(loadedPage.messages.sections?.purpose?.body).toBe(PURPOSE_BODY);
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(
      String(loadedPage.messages.sections?.purpose?.body ?? ""),
    ).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut|teaching|Batch 4/i,
    );

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

    expect(screen.getByRole("heading", { name: "Purpose" })).toBeTruthy();
    expect(screen.getByText(PURPOSE_BODY)).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();
    expect(document.querySelector("[data-factory-replay]")).toBeNull();
    expect(document.querySelector("[data-factory-visualizer]")).toBeNull();
  });

  test("exposes a published registry record for the nested deep-research page", async () => {
    const indexes = await loadRegistry();
    const record = getRegistryRecord(indexes, REGISTRY_ID);

    expect(record).toBeTruthy();
    expect(record?.kind).toBe("reference");
    expect(record?.id).toBe(REGISTRY_ID);
    expect(record?.slug).toBe("deep-research");
    expect(record?.status).toBe("published");
    expect(record?.aliases).toContain("@you/deep-research");
  });

  test("resolves the non-replay deep-research component map and never the shared replay map", async () => {
    const loaded = await loadRouteFamilyPageMdxComponents(
      "references",
      "packaged-factories-index/deep-research",
    );

    expect(deepResearchMapKind).toBe("non-replay");
    expect(loaded).toBe(deepResearchPageMdxComponents);
    expect(loaded).not.toBe(replayPageMdxComponents);
  });
});
