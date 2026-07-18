/**
 * W15 story 005: previous/next for nested family pages stays inside each
 * family's settled page-tree linearization (index + nested children), omitting
 * a direction at family edges instead of crossing collections.
 */
import { describe, expect, test } from "bun:test";
import {
  collectFamilyDocsFooterPageItems,
  resolveDirectDocsRouteFamilyFromUrl,
  resolveFamilyScopedDocsFooterNeighbors,
  toFamilyDocsPageFooterOptions,
} from "@/lib/content/factory-prev-next-related";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { DIRECT_DOCS_ROUTE_FAMILY_IDS } from "@/lib/docs/collection-definition-contract";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";
import { DELETED_ATLAS_RECORD_URLS } from "@/lib/search/factory-search-deleted-records";
import { source } from "@/lib/source";

const FAMILY_PREFIX =
  /\/docs\/(references|factories|workers|workstations)(\/|$)/;

const REPRESENTATIVE_NESTED_PAGES = [
  {
    familyId: "references" as const,
    url: "/docs/references/api",
  },
  {
    familyId: "factories" as const,
    url: "/docs/factories/configuration",
  },
  {
    familyId: "workers" as const,
    url: "/docs/workers/agent",
  },
  {
    familyId: "workstations" as const,
    url: "/docs/workstations/inference-run",
  },
] as const;

