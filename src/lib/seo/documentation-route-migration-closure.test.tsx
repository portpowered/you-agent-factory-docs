/**
 * W18 story 005: prove every §10 row (old route, target route, canonical,
 * important anchor) and assert the migration ledger is fully closed.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { generateMetadata as generateWorkersMetadata } from "@/app/(site)/docs/workers/page";
import { generateMetadata as generateWorkstationsMetadata } from "@/app/(site)/docs/workstations/page";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { loadWorkersFamilyIndexBundle } from "@/content/docs/workers/load-workers-family-index";
import { WorkersFamilyIndexContent } from "@/content/docs/workers/WorkersFamilyIndexContent";
import { loadWorkstationsFamilyIndexBundle } from "@/content/docs/workstations/load-workstations-family-index";
import { WorkstationsFamilyIndexContent } from "@/content/docs/workstations/WorkstationsFamilyIndexContent";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import type { DocsSection } from "@/lib/content/content-paths";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import {
  DOCUMENTATION_ROUTE_MIGRATION_IMPORTANT_ANCHORS,
  DOCUMENTATION_ROUTE_MIGRATION_LEDGER,
  DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
  documentationRouteMigrationOldRouteToSlug,
  isDocumentationRouteMigrationLedgerFullyClosed,
  listClosedDocumentationRouteMigrationRows,
  listOpenDocumentationRouteMigrationRows,
  resolveDocumentationRouteMigrationImportantAnchor,
} from "@/lib/seo/documentation-route-migration";
import {
  isCanonicalPublicDiscoveryPath,
  isLiveFactoryCanonicalPath,
} from "@/lib/seo/export-absolute-canonical";
import { listPublicSitemapRoutes } from "@/lib/seo/public-sitemap-routes";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 90_000;

const FAMILY_INDEX_TARGETS = new Set(["/docs/workers", "/docs/workstations"]);

function targetRouteToLocalDocsRef(targetRoute: string): {
  section: DocsSection;
  slug: string;
} {
  const withoutDocs = targetRoute.replace(/^\/docs\//, "");
  const [section, ...rest] = withoutDocs.split("/");
  if (!section || rest.length === 0) {
    throw new Error(`Expected nested family page route: ${targetRoute}`);
  }
  return {
    section: section as DocsSection,
    slug: rest.join("/"),
  };
}

describe("documentation route migration closure (W18 story 005)", () => {
  afterEach(() => {
    cleanup();
  });

  test("marks every §10 ledger row closed with no open rows remaining", () => {
    expect(DOCUMENTATION_ROUTE_MIGRATION_LEDGER).toHaveLength(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );
    expect(listOpenDocumentationRouteMigrationRows()).toEqual([]);
    expect(listClosedDocumentationRouteMigrationRows()).toHaveLength(
      DOCUMENTATION_ROUTE_MIGRATION_SECTION_10_ROW_COUNT,
    );
    expect(isDocumentationRouteMigrationLedgerFullyClosed()).toBe(true);

    for (const row of DOCUMENTATION_ROUTE_MIGRATION_LEDGER) {
      expect(row.status).toBe("closed");
      const importantAnchor = resolveDocumentationRouteMigrationImportantAnchor(
        row.targetRoute,
      );
      expect(importantAnchor).toEqual(
        DOCUMENTATION_ROUTE_MIGRATION_IMPORTANT_ANCHORS[row.targetRoute],
      );
      expect(importantAnchor).toBeDefined();
    }
  });

  test("SEO discovery excludes old paths and includes family targets with matching canonicals", async () => {
    const routes = listPublicSitemapRoutes();
    const routeSet = new Set(routes);

    for (const row of DOCUMENTATION_ROUTE_MIGRATION_LEDGER) {
      expect(routeSet.has(row.oldRoute)).toBe(false);
      expect(isLiveFactoryCanonicalPath(row.oldRoute)).toBe(true);
      expect(isCanonicalPublicDiscoveryPath(row.oldRoute)).toBe(false);

      expect(routeSet.has(row.targetRoute)).toBe(true);
      expect(isCanonicalPublicDiscoveryPath(row.targetRoute)).toBe(true);

      const oldSlug = documentationRouteMigrationOldRouteToSlug(row.oldRoute);
      if (!oldSlug) {
        throw new Error(`Missing slug for ${row.oldRoute}`);
      }
      const oldMetadata = await buildDocsPageMetadata(oldSlug);
      expect(oldMetadata.alternates?.canonical).toBe(row.targetRoute);
      expect(oldMetadata.openGraph?.url).toBe(row.targetRoute);

      if (row.targetRoute === "/docs/workers") {
        const metadata = await generateWorkersMetadata();
        expect(metadata.alternates?.canonical).toBe(row.targetRoute);
        continue;
      }
      if (row.targetRoute === "/docs/workstations") {
        const metadata = await generateWorkstationsMetadata();
        expect(metadata.alternates?.canonical).toBe(row.targetRoute);
        continue;
      }

      const targetSlug = row.targetRoute.slice("/docs/".length).split("/");
      const targetMetadata = await buildDocsPageMetadata(targetSlug);
      expect(targetMetadata.alternates?.canonical).toBe(row.targetRoute);
      expect(targetMetadata.openGraph?.url).toBe(row.targetRoute);
    }
  });

  test(
    "proves old compatibility HTML, target resolution, and important anchors for every §10 row",
    async () => {
      const publishedSlugs = new Set(
        loadPublishedDocsPagesSync("en").map((page) => page.docsSlug),
      );

      for (const row of DOCUMENTATION_ROUTE_MIGRATION_LEDGER) {
        const oldSlug = documentationRouteMigrationOldRouteToSlug(row.oldRoute);
        expect(oldSlug).toBeDefined();
        const oldDocsSlug = oldSlug?.join("/") ?? "";
        expect(publishedSlugs.has(oldDocsSlug)).toBe(true);

        const fumadocsOld = source.getPage(oldSlug);
        expect(fumadocsOld).toBeDefined();
        expect(fumadocsOld?.url).toBe(row.oldRoute);

        const loadedOld = await loadLocalDocsPage({
          section: "documentation",
          slug: oldSlug?.slice(1).join("/") ?? "",
        });
        const { unmount: unmountOld } = render(
          <DocsPageProviders
            messages={loadedOld.messages}
            assets={loadedOld.assets}
          >
            {loadedOld.content}
          </DocsPageProviders>,
        );
        const compatibilityRoot = document.querySelector(
          "[data-documentation-route-compatibility]",
        );
        expect(compatibilityRoot).toBeTruthy();
        expect(
          compatibilityRoot?.getAttribute("data-compatibility-target-route"),
        ).toBe(row.targetRoute);
        const targetLink = compatibilityRoot?.querySelector(
          "[data-compatibility-target-link]",
        ) as HTMLAnchorElement | null;
        expect(targetLink?.getAttribute("href")).toBe(row.targetRoute);
        unmountOld();
        cleanup();

        const importantAnchor =
          resolveDocumentationRouteMigrationImportantAnchor(row.targetRoute);
        expect(importantAnchor).toBeDefined();

        if (FAMILY_INDEX_TARGETS.has(row.targetRoute)) {
          if (row.targetRoute === "/docs/workers") {
            const bundle = await loadWorkersFamilyIndexBundle();
            expect(bundle.route).toBe("/docs/workers");
            const { unmount } = render(
              <DocsPageProviders
                messages={bundle.messages}
                assets={bundle.assets}
              >
                <WorkersFamilyIndexContent />
              </DocsPageProviders>,
            );
            if (importantAnchor?.kind === "section") {
              expect(document.getElementById(importantAnchor.id)).toBeTruthy();
            } else {
              expect(importantAnchor?.kind).toBe("none");
            }
            unmount();
            cleanup();
            continue;
          }

          const bundle = await loadWorkstationsFamilyIndexBundle();
          expect(bundle.route).toBe("/docs/workstations");
          const { unmount } = render(
            <DocsPageProviders
              messages={bundle.messages}
              assets={bundle.assets}
            >
              <WorkstationsFamilyIndexContent />
            </DocsPageProviders>,
          );
          if (importantAnchor?.kind === "section") {
            expect(document.getElementById(importantAnchor.id)).toBeTruthy();
          } else {
            expect(importantAnchor?.kind).toBe("none");
          }
          unmount();
          cleanup();
          continue;
        }

        const targetSlug = row.targetRoute.slice("/docs/".length).split("/");
        const fumadocsTarget = source.getPage(targetSlug);
        expect(fumadocsTarget).toBeDefined();
        expect(fumadocsTarget?.url).toBe(row.targetRoute);
        expect(publishedSlugs.has(targetSlug.join("/"))).toBe(true);

        const ref = targetRouteToLocalDocsRef(row.targetRoute);
        const loadedTarget = await loadLocalDocsPage(ref);
        const { unmount: unmountTarget } = render(
          <DocsPageProviders
            messages={loadedTarget.messages}
            assets={loadedTarget.assets}
          >
            {loadedTarget.content}
          </DocsPageProviders>,
        );
        if (importantAnchor?.kind === "section") {
          expect(document.getElementById(importantAnchor.id)).toBeTruthy();
        } else {
          expect(importantAnchor?.kind).toBe("none");
        }
        unmountTarget();
        cleanup();
      }
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
