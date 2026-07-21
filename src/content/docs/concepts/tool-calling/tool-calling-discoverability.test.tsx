/**
 * Discoverability proof for /docs/concepts/tool-calling (story 007).
 * Covers concepts index listing, search queries, sitemap, and page metadata.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import ConceptsIndexPage from "@/app/(site)/(with-docs-chrome)/docs/concepts/page";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import { buildSearchDocuments } from "@/lib/search/build-documents";
import { docsSearchApi } from "@/lib/search/search-server";
import { listPublicSitemapRoutes } from "@/lib/seo/public-sitemap-routes";
import enMessages from "./messages/en.json";

const DOCS_SLUG = ["concepts", "tool-calling"] as const;
const DOCS_ROUTE = "/docs/concepts/tool-calling";
const DOCS_TITLE = "Tool calling";
const DOCS_DESCRIPTION =
  "Tool calling is the model-inference behavior of selecting and invoking named tools during an agent or model turn, gated by worker tool policy such as agentTools.";

const DISCOVERY_QUERIES = [
  "Tool calling",
  "tool use",
  "function calling",
] as const;

describe("tool-calling concept discoverability (007)", () => {
  afterEach(() => {
    cleanup();
  });

  test("default-locale messages stay factory-focused", () => {
    expect(enMessages.title).toBe(DOCS_TITLE);
    expect(enMessages.description).toBe(DOCS_DESCRIPTION);
    expect(enMessages.description).toMatch(/model-inference behavior/i);
    expect(enMessages.title).not.toMatch(/Model Atlas|benchmark/i);
    expect(enMessages.description).not.toMatch(/Model Atlas|benchmark/i);
  });

  test("concepts index lists the page with title, description, and route", async () => {
    const html = renderToStaticMarkup(await ConceptsIndexPage());

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
      kind: "concept",
    });
    expect(document?.aliases).toEqual(
      expect.arrayContaining(["tool use", "function calling", "agentTools"]),
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
