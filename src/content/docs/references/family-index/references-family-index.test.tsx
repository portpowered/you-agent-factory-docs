/**
 * Page-owned behavioral proof for the `/docs/references` family index.
 * Asserts authored introduction, eight discoverability hrefs, package/version
 * freshness success + unavailable treatments, and ownership-path helpers —
 * not sibling page bodies, foreign renderer catalogs, or shared inventories.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
import { loadReferencesFamilyFreshnessSummary } from "./load-references-family-freshness";
import { loadReferencesFamilyIndex } from "./load-references-family-index";
import {
  isForbiddenReferencesFamilyRendererPath,
  isForbiddenReferencesFamilyRouteFamilyPath,
  isForbiddenReferencesFamilySiblingPagePath,
  isReferencesFamilyIndexOwnershipPath,
  REFERENCES_FAMILY_INDEX_FORBIDDEN_RENDERER_ROOTS,
  REFERENCES_FAMILY_INDEX_FORBIDDEN_ROUTE_FAMILY_ROOTS,
  REFERENCES_FAMILY_INDEX_FORBIDDEN_SIBLING_PAGE_ROOTS,
  REFERENCES_FAMILY_INDEX_OWNERSHIP_IMPORT,
  REFERENCES_FAMILY_INDEX_OWNERSHIP_ROOT,
} from "./ownership";
import { ReferencesFamilyIndex } from "./ReferencesFamilyIndex";
import {
  REFERENCE_FAMILY_DISCOVERABILITY_ROUTES,
  REFERENCE_FAMILY_INDEX_REGISTRY_ID,
} from "./reference-family-routes";
import { resolveReferenceFamilyDiscoverabilityCards } from "./resolve-reference-family-discoverability";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("references family index", () => {
  afterEach(() => {
    cleanup();
  });

  test("loads frontmatter aligned with the index registry id", async () => {
    const loaded = await loadReferencesFamilyIndex();

    expect(loaded.frontmatter.kind).toBe("reference");
    expect(loaded.frontmatter.registryId).toBe(
      REFERENCE_FAMILY_INDEX_REGISTRY_ID,
    );
    expect(loaded.registryId).toBe(REFERENCE_FAMILY_INDEX_REGISTRY_ID);
    expect(loaded.messages.title).toBe("References");
    expect(loaded.messages.description).toContain("Contract lookup");
    expect(loaded.messages.openingSummary).toContain("contract surfaces");
    expect(loaded.messages.sections?.introduction?.title).toBe(
      "What this family covers",
    );
    expect(loaded.messages.sections?.introduction?.body).toContain(
      "isolation-first lookup",
    );
    expect(loaded.messages.sections?.introduction?.body).not.toMatch(
      /Model Atlas|page-meta|reader-shortcut|process prose/i,
    );
    expect(loaded.messages.sections?.freshness?.title).toBe(
      "Package freshness",
    );
    expect(loaded.messages.callouts?.freshnessUnavailable?.title).toContain(
      "unavailable",
    );
  });

  test("loads package freshness from the public API manifest", () => {
    const freshness = loadReferencesFamilyFreshnessSummary();

    expect(freshness.status).toBe("ready");
    if (freshness.status !== "ready") {
      throw new Error("expected ready freshness summary");
    }
    expect(freshness.packageId.length).toBeGreaterThan(0);
    expect(freshness.packageVersion.length).toBeGreaterThan(0);
    expect(freshness.sourceCommit.length).toBeGreaterThan(0);
    expect(freshness.publicArtifactId).toBe("@you-agent-factory/api/manifest");
  });

  test("returns an explicit unavailable freshness result when the manifest cannot be read", () => {
    const freshness = loadReferencesFamilyFreshnessSummary({
      resolveExport: () => {
        throw new Error("manifest export missing in fixture");
      },
    });

    expect(freshness.status).toBe("unavailable");
    if (freshness.status !== "unavailable") {
      throw new Error("expected unavailable freshness summary");
    }
    expect(freshness.reason).toContain("manifest");
  });

  test("renders the authored introduction instead of empty-collection copy", async () => {
    const loaded = await loadReferencesFamilyIndex();
    const freshness = loadReferencesFamilyFreshnessSummary();

    render(
      <main>
        <h1>{loaded.messages.title}</h1>
        <p>{loaded.messages.description}</p>
        <ReferencesFamilyIndex
          freshness={freshness}
          messages={loaded.messages}
        />
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "What this family covers" }),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-references-family-index]"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-references-family-introduction]"),
    ).toBeTruthy();
    expect(screen.queryByText("No reference entries yet")).toBeNull();
  });

  test("renders package freshness summary on the success path", async () => {
    const loaded = await loadReferencesFamilyIndex();
    const freshness = loadReferencesFamilyFreshnessSummary();

    expect(freshness.status).toBe("ready");
    if (freshness.status !== "ready") {
      throw new Error("expected ready freshness summary");
    }

    render(
      <main>
        <ReferencesFamilyIndex
          freshness={freshness}
          messages={loaded.messages}
        />
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "Package freshness" }),
    ).toBeTruthy();
    const summary = document.querySelector(
      "[data-references-family-freshness-summary]",
    );
    expect(summary).toBeTruthy();
    expect(summary?.getAttribute("data-package-id")).toBe(freshness.packageId);
    expect(summary?.getAttribute("data-package-version")).toBe(
      freshness.packageVersion,
    );
    expect(summary?.getAttribute("data-source-commit")).toBe(
      freshness.sourceCommit,
    );
    expect(screen.getByText(freshness.packageId)).toBeTruthy();
    expect(screen.getByText(freshness.packageVersion)).toBeTruthy();
    expect(screen.getByText(freshness.sourceCommit)).toBeTruthy();
    expect(
      document.querySelector("[data-freshness-status='ready']"),
    ).toBeTruthy();
  });

  test("keeps intro and discoverability links when freshness is unavailable", async () => {
    const loaded = await loadReferencesFamilyIndex();
    const freshness = loadReferencesFamilyFreshnessSummary({
      resolveExport: () => {
        throw new Error("manifest export missing in fixture");
      },
    });
    const cards = resolveReferenceFamilyDiscoverabilityCards(loaded.messages);

    render(
      <main>
        <ReferencesFamilyIndex
          freshness={freshness}
          messages={loaded.messages}
        />
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "What this family covers" }),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-freshness-status='unavailable']"),
    ).toBeTruthy();
    expect(document.querySelector("[data-reference-error-state]")).toBeTruthy();
    expect(screen.getByText("Package freshness unavailable")).toBeTruthy();
    expect(screen.getByText(/manifest could not be read/i)).toBeTruthy();

    const list = screen.getByRole("list", { name: "Contract surfaces" });
    for (const card of cards) {
      const link = within(list).getByRole("link", {
        name: new RegExp(escapeRegExp(card.title)),
      });
      expect(link.getAttribute("href")).toBe(card.href);
    }
  });

  test("renders discoverability links for all eight planned reference routes", async () => {
    const loaded = await loadReferencesFamilyIndex();
    const freshness = loadReferencesFamilyFreshnessSummary();
    const cards = resolveReferenceFamilyDiscoverabilityCards(loaded.messages);

    expect(REFERENCE_FAMILY_DISCOVERABILITY_ROUTES).toHaveLength(8);
    expect(cards.map((card) => card.href)).toEqual([
      "/docs/references/api",
      "/docs/references/events",
      "/docs/references/factory-schema",
      "/docs/references/you-config-schema",
      "/docs/references/mock-workers-schema",
      "/docs/references/cli",
      "/docs/references/mcp",
      "/docs/references/javascript-runtime",
    ]);

    for (const card of cards) {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.description.length).toBeGreaterThan(0);
      expect(card.description).not.toMatch(
        /Model Atlas|page-meta|reader-shortcut|process prose/i,
      );
    }

    render(
      <main>
        <ReferencesFamilyIndex
          freshness={freshness}
          messages={loaded.messages}
        />
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "Contract surfaces" }),
    ).toBeTruthy();
    const list = screen.getByRole("list", { name: "Contract surfaces" });
    expect(
      document.querySelector("[data-references-family-discoverability]"),
    ).toBeTruthy();

    for (const card of cards) {
      const link = within(list).getByRole("link", {
        name: new RegExp(escapeRegExp(card.title)),
      });
      expect(link.getAttribute("href")).toBe(card.href);
      expect(link.textContent).toContain(card.description);
    }
  });

  test("exposes a page-local registry record for the family index", async () => {
    const indexes = await loadRegistry();
    const record = getRegistryRecord(
      indexes,
      REFERENCE_FAMILY_INDEX_REGISTRY_ID,
    );

    expect(record).toBeTruthy();
    expect(record?.kind).toBe("reference");
    expect(record?.id).toBe(REFERENCE_FAMILY_INDEX_REGISTRY_ID);
    expect(record?.slug).toBe("references");
    expect(record?.relatedIds).toEqual([]);
  });

  test("keeps ownership distinct from sibling pages and foreign renderers", () => {
    expect(REFERENCES_FAMILY_INDEX_OWNERSHIP_ROOT).toBe(
      "src/content/docs/references/family-index",
    );
    expect(REFERENCES_FAMILY_INDEX_OWNERSHIP_IMPORT).toBe(
      "@/content/docs/references/family-index",
    );
    expect(
      existsSync(join(process.cwd(), REFERENCES_FAMILY_INDEX_OWNERSHIP_ROOT)),
    ).toBe(true);
    expect(
      isReferencesFamilyIndexOwnershipPath(
        REFERENCES_FAMILY_INDEX_OWNERSHIP_ROOT,
      ),
    ).toBe(true);
    expect(
      isReferencesFamilyIndexOwnershipPath(
        `${REFERENCES_FAMILY_INDEX_OWNERSHIP_ROOT}/ReferencesFamilyIndex.tsx`,
      ),
    ).toBe(true);

    expect(REFERENCES_FAMILY_INDEX_FORBIDDEN_SIBLING_PAGE_ROOTS).toHaveLength(
      8,
    );
    expect(REFERENCES_FAMILY_INDEX_FORBIDDEN_RENDERER_ROOTS).toContain(
      "src/components/references/api",
    );
    expect(REFERENCES_FAMILY_INDEX_FORBIDDEN_ROUTE_FAMILY_ROOTS).toContain(
      "src/content/docs/factories",
    );

    expect(
      isForbiddenReferencesFamilySiblingPagePath(
        "src/content/docs/references/api/page.mdx",
      ),
    ).toBe(true);
    expect(
      isForbiddenReferencesFamilyRendererPath(
        "src/components/references/schema/schema-surface.tsx",
      ),
    ).toBe(true);
    expect(
      isForbiddenReferencesFamilyRouteFamilyPath(
        "src/content/docs/workers/example/page.mdx",
      ),
    ).toBe(true);
    expect(
      isForbiddenReferencesFamilySiblingPagePath(
        `${REFERENCES_FAMILY_INDEX_OWNERSHIP_ROOT}/ownership.ts`,
      ),
    ).toBe(false);
    expect(
      isForbiddenReferencesFamilyRendererPath(
        `${REFERENCES_FAMILY_INDEX_OWNERSHIP_ROOT}/ownership.ts`,
      ),
    ).toBe(false);
  });
});
