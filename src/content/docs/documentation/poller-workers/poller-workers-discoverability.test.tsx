/**
 * Discoverability proof for /docs/documentation/poller-workers (story 006).
 * Covers documentation index listing, search documents/aliases, sitemap, and
 * page metadata — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import DocumentationIndexPage from "@/app/(site)/docs/documentation/page";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import { buildSearchDocuments } from "@/lib/search/build-documents";
import { docsSearchApi } from "@/lib/search/search-server";
import { listPublicSitemapRoutes } from "@/lib/seo/public-sitemap-routes";
import enMessages from "./messages/en.json";

const DOCS_SLUG = ["documentation", "poller-workers"] as const;
const DOCS_ROUTE = "/docs/documentation/poller-workers";
const DOCS_TITLE = "Poller workers";
const DOCS_DESCRIPTION =
  "Author you-agent-factory POLLER_WORKER backends: hosted provider and secret refs on the worker, behavior POLLER on the workstation, and poller ingress for external work.";

const DISCOVERY_QUERIES = [
  "POLLER_WORKER",
  "hosted poller",
  "Linear poller",
  "poller requestId",
] as const;

describe("poller-workers documentation discoverability (006)", () => {
  afterEach(() => {
    cleanup();
  });

  test("default-locale messages stay factory-focused", () => {
    expect(enMessages.title).toBe(DOCS_TITLE);
    expect(enMessages.description).toBe(DOCS_DESCRIPTION);
    expect(enMessages.description).toMatch(/POLLER_WORKER/i);
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
      expect.arrayContaining([
        "POLLER_WORKER",
        "hosted poller",
        "Linear poller",
        "poller requestId",
      ]),
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
});
