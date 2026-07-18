import { describe, expect, test } from "bun:test";
import { generateMetadata as generateWorkersMetadata } from "@/app/(site)/docs/workers/page";
import { generateMetadata as generateWorkstationsMetadata } from "@/app/(site)/docs/workstations/page";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { localizedShippedDocsPageAlternates } from "@/lib/i18n/route-locale";
import {
  DOCUMENTATION_ROUTE_MIGRATION_LEDGER,
  DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
  documentationRouteMigrationOldRouteToSlug,
  isDocumentationRouteMigrationOldPath,
  listDocumentationRouteMigrationOldRoutes,
  listDocumentationRouteMigrationTargetRoutes,
  resolveDocumentationRouteMigrationCanonicalDocsSlug,
  resolveDocumentationRouteMigrationCanonicalPath,
} from "@/lib/seo/documentation-route-migration";
import {
  isCanonicalPublicDiscoveryPath,
  isLiveFactoryCanonicalPath,
} from "@/lib/seo/export-absolute-canonical";
import {
  DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES,
  DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_INCLUSION_ROUTES,
  listPublicSitemapRoutes,
} from "@/lib/seo/public-sitemap-routes";

describe("documentation route migration canonical + sitemap (W18 story 003)", () => {
  test("remaps every §10 old docs slug to the family target slug for Metadata", () => {
    expect(listDocumentationRouteMigrationOldRoutes()).toHaveLength(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );

    for (const row of DOCUMENTATION_ROUTE_MIGRATION_LEDGER) {
      const oldSlug = documentationRouteMigrationOldRouteToSlug(row.oldRoute);
      if (!oldSlug) {
        throw new Error(`Missing slug for ${row.oldRoute}`);
      }
      const canonicalSlug = resolveDocumentationRouteMigrationCanonicalDocsSlug(
        oldSlug.join("/"),
      );
      expect(`/docs/${canonicalSlug}`).toBe(row.targetRoute);
      expect(
        resolveDocumentationRouteMigrationCanonicalPath(row.oldRoute),
      ).toBe(row.targetRoute);
      expect(
        resolveDocumentationRouteMigrationCanonicalPath(`/ja${row.oldRoute}`),
      ).toBe(row.targetRoute);
    }

    expect(
      resolveDocumentationRouteMigrationCanonicalDocsSlug("concepts/harness"),
    ).toBe("concepts/harness");
    expect(
      resolveDocumentationRouteMigrationCanonicalPath("/docs/concepts/harness"),
    ).toBeUndefined();
  });

  test("old-route compatibility Metadata declares only the new family canonical and OG url", async () => {
    for (const row of DOCUMENTATION_ROUTE_MIGRATION_LEDGER) {
      const oldSlug = documentationRouteMigrationOldRouteToSlug(row.oldRoute);
      if (!oldSlug) {
        throw new Error(`Missing slug for ${row.oldRoute}`);
      }

      const metadata = await buildDocsPageMetadata(oldSlug);
      expect(metadata.alternates?.canonical).toBe(row.targetRoute);
      expect(metadata.openGraph?.url).toBe(row.targetRoute);

      const languages = metadata.alternates?.languages ?? {};
      for (const href of Object.values(languages)) {
        const value = String(href);
        expect(
          value === row.targetRoute || value.endsWith(row.targetRoute),
        ).toBe(true);
        expect(value).not.toContain("/docs/documentation/");
      }

      expect(
        localizedShippedDocsPageAlternates(oldSlug.join("/")).canonical,
      ).toBe(row.targetRoute);
    }
  });

  test("target family pages declare only the new family canonical", async () => {
    const uniqueTargets = [
      ...new Set(listDocumentationRouteMigrationTargetRoutes()),
    ];
    expect(uniqueTargets).toHaveLength(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );

    for (const targetRoute of uniqueTargets) {
      if (targetRoute === "/docs/workers") {
        const metadata = await generateWorkersMetadata();
        expect(metadata.alternates?.canonical).toBe(targetRoute);
        continue;
      }
      if (targetRoute === "/docs/workstations") {
        const metadata = await generateWorkstationsMetadata();
        expect(metadata.alternates?.canonical).toBe(targetRoute);
        continue;
      }

      const slug = targetRoute.slice("/docs/".length);
      const metadata = await buildDocsPageMetadata(slug.split("/"));
      expect(metadata.alternates?.canonical).toBe(targetRoute);
      expect(metadata.openGraph?.url).toBe(targetRoute);
      expect(String(metadata.alternates?.canonical)).not.toContain(
        "/docs/documentation/",
      );
    }
  });

  test("sitemap excludes every §10 old path and includes every family target", () => {
    const routes = listPublicSitemapRoutes();
    const routeSet = new Set(routes);

    expect(DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES).toHaveLength(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );
    expect(DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_INCLUSION_ROUTES).toHaveLength(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );

    for (const oldRoute of DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES) {
      expect(routeSet.has(oldRoute)).toBe(false);
      expect(isDocumentationRouteMigrationOldPath(oldRoute)).toBe(true);
      // Still a live compatibility HTML path — Atlas retirement gate alone
      // does not reject it — but discovery must.
      expect(isLiveFactoryCanonicalPath(oldRoute)).toBe(true);
      expect(isCanonicalPublicDiscoveryPath(oldRoute)).toBe(false);
    }

    for (const targetRoute of DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_INCLUSION_ROUTES) {
      expect(routeSet.has(targetRoute)).toBe(true);
      expect(isCanonicalPublicDiscoveryPath(targetRoute)).toBe(true);
    }
  });
});
