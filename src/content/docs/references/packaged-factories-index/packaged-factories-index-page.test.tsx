/**
 * Page-owned shell proof for references/packaged-factories-index.
 * Asserts published route presence, registry alignment, concise reference
 * chrome, and family-index discoverability — not enumeration rendering,
 * replay mounts, or child page bodies (later stories).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
import { source } from "@/lib/source";
import { loadReferencesFamilyIndex } from "../family-index/load-references-family-index";
import { REFERENCE_FAMILY_DISCOVERABILITY_ROUTES } from "../family-index/reference-family-routes";
import { resolveReferenceFamilyDiscoverabilityCards } from "../family-index/resolve-reference-family-discoverability";

const PAGE_URL = "/docs/references/packaged-factories-index";
const REGISTRY_ID = "reference.packaged-factories-index";

describe("packaged-factories-index reference page shell", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/references/packaged-factories-index as Packaged Factory Reference", async () => {
    const fumadocsPage = source.getPage([
      "references",
      "packaged-factories-index",
    ]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe(PAGE_URL);

    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "packaged-factories-index",
    });

    expect(loadedPage.frontmatter.kind).toBe("reference");
    expect(loadedPage.frontmatter.registryId).toBe(REGISTRY_ID);
    expect(loadedPage.frontmatter.status).toBe("published");
    expect(loadedPage.messages.title).toBe("Packaged Factory Reference");
    expect(loadedPage.messages.description).toMatch(
      /@you-agent-factory\/packaged-factories/i,
    );
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(loadedPage.messages.sections?.related).toBeUndefined();
    expect(loadedPage.messages.sections?.tags).toBeUndefined();
    expect(loadedPage.messages.sections?.references).toBeUndefined();
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.links).toBeUndefined();

    const overview = String(
      loadedPage.messages.sections?.indexOverview?.body ?? "",
    );
    expect(overview).toMatch(/allowlist order|canonical name/i);
    expect(overview).not.toMatch(
      /usage example|how to run|replay|visualizer|playback|Model Atlas/i,
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

    expect(
      screen.getByRole("heading", { name: "Packaged factory index" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.querySelector("[data-factory-replay]")).toBeNull();
    expect(document.querySelector("[data-factory-visualizer]")).toBeNull();
  });

  test("exposes a published registry record for the parent page", async () => {
    const indexes = await loadRegistry();
    const record = getRegistryRecord(indexes, REGISTRY_ID);

    expect(record).toBeTruthy();
    expect(record?.kind).toBe("reference");
    expect(record?.id).toBe(REGISTRY_ID);
    expect(record?.slug).toBe("packaged-factories-index");
    expect(record?.status).toBe("published");
    expect(record?.aliases).toContain("Packaged Factory Reference");
  });

  test("appears in references family-index discoverability cards", async () => {
    const loaded = await loadReferencesFamilyIndex();
    const cards = resolveReferenceFamilyDiscoverabilityCards(loaded.messages);
    const route = REFERENCE_FAMILY_DISCOVERABILITY_ROUTES.find(
      (entry) => entry.id === "packaged-factories-index",
    );

    expect(route?.href).toBe(PAGE_URL);
    const card = cards.find((entry) => entry.id === "packaged-factories-index");
    expect(card).toBeTruthy();
    expect(card?.href).toBe(PAGE_URL);
    expect(card?.title).toBe("Packaged Factory Reference");
    expect(card?.description.length).toBeGreaterThan(0);
  });
});
