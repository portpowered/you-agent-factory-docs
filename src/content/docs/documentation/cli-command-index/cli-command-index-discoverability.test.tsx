/**
 * Discoverability proof for /docs/documentation/cli-command-index (story 005).
 * Covers documentation index listing, search queries, and page metadata.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import DocumentationIndexPage from "@/app/(site)/docs/documentation/page";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import { buildSearchDocuments } from "@/lib/search/build-documents";
import { docsSearchApi } from "@/lib/search/search-server";
import enMessages from "./messages/en.json";

const DOCS_SLUG = ["documentation", "cli-command-index"] as const;
const DOCS_ROUTE = "/docs/documentation/cli-command-index";
const DOCS_TITLE = "CLI Command Index";
const DOCS_DESCRIPTION =
  "Scan the core you-agent-factory CLI commands — run, submit, session, work, docs, and install entrypoints — with purpose and running-factory requirements in one structured index.";

const DISCOVERY_QUERIES = [
  "CLI command index",
  "you submit",
  "command reference",
] as const;

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("cli-command-index documentation discoverability (005)", () => {
  afterEach(() => {
    cleanup();
  });

  test("default-locale messages are complete and factory-focused", () => {
    expect(enMessages.title).toBe(DOCS_TITLE);
    expect(enMessages.description).toBe(DOCS_DESCRIPTION);
    expect(enMessages.openingSummary).toContain("CLI Command Index");
    expect(enMessages.openingSummary).toMatch(/you commands|factory/i);
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
      expect.arrayContaining([
        "CLI command index",
        "command reference",
        "you command index",
      ]),
    );
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
    "page still shows inventory rows and quick-reach links",
    async () => {
      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "cli-command-index",
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

      const commandIndexSection = document.getElementById("command-index");
      expect(commandIndexSection).toBeTruthy();
      const table = within(commandIndexSection as HTMLElement).getByRole(
        "table",
        { name: "CLI command reference index" },
      );
      expect(
        within(table).getByRole("cell", { name: "you submit" }),
      ).toBeTruthy();

      const relatedSection = document.getElementById("related");
      expect(relatedSection).toBeTruthy();
      const relatedQueries = within(relatedSection as HTMLElement);
      expect(
        relatedQueries
          .getByRole("link", { name: "Install" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/install");
      expect(
        relatedQueries
          .getByRole("link", { name: "CLI docs" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/cli");
      expect(
        relatedQueries
          .getByRole("link", { name: "Releases and changelog" })
          .getAttribute("href"),
      ).toBe("/blog/changelog");
      expect(
        screen.getByRole("heading", { name: "Freshness Ownership" }),
      ).toBeTruthy();
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
