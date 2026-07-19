/**
 * Story repair-moved-duplicate-doc-stubs-005: consolidates the demoted /
 * compatibility-only contract for W18 documentation move stubs.
 *
 * Locks explorer absence, ordinary discovery absence, and colocated
 * compatibility page-test presence so stubs cannot reappear as Program
 * documentation destinations without failing CI.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import DocumentationIndexPage from "@/app/(site)/docs/documentation/page";
import { FACTORY_EXPLORER_FOLDER_LABELS } from "@/lib/content/factory-breadcrumb-sidebar";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import {
  FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG,
  getDocumentationSidebarMembership,
} from "@/lib/content/sidebar-grouping";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";
import {
  buildExplorerTreeSignature,
  folderSignatureByName,
  pageEntriesInFolder,
} from "@/lib/navigation/explorer-tree-signature";
import { buildSearchDocuments } from "@/lib/search/build-documents";
import {
  DOCUMENTATION_ROUTE_MIGRATION_LEDGER,
  documentationRouteMigrationOldRouteToSlug,
  isDocumentationRouteMigrationOldBrowsePath,
  listDocumentationRouteMigrationOldRoutes,
} from "@/lib/seo/documentation-route-migration";
import { listPublicSitemapRoutes } from "@/lib/seo/public-sitemap-routes";
import { source } from "@/lib/source";

const repoRoot = join(import.meta.dir, "../../..");

describe("factory documentation W18 move-stub demoted / compat-only contract", () => {
  test("every §10 stub is absent from Program documentation explorer membership and tree", async () => {
    const membershipSlugs = Object.keys(
      FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG,
    );
    const messages = await loadUiMessages("en");
    const signature = buildExplorerTreeSignature(
      localizePageTree(source.pageTree, "en", { messages }),
    );
    const documentation = folderSignatureByName(
      signature,
      FACTORY_EXPLORER_FOLDER_LABELS.documentation,
    );
    expect(documentation).toBeTruthy();
    if (!documentation) {
      throw new Error("expected Program documentation folder");
    }
    const explorerUrls = new Set(
      pageEntriesInFolder(documentation).map((page) => page.url),
    );

    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      const slug = documentationRouteMigrationOldRouteToSlug(oldRoute);
      const pageSlug = slug?.slice(1).join("/") ?? "";

      expect(isDocumentationRouteMigrationOldBrowsePath(oldRoute)).toBe(true);
      expect(membershipSlugs).not.toContain(pageSlug);
      expect(getDocumentationSidebarMembership(pageSlug)).toBeUndefined();
      expect(explorerUrls.has(oldRoute)).toBe(false);
    }
  });

  test("every §10 stub is absent from ordinary search, sitemap, and documentation section index", async () => {
    const indexes = await loadRegistry();
    const pages = await loadPublishedDocsPages("en");
    const searchUrls = new Set(
      buildSearchDocuments(pages, indexes).map((document) => document.url),
    );
    const sitemap = new Set(listPublicSitemapRoutes());
    const sectionIndexHtml = renderToStaticMarkup(
      await DocumentationIndexPage(),
    );

    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      expect(pages.some((page) => page.url === oldRoute)).toBe(true);
      expect(searchUrls.has(oldRoute)).toBe(false);
      expect(sitemap.has(oldRoute)).toBe(false);
      expect(sectionIndexHtml).not.toContain(`href="${oldRoute}"`);
    }
  });

  test("every §10 stub keeps a colocated compatibility page test", () => {
    for (const row of DOCUMENTATION_ROUTE_MIGRATION_LEDGER) {
      const slug = documentationRouteMigrationOldRouteToSlug(row.oldRoute);
      const pageSlug = slug?.slice(1).join("/") ?? "";
      const pageTest = join(
        repoRoot,
        "src/content/docs/documentation",
        pageSlug,
        `${pageSlug}-page.test.tsx`,
      );

      expect(existsSync(pageTest), `${pageTest} must exist`).toBe(true);
    }
  });
});
