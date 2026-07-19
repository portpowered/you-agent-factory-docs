/**
 * Story repair-moved-duplicate-doc-stubs-004: inbound registry / related-link
 * destinations prefer W18 ledger family routes over move-stub URLs.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RegistryLinkList } from "@/features/docs/components/RegistryLinkList";
import { RelatedDocs } from "@/features/docs/components/RelatedDocs";
import {
  getPublishedDocsHrefForRecord,
  PUBLISHED_DOCS_REGISTRY_IDS,
} from "@/lib/content/published-docs-registry-ids";
import { registryRecordHref } from "@/lib/content/registry-linking";
import {
  getRegistryRecordById,
  listRelatedRegistryRecords,
} from "@/lib/content/registry-runtime";
import { resolveRelatedRegistryDocs } from "@/lib/content/related-registry-docs";
import {
  DOCUMENTATION_ROUTE_MIGRATION_HREF_REMAP_ONLY_REGISTRY_IDS,
  DOCUMENTATION_ROUTE_MIGRATION_PREFERRED_REGISTRY_IDS,
  listDocumentationRouteMigrationOldRoutes,
  listDocumentationRouteMigrationTargetRoutes,
} from "@/lib/seo/documentation-route-migration";

const STUB_REGISTRY_IDS = [
  ...Object.keys(DOCUMENTATION_ROUTE_MIGRATION_PREFERRED_REGISTRY_IDS),
  ...DOCUMENTATION_ROUTE_MIGRATION_HREF_REMAP_ONLY_REGISTRY_IDS,
] as const;

const OLD_ROUTES = new Set(listDocumentationRouteMigrationOldRoutes());
const FAMILY_ROUTES = new Set(listDocumentationRouteMigrationTargetRoutes());

describe("factory documentation W18 inbound link retarget", () => {
  test("registryRecordHref remaps every §10 stub published URL to its family route", () => {
    for (const registryId of STUB_REGISTRY_IDS) {
      const record = getRegistryRecordById(registryId);
      expect(record).toBeDefined();
      if (!record) {
        continue;
      }
      expect(record.id).toBe(registryId);
      const published = getPublishedDocsHrefForRecord(record);
      expect(published).toBeTruthy();
      expect(OLD_ROUTES.has(published as `/${string}`)).toBe(true);
      const href = registryRecordHref(record);
      expect(href).toBeTruthy();
      expect(OLD_ROUTES.has(href as `/${string}`)).toBe(false);
      expect(FAMILY_ROUTES.has(href as `/${string}`)).toBe(true);
    }
  });

  test("preferred old related ids resolve to family registry destinations", () => {
    for (const [oldId, preferredId] of Object.entries(
      DOCUMENTATION_ROUTE_MIGRATION_PREFERRED_REGISTRY_IDS,
    )) {
      const resolved = resolveRelatedRegistryDocs([oldId]);
      expect(resolved.unavailable).toEqual([]);
      expect(resolved.available).toHaveLength(1);
      expect(resolved.available[0]?.registryId).toBe(preferredId);
      expect(OLD_ROUTES.has(resolved.available[0]?.href as `/${string}`)).toBe(
        false,
      );
      expect(
        FAMILY_ROUTES.has(resolved.available[0]?.href as `/${string}`),
      ).toBe(true);
    }
  });

  test("workers/workstations related ids keep stub registry identity but family hrefs", () => {
    const resolved = resolveRelatedRegistryDocs([
      "documentation.workers",
      "documentation.workstations",
    ]);
    expect(resolved.unavailable).toEqual([]);
    expect(
      resolved.available.find(
        (item) => item.registryId === "documentation.workers",
      )?.href,
    ).toBe("/docs/workers");
    expect(
      resolved.available.find(
        (item) => item.registryId === "documentation.workstations",
      )?.href,
    ).toBe("/docs/workstations");
  });

  test("non-stub relatedIds that still name stub registry ids never emit stub hrefs", () => {
    const stubIdSet = new Set<string>(STUB_REGISTRY_IDS);
    for (const record of listRelatedRegistryRecords()) {
      if (stubIdSet.has(record.id)) {
        continue;
      }
      if (!PUBLISHED_DOCS_REGISTRY_IDS.has(record.id)) {
        continue;
      }
      const stubRelated = record.relatedIds.filter((id) => stubIdSet.has(id));
      if (stubRelated.length === 0) {
        continue;
      }
      const resolved = resolveRelatedRegistryDocs(record.relatedIds);
      for (const item of resolved.available) {
        expect(OLD_ROUTES.has(item.href as `/${string}`)).toBe(false);
      }
    }
  });

  test("RelatedDocs and RegistryLinkList do not advertise §10 old stub hrefs", () => {
    const relatedHtml = renderToStaticMarkup(
      <RelatedDocs registryId="documentation.factories-configuration" />,
    );
    const linkListHtml = renderToStaticMarkup(
      <RegistryLinkList
        registryIds={[
          "documentation.api-doc",
          "documentation.workers",
          "documentation.configuration",
        ]}
        emptyLabel="none"
      />,
    );
    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      expect(relatedHtml).not.toContain(`href="${oldRoute}"`);
      expect(linkListHtml).not.toContain(`href="${oldRoute}"`);
    }
    expect(linkListHtml).toContain('href="/docs/references/api"');
    expect(linkListHtml).toContain('href="/docs/workers"');
    expect(linkListHtml).toContain('href="/docs/factories/configuration"');
  });
});
