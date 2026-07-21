/**
 * Page-owned behavioral proof for the `/docs/references` family index.
 * Asserts short openingSummary purpose lead, eight discoverability hrefs,
 * ownership-path helpers, and absence of leftover introduction chrome — not
 * sibling page bodies, foreign renderer catalogs, or shared inventories.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MessageLoadError } from "@/lib/content/page-messages-load";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
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
    expect(loaded.messages.openingSummary?.length).toBeGreaterThan(0);
    expect(loaded.messages.sections?.introduction).toBeUndefined();
    expect(loaded.messages.sections?.freshness).toBeUndefined();
    expect(loaded.messages.callouts?.freshnessUnavailable).toBeUndefined();
  });

  test("loads localized family-index page chrome without English silent fallback", async () => {
    const en = await loadReferencesFamilyIndex("en");
    const ja = await loadReferencesFamilyIndex("ja");
    const zh = await loadReferencesFamilyIndex("zh-CN");
    const vi = await loadReferencesFamilyIndex("vi");

    for (const loaded of [en, ja, zh, vi]) {
      expect(loaded.messages.sections?.introduction).toBeUndefined();
      expect(loaded.messages.openingSummary?.length).toBeGreaterThan(0);
      expect(
        loaded.messages.sections?.discoverability?.title?.length,
      ).toBeGreaterThan(0);
      expect(loaded.messages.sections?.freshness).toBeUndefined();
    }

    expect(ja.messages.title).toBe("リファレンス");
    expect(ja.messages.title).not.toBe(en.messages.title);
    expect(ja.messages.sections?.discoverability?.title).toBe("コントラクト面");
    expect(ja.messages.sections?.discoverability?.title).not.toBe(
      en.messages.sections?.discoverability?.title,
    );
    expect(zh.messages.title).toBe("参考");
    expect(zh.messages.title).not.toBe(en.messages.title);
    expect(vi.messages.title).toBe("Tham chiếu");
    expect(vi.messages.title).not.toBe(en.messages.title);
    expect(ja.messages.sections?.cli?.title).toContain("CLI");
    expect(ja.messages.sections?.mcp?.title).toContain("MCP");
    expect(ja.messages.sections?.api?.title).toContain("API");
  });

  test("fails closed when a locale page-message file is missing", async () => {
    await expect(
      loadReferencesFamilyIndex("ja", join(process.cwd(), "tmp-missing-index")),
    ).rejects.toBeInstanceOf(MessageLoadError);
  });

  test("renders the purpose lead instead of empty-collection or introduction chrome", async () => {
    const loaded = await loadReferencesFamilyIndex();

    render(
      <main>
        <h1>{loaded.messages.title}</h1>
        <p>{loaded.messages.description}</p>
        <ReferencesFamilyIndex messages={loaded.messages} />
      </main>,
    );

    expect(loaded.messages.openingSummary?.length).toBeGreaterThan(0);
    const openingSummary = loaded.messages.openingSummary ?? "";
    expect(screen.getByText(openingSummary)).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "What this family covers" }),
    ).toBeNull();
    expect(
      document.querySelector("[data-references-family-index]"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-references-family-introduction]"),
    ).toBeNull();
    expect(document.querySelector("#introduction")).toBeNull();
    expect(screen.queryByText("No reference entries yet")).toBeNull();
  });

  test("keeps discoverability only—no introduction, freshness, or child-page boilerplate chrome", async () => {
    const loaded = await loadReferencesFamilyIndex();
    const sectionKeys = Object.keys(loaded.messages.sections ?? {});

    expect(sectionKeys).not.toContain("introduction");
    expect(sectionKeys).toContain("discoverability");
    expect(sectionKeys).not.toContain("freshness");
    for (const key of [
      "howToUse",
      "limitsAndAssumptions",
      "related",
      "tags",
      "references",
    ]) {
      expect(sectionKeys).not.toContain(key);
    }

    render(
      <main>
        <ReferencesFamilyIndex messages={loaded.messages} />
      </main>,
    );

    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "What this family covers" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Contract surfaces" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Package freshness" }),
    ).toBeNull();
    expect(
      document.querySelector("[data-references-family-freshness]"),
    ).toBeNull();
    expect(document.querySelector("#package-freshness")).toBeNull();
    expect(document.querySelector("[data-freshness-status]")).toBeNull();
    expect(
      document.querySelector("[data-references-family-freshness-summary]"),
    ).toBeNull();
    expect(screen.queryByText(/Package freshness unavailable/i)).toBeNull();
  });

  test("renders discoverability links for all eight planned reference routes", async () => {
    const loaded = await loadReferencesFamilyIndex();
    const cards = resolveReferenceFamilyDiscoverabilityCards(loaded.messages);

    expect(REFERENCE_FAMILY_DISCOVERABILITY_ROUTES).toHaveLength(8);
    expect(cards.map((card) => card.href)).toEqual([
      "/docs/references/api",
      "/docs/references/events",
      "/docs/references/factory-schema",
      "/docs/references/system-config-schema",
      "/docs/references/mock-workers-schema",
      "/docs/references/cli",
      "/docs/references/mcp",
      "/docs/references/javascript-runtime",
    ]);
    expect(
      cards.find(
        (card) => card.href === "/docs/references/system-config-schema",
      )?.title,
    ).toBe("System configuration schema");

    for (const card of cards) {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.description.length).toBeGreaterThan(0);
      expect(card.description).not.toMatch(
        /Model Atlas|page-meta|reader-shortcut|process prose/i,
      );
    }

    render(
      <main>
        <ReferencesFamilyIndex messages={loaded.messages} />
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "Contract surfaces" }),
    ).toBeTruthy();
    const list = screen.getByRole("list", { name: "Contract surfaces" });
    expect(
      document.querySelector("[data-references-family-discoverability]"),
    ).toBeTruthy();
    expect(
      within(list)
        .getByRole("link", {
          name: /System configuration schema/,
        })
        .getAttribute("href"),
    ).toBe("/docs/references/system-config-schema");
    expect(screen.queryByRole("link", { name: /you-config/i })).toBeNull();

    for (const card of cards) {
      const link = within(list).getByRole("link", {
        name: new RegExp(escapeRegExp(card.title)),
      });
      expect(link.getAttribute("href")).toBe(card.href);
      expect(link.textContent).toContain(card.description);
    }
  });

  test("renders localized Japanese family-index chrome with untranslated CLI/MCP/API tokens", async () => {
    const loaded = await loadReferencesFamilyIndex("ja");

    render(
      <main>
        <ReferencesFamilyIndex messages={loaded.messages} />
      </main>,
    );

    expect(
      screen.queryByRole("heading", { name: "このファミリーが扱うこと" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "コントラクト面" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "パッケージの鮮度" }),
    ).toBeNull();
    expect(screen.queryByText("What this family covers")).toBeNull();
    expect(screen.queryByText("Contract surfaces")).toBeNull();
    expect(screen.getByText(loaded.messages.openingSummary ?? "")).toBeTruthy();
    expect(screen.getByRole("link", { name: /CLI/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /MCP/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /HTTP API/ })).toBeTruthy();
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
