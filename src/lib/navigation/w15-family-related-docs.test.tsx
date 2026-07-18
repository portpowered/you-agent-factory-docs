/**
 * W15 story 006: related-doc derivation recognizes the four route families and
 * surfaces explicit high-value cross-family overrides as published related
 * links (empty/missing targets keep planned/unavailable fallbacks).
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RelatedDocs } from "@/features/docs/components/RelatedDocs";
import {
  DEFAULT_RELATED_REGISTRY_DOCS_ALL_UNAVAILABLE_FALLBACK,
  DEFAULT_RELATED_REGISTRY_DOCS_EMPTY_FALLBACK,
  RelatedRegistryDocs,
} from "@/features/docs/components/RelatedRegistryDocs";
import {
  getPublishedDocsRegistryIds,
  getRegistryRecordById,
  listRelatedRegistryRecords,
} from "@/lib/content/registry-runtime";
import {
  CURATED_RELATED,
  deriveCuratedRelatedItems,
  deriveRelatedDocGroups,
  listCuratedRelatedTargetIds,
} from "@/lib/content/related-docs";
import {
  getW15CrossFamilyRelatedOverrideIds,
  W15_CROSS_FAMILY_RELATED_PAIRS,
} from "@/lib/content/w15-family-related-overrides";
import { isDeletedAiSearchUrl } from "@/lib/search/factory-search-deleted-records";

const FAMILY_HREF =
  /^\/docs\/(references|factories|workers|workstations)(\/|$)/;

const CROSS_FAMILY_SOURCES = [
  "reference.api",
  "documentation.factories-configuration",
  "documentation.workers-agent",
  "documentation.workstations-agent-run",
  "reference.factory-schema",
] as const;

describe("W15 family related-doc topology", () => {
  test("related-doc lookup recognizes documentation and reference family records", () => {
    for (const registryId of CROSS_FAMILY_SOURCES) {
      const record = getRegistryRecordById(registryId);
      expect(record?.id).toBe(registryId);
      expect(
        record?.kind === "documentation" || record?.kind === "reference",
      ).toBe(true);
    }

    const relatedKinds = new Set(
      listRelatedRegistryRecords().map((record) => record.kind),
    );
    expect(relatedKinds.has("documentation")).toBe(true);
    expect(relatedKinds.has("reference")).toBe(true);
  });

  test("explicit high-value cross-family override pairs are bidirectional", () => {
    expect(W15_CROSS_FAMILY_RELATED_PAIRS).toEqual([
      {
        leftId: "reference.api",
        rightId: "documentation.factories-configuration",
        reason: "references ↔ factories",
      },
      {
        leftId: "documentation.workers-agent",
        rightId: "documentation.workstations-agent-run",
        reason: "workers ↔ workstations",
      },
      {
        leftId: "reference.factory-schema",
        rightId: "documentation.factories-configuration",
        reason: "references schema ↔ factories",
      },
    ]);

    for (const pair of W15_CROSS_FAMILY_RELATED_PAIRS) {
      expect(getW15CrossFamilyRelatedOverrideIds(pair.leftId)).toContain(
        pair.rightId,
      );
      expect(getW15CrossFamilyRelatedOverrideIds(pair.rightId)).toContain(
        pair.leftId,
      );
    }
  });

  test("curated derivation emits published cross-family hrefs for override pairs", () => {
    const candidates = listRelatedRegistryRecords();
    const publishedRegistryIds = getPublishedDocsRegistryIds();

    for (const pair of W15_CROSS_FAMILY_RELATED_PAIRS) {
      const left = getRegistryRecordById(pair.leftId);
      const right = getRegistryRecordById(pair.rightId);
      expect(left).toBeDefined();
      expect(right).toBeDefined();
      if (!left || !right) {
        continue;
      }

      const leftItems = deriveCuratedRelatedItems(
        left,
        candidates,
        publishedRegistryIds,
      );
      const rightItems = deriveCuratedRelatedItems(
        right,
        candidates,
        publishedRegistryIds,
      );

      const leftMatch = leftItems.find(
        (item) => item.registryId === pair.rightId,
      );
      const rightMatch = rightItems.find(
        (item) => item.registryId === pair.leftId,
      );

      expect(leftMatch?.href).toMatch(FAMILY_HREF);
      expect(rightMatch?.href).toMatch(FAMILY_HREF);
      expect(leftMatch?.isPlanned).toBe(false);
      expect(rightMatch?.isPlanned).toBe(false);
      expect(isDeletedAiSearchUrl(leftMatch?.href ?? "")).toBe(false);
      expect(isDeletedAiSearchUrl(rightMatch?.href ?? "")).toBe(false);
    }
  });

  test("deriveRelatedDocGroups includes curated cross-family destinations", () => {
    const source = getRegistryRecordById("reference.api");
    expect(source).toBeDefined();
    if (!source) {
      return;
    }

    const groups = deriveRelatedDocGroups(
      source,
      listRelatedRegistryRecords(),
      [CURATED_RELATED],
      getPublishedDocsRegistryIds(),
    );
    const curated = groups.find((group) => group.id === CURATED_RELATED);
    expect(curated).toBeDefined();
    expect(
      curated?.items.some(
        (item) =>
          item.registryId === "documentation.factories-configuration" &&
          item.href === "/docs/factories/configuration",
      ),
    ).toBe(true);
  });

  test("RelatedDocs renders high-value cross-family links for representative pages", () => {
    const apiHtml = renderToStaticMarkup(
      <RelatedDocs registryId="reference.api" />,
    );
    expect(apiHtml).toContain('data-testid="curated-related-docs"');
    expect(apiHtml).toContain('href="/docs/factories/configuration"');

    const workerHtml = renderToStaticMarkup(
      <RelatedDocs registryId="documentation.workers-agent" />,
    );
    expect(workerHtml).toContain('href="/docs/workstations/agent-run"');

    const schemaHtml = renderToStaticMarkup(
      <RelatedDocs registryId="reference.factory-schema" />,
    );
    expect(schemaHtml).toContain('href="/docs/factories/configuration"');
  });

  test("empty and missing related targets keep clear fallbacks without broken hrefs", () => {
    const emptyHtml = renderToStaticMarkup(
      <RelatedRegistryDocs registryIds={[]} />,
    );
    expect(emptyHtml).toContain(DEFAULT_RELATED_REGISTRY_DOCS_EMPTY_FALLBACK);
    expect(emptyHtml).not.toContain("href=");

    const missingHtml = renderToStaticMarkup(
      <RelatedRegistryDocs
        registryIds={["documentation.workers-family", "registry.missing.w15"]}
      />,
    );
    expect(missingHtml).toContain(
      DEFAULT_RELATED_REGISTRY_DOCS_ALL_UNAVAILABLE_FALLBACK,
    );
    expect(missingHtml).not.toContain("documentation.workers-family");
    expect(missingHtml).not.toContain("registry.missing.w15");
    expect(missingHtml).not.toContain('href="/docs/');

    const source = getRegistryRecordById("reference.api");
    expect(source).toBeDefined();
    if (!source) {
      return;
    }

    const plannedOnly = deriveCuratedRelatedItems(
      {
        ...source,
        relatedIds: ["documentation.workers-family"],
      },
      listRelatedRegistryRecords(),
      getPublishedDocsRegistryIds(),
    );
    expect(listCuratedRelatedTargetIds(source)).toContain(
      "documentation.factories-configuration",
    );
    expect(
      plannedOnly.some(
        (item) =>
          item.registryId === "documentation.workers-family" && !item.href,
      ),
    ).toBe(true);
  });
});