describe("W15 family previous/next topology", () => {
  test("resolves the four route families from index and nested docs URLs", () => {
    expect(REPRESENTATIVE_NESTED_PAGES.map((page) => page.familyId)).toEqual([
      ...DIRECT_DOCS_ROUTE_FAMILY_IDS,
    ]);

    for (const familyId of DIRECT_DOCS_ROUTE_FAMILY_IDS) {
      expect(resolveDirectDocsRouteFamilyFromUrl(`/docs/${familyId}`)).toBe(
        familyId,
      );
      expect(
        resolveDirectDocsRouteFamilyFromUrl(`/docs/${familyId}/child`),
      ).toBe(familyId);
      expect(
        resolveDirectDocsRouteFamilyFromUrl(`/ja/docs/${familyId}/child`),
      ).toBe(familyId);
    }

    expect(
      resolveDirectDocsRouteFamilyFromUrl("/docs/concepts/harness"),
    ).toBeNull();
    expect(resolveDirectDocsRouteFamilyFromUrl("/docs/guides")).toBeNull();
  });

  test("family linearization includes the index then nested pages only", async () => {
    const messages = await loadUiMessages();

    for (const familyId of DIRECT_DOCS_ROUTE_FAMILY_IDS) {
      const items = collectFamilyDocsFooterPageItems(
        source.pageTree,
        familyId,
        {
          indexLabel: messages.nav[familyId],
        },
      );

      expect(items[0]).toEqual({
        name: messages.nav[familyId],
        url: `/docs/${familyId}`,
      });
      expect(items.length).toBeGreaterThan(1);

      for (const item of items) {
        expect(
          item.url === `/docs/${familyId}` ||
            item.url.startsWith(`/docs/${familyId}/`),
        ).toBe(true);
        expect(
          DELETED_ATLAS_RECORD_URLS.includes(
            item.url as (typeof DELETED_ATLAS_RECORD_URLS)[number],
          ),
        ).toBe(false);
      }
    }
  });

  test("index and nested pages keep previous/next inside the same family", async () => {
    const messages = await loadUiMessages();

    for (const familyId of DIRECT_DOCS_ROUTE_FAMILY_IDS) {
      const indexLabel = messages.nav[familyId];
      const items = collectFamilyDocsFooterPageItems(
        source.pageTree,
        familyId,
        {
          indexLabel,
        },
      );
      const indexUrl = `/docs/${familyId}`;
      const nestedUrl = REPRESENTATIVE_NESTED_PAGES.find(
        (page) => page.familyId === familyId,
      )?.url;
      expect(nestedUrl).toBeDefined();

      const indexNeighbors = resolveFamilyScopedDocsFooterNeighbors(
        source.pageTree,
        indexUrl,
        { indexLabel },
      );
      expect(indexNeighbors).not.toBeNull();
      expect(indexNeighbors?.previous).toBeUndefined();
      expect(indexNeighbors?.next?.url).toBe(items[1]?.url);
      expect(indexNeighbors?.next?.url).toMatch(FAMILY_PREFIX);

      const nestedNeighbors = resolveFamilyScopedDocsFooterNeighbors(
        source.pageTree,
        nestedUrl as string,
        { indexLabel },
      );
      expect(nestedNeighbors).not.toBeNull();
      for (const neighbor of [
        nestedNeighbors?.previous,
        nestedNeighbors?.next,
      ]) {
        if (!neighbor) {
          continue;
        }
        expect(
          neighbor.url === indexUrl || neighbor.url.startsWith(`${indexUrl}/`),
        ).toBe(true);
        expect(neighbor.url).toMatch(FAMILY_PREFIX);
      }

      const firstNested = items[1];
      const lastNested = items[items.length - 1];
      expect(firstNested).toBeDefined();
      expect(lastNested).toBeDefined();

      const firstNeighbors = resolveFamilyScopedDocsFooterNeighbors(
        source.pageTree,
        firstNested?.url as string,
        { indexLabel },
      );
      expect(firstNeighbors?.previous?.url).toBe(indexUrl);
      expect(firstNeighbors?.previous?.name).toBe(indexLabel);

      const lastNeighbors = resolveFamilyScopedDocsFooterNeighbors(
        source.pageTree,
        lastNested?.url as string,
        { indexLabel },
      );
      expect(lastNeighbors?.next).toBeUndefined();
      expect(
        lastNeighbors?.previous?.url.startsWith(`${indexUrl}/`) ||
          lastNeighbors?.previous?.url === indexUrl,
      ).toBe(true);
    }
  });

  test("family edges omit a direction instead of crossing into other collections", async () => {
    const messages = await loadUiMessages();
    const references = resolveFamilyScopedDocsFooterNeighbors(
      source.pageTree,
      "/docs/references/api",
      { indexLabel: messages.nav.references },
    );
    const workstationsLast = resolveFamilyScopedDocsFooterNeighbors(
      source.pageTree,
      "/docs/workstations/standard",
      { indexLabel: messages.nav.workstations },
    );

    expect(references?.previous?.url).toBe("/docs/references");
    expect(references?.previous?.url).not.toContain("/documentation/");
    expect(workstationsLast?.next).toBeUndefined();
    expect(
      workstationsLast?.previous?.url.startsWith("/docs/workstations/"),
    ).toBe(true);

    expect(references).not.toBeNull();
    const footer = toFamilyDocsPageFooterOptions(references);
    expect(footer).toEqual({
      items: references as NonNullable<typeof references>,
    });
    expect(toFamilyDocsPageFooterOptions(null)).toBeUndefined();
    expect(toFamilyDocsPageFooterOptions({})).toEqual({ enabled: false });
  });

  test("localized family trees keep neighbors on locale-prefixed family URLs", async () => {
    const messages = await loadUiMessages("ja");
    const pageTree = localizePageTree(source.pageTree, "ja", { messages });
    const neighbors = resolveFamilyScopedDocsFooterNeighbors(
      pageTree,
      "/ja/docs/references/api",
      { indexLabel: messages.nav.references, locale: "ja" },
    );

    expect(neighbors).not.toBeNull();
    expect(neighbors?.previous?.url).toBe("/ja/docs/references");
    expect(neighbors?.next).toBeUndefined();
    if (neighbors?.previous) {
      expect(neighbors.previous.url.startsWith("/ja/docs/references")).toBe(
        true,
      );
    }
  });
});
