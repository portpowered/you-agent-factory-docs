/**
 * Discoverability proof for /docs/documentation/packaged-documents (story 005).
 * Covers documentation index listing, search queries, sitemap, and page metadata.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import DocumentationIndexPage from "@/app/(site)/docs/documentation/page";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import { buildSearchDocuments } from "@/lib/search/build-documents";
import { docsSearchApi } from "@/lib/search/search-server";
import { listPublicSitemapRoutes } from "@/lib/seo/public-sitemap-routes";
import enMessages from "./messages/en.json";

const DOCS_SLUG = ["documentation", "packaged-documents"] as const;
const DOCS_ROUTE = "/docs/documentation/packaged-documents";
const DOCS_TITLE = "Packaged documents";
const DOCS_DESCRIPTION =
  "Packaged markdown reference topics printed from the installed you-agent-factory CLI via you docs.";

const DISCOVERY_QUERIES = [
  "packaged docs",
  "you docs",
  "packaged topics",
] as const;

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("packaged-documents documentation discoverability (005)", () => {
  afterEach(() => {
    cleanup();
  });

  test("default-locale messages are complete and factory-focused", () => {
    expect(enMessages.title).toBe(DOCS_TITLE);
    expect(enMessages.description).toBe(DOCS_DESCRIPTION);
    expect(enMessages.openingSummary).toMatch(/you docs/i);
    expect(enMessages.description).toContain("you-agent-factory");
    expect(enMessages.title).not.toMatch(/Model Atlas|benchmark/i);
    expect(enMessages.description).not.toMatch(/Model Atlas|benchmark/i);
  });

  test("documentation index lists the page with title, description, and route", async () => {
    const html = renderToStaticMarkup(await DocumentationIndexPage());

    expect(html).toContain(DOCS_TITLE);
    expect(html).toContain(DOCS_DESCRIPTION);
    expect(html).toContain(DOCS_ROUTE);
  });

  test("page metadata is factory-focused with canonical and open graph", async () => {
    const metadata = await buildDocsPageMetadata([...DOCS_SLUG]);

    expect(metadata.title).toBe(DOCS_TITLE);
    expect(metadata.description).toBe(DOCS_DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe(DOCS_ROUTE);
    expect(metadata.openGraph).toMatchObject({
      title: DOCS_TITLE,
      description: DOCS_DESCRIPTION,
    });
    expect(String(metadata.title)).not.toMatch(/Model Atlas|benchmark/i);
    expect(String(metadata.description)).not.toMatch(/Model Atlas|benchmark/i);
  });

  test("search indexes the production page with title, description, and aliases", async () => {
    const indexes = await loadRegistry();
    const pages = await loadPublishedDocsPages("en");
    const document = buildSearchDocuments(pages, indexes).find(
      (entry) => entry.url === DOCS_ROUTE,
    );

    expect(document).toMatchObject({
      id: DOCS_ROUTE,
      url: DOCS_ROUTE,
      title: DOCS_TITLE,
      description: DOCS_DESCRIPTION,
      kind: "documentation",
    });
    expect(document?.aliases).toEqual(
      expect.arrayContaining(["packaged docs", "you docs", "packaged topics"]),
    );
  });

  test("public sitemap includes the published route", () => {
    expect(listPublicSitemapRoutes()).toContain(DOCS_ROUTE);
  });

  test.each(DISCOVERY_QUERIES.map((query) => [query] as const))(
    "search surfaces the page for %s",
    async (query) => {
      const results = await docsSearchApi.search(query);
      expect(results.some((result) => result.url === DOCS_ROUTE)).toBe(true);
    },
    { timeout: 20_000 },
  );

  test(
    "related section shows Configuration, Dynamic workflows, CLI, and Packaged factories",
    async () => {
      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "packaged-documents",
      });

      render(
        <main>
          <DocsPageProviders
            messages={loadedPage.messages}
            assets={loadedPage.assets}
          >
            {loadedPage.content}
          </DocsPageProviders>
        </main>,
      );

      const relatedSection = document.getElementById("related");
      expect(relatedSection).toBeTruthy();
      const relatedQueries = within(relatedSection as HTMLElement);
      expect(
        relatedQueries
          .getByRole("link", { name: "Configuration" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/configuration");
      expect(
        relatedQueries
          .getByRole("link", { name: "Dynamic workflows" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/dynamic-workflows");
      expect(
        relatedQueries.getByRole("link", { name: "CLI" }).getAttribute("href"),
      ).toBe("/docs/documentation/cli");
      expect(
        relatedQueries
          .getByRole("link", { name: "Packaged factories" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/packaged-factories");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
