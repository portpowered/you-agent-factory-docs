/**
 * W18 story 004: registry relatedIds, MDX/browse destinations, and related
 * href resolution prefer §10 family targets over old documentation routes.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RelatedDocs } from "@/features/docs/components/RelatedDocs";
import { loadShippedLocalizedDocsPages } from "@/lib/content/pages";
import { getRegistryRecordById } from "@/lib/content/registry-runtime";
import { resolveRelatedRegistryDocs } from "@/lib/content/related-registry-docs";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { buildBrowseCollectionSections } from "@/lib/docs/browse-collection-sections";
import { defaultLocale } from "@/lib/i18n/locale-routing";
import {
  DOCUMENTATION_ROUTE_MIGRATION_HREF_REMAP_ONLY_REGISTRY_IDS,
  DOCUMENTATION_ROUTE_MIGRATION_LEDGER,
  DOCUMENTATION_ROUTE_MIGRATION_PREFERRED_REGISTRY_IDS,
  listDocumentationRouteMigrationOldRoutes,
  remapDocumentationRouteMigrationDestinationHref,
  resolveDocumentationRouteMigrationPreferredRegistryId,
} from "@/lib/seo/documentation-route-migration";

describe("W18 documentation route migration link retarget", () => {
  test("preferred registry ids cover every §10 row that has a published family id", () => {
    const preferredOldIds = Object.keys(
      DOCUMENTATION_ROUTE_MIGRATION_PREFERRED_REGISTRY_IDS,
    );
    expect(preferredOldIds).toHaveLength(10);
    for (const oldId of preferredOldIds) {
      const preferred =
        resolveDocumentationRouteMigrationPreferredRegistryId(oldId);
      expect(preferred).not.toBe(oldId);
      expect(getRegistryRecordById(preferred)?.id).toBe(preferred);
    }
    expect(DOCUMENTATION_ROUTE_MIGRATION_HREF_REMAP_ONLY_REGISTRY_IDS).toEqual([
      "documentation.workers",
      "documentation.workstations",
    ]);
  });

  test("destination href remap covers every ledger old route", () => {
    for (const row of DOCUMENTATION_ROUTE_MIGRATION_LEDGER) {
      expect(
        remapDocumentationRouteMigrationDestinationHref(row.oldRoute),
      ).toBe(row.targetRoute);
      expect(
        remapDocumentationRouteMigrationDestinationHref(`/ja${row.oldRoute}`),
      ).toBe(`/ja${row.targetRoute}`);
    }
    expect(
      remapDocumentationRouteMigrationDestinationHref(
        "/docs/documentation/resources",
      ),
    ).toBe("/docs/documentation/resources");
  });

  test("related-registry resolution remaps workers/workstations old ids to family indexes", () => {
    const resolved = resolveRelatedRegistryDocs([
      "documentation.workers",
      "documentation.workstations",
      "documentation.factories-configuration",
    ]);
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
    expect(
      resolved.available.find(
        (item) => item.registryId === "documentation.factories-configuration",
      )?.href,
    ).toBe("/docs/factories/configuration");
  });

  test("related-registry resolution prefers published family registry ids for §10 old ids", () => {
    const resolved = resolveRelatedRegistryDocs([
      "documentation.api-doc",
      "documentation.configuration",
      "documentation.agent-workers",
    ]);
    expect(resolved.unavailable).toEqual([]);
    expect(
      resolved.available.find((item) => item.registryId === "reference.api")
        ?.href,
    ).toBe("/docs/references/api");
    expect(
      resolved.available.find(
        (item) => item.registryId === "documentation.factories-configuration",
      )?.href,
    ).toBe("/docs/factories/configuration");
    expect(
      resolved.available.find(
        (item) => item.registryId === "documentation.workers-agent",
      )?.href,
    ).toBe("/docs/workers/agent");
  });

  test("RelatedDocs for family pages does not advertise §10 old documentation hrefs", () => {
    const html = renderToStaticMarkup(
      <RelatedDocs registryId="documentation.factories-configuration" />,
    );
    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      expect(html).not.toContain(`href="${oldRoute}"`);
    }
    expect(html).toContain('href="/docs/workers"');
    expect(html).toContain('href="/docs/workstations"');
  });

  test("browse documentation section excludes §10 old compatibility routes", async () => {
    const messages = await loadUiMessages();
    const pages = await loadShippedLocalizedDocsPages(defaultLocale);
    const documentationPages = pages.filter(
      (page) => page.frontmatter.kind === "documentation",
    );
    const sections = buildBrowseCollectionSections({
      pages,
      locale: defaultLocale,
      messages,
    });
    const documentation = sections.find(
      (section) => section.id === "documentation",
    );
    expect(documentation).toBeDefined();
    const entryUrls = new Set(
      (documentation?.entries ?? []).map((entry) => entry.url),
    );
    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      expect(entryUrls.has(oldRoute)).toBe(false);
      expect(documentationPages.some((page) => page.url === oldRoute)).toBe(
        true,
      );
    }
    expect(
      documentationPages.some(
        (page) => page.url === "/docs/factories/configuration",
      ),
    ).toBe(true);
  });
});
