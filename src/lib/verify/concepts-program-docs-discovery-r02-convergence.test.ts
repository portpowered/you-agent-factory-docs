/**
 * R02 story 004 — Concepts + Program documentation discovery and links on the
 * combined R00 + R01 tip, updated for W18 move-stub demotion (repair story 005).
 *
 * Discoverable Program documentation pages stay in search/sitemap/section index.
 * Demoted §10 stubs remain published for compatibility only and must not appear
 * as ordinary discovery destinations; family routes remain the searchable targets.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import ConceptsIndexPage from "@/app/(site)/docs/concepts/page";
import DocumentationIndexPage from "@/app/(site)/docs/documentation/page";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import {
  getPublishedDocsEntryByRegistryId,
  listPublishedDocsEntries,
} from "@/lib/content/published-docs-registry-ids";
import { loadRegistry } from "@/lib/content/registry";
import { localizePath, supportedLocales } from "@/lib/i18n/locale-routing";
import { buildSearchDocuments } from "@/lib/search/build-documents";
import { docsSearchApi } from "@/lib/search/search-server";
import {
  isDocumentationRouteMigrationOldPath,
  listDocumentationRouteMigrationTargetRoutes,
  resolveDocumentationRouteMigrationTarget,
} from "@/lib/seo/documentation-route-migration";
import { listPublicSitemapRoutes } from "@/lib/seo/public-sitemap-routes";
import { source } from "@/lib/source";

const repoRoot = join(import.meta.dir, "../../..");
const NON_DEFAULT_LOCALES = supportedLocales.filter(
  (locale) => locale !== "en",
);

/** Corrected/new Concepts pages required by the R02 discovery contract. */
const R02_CONCEPTS_PAGES = [
  {
    slug: "skills",
    registryId: "concept.skills",
    title: "Skills",
    kind: "concept" as const,
    searchQuery: "Skills",
  },
  {
    slug: "mcp",
    registryId: "concept.mcp",
    title: "MCP",
    kind: "concept" as const,
    searchQuery: "Model Context Protocol",
  },
  {
    slug: "tool-calling",
    registryId: "concept.tool-calling",
    title: "Tool calling",
    kind: "concept" as const,
    searchQuery: "tool calling",
  },
  {
    slug: "tokens",
    registryId: "concept.tokens",
    title: "Tokens",
    kind: "concept" as const,
    searchQuery: "model-inference tokens",
  },
] as const;

/**
 * R01 Program documentation pages that remain ordinary discovery destinations
 * after W18 move-stub demotion.
 */
const R02_DISCOVERABLE_PROGRAM_DOCUMENTATION_PAGES = [
  {
    slug: "throttling-and-limits",
    registryId: "documentation.throttling-and-limits",
    title: "Throttling and limits",
    kind: "documentation" as const,
    searchQuery: "throttling",
  },
  {
    slug: "packaged-documents",
    registryId: "documentation.packaged-documents",
    title: "Packaged documents",
    kind: "documentation" as const,
    searchQuery: "packaged docs",
  },
] as const;

/**
 * Former R01 Program documentation pages that are now W18 move stubs:
 * published for compatibility HTML only (not search/sitemap/section-index).
 */
const R02_DEMOTED_PROGRAM_DOCUMENTATION_STUBS = [
  {
    slug: "mock-workers",
    registryId: "documentation.mock-workers",
    title: "Mock workers",
    kind: "documentation" as const,
    searchQuery: "with-mock-workers",
    familyUrl: "/docs/workers/mock",
  },
  {
    slug: "script-workers",
    registryId: "documentation.script-workers",
    title: "Script workers",
    kind: "documentation" as const,
    searchQuery: "SCRIPT_WORKER",
    familyUrl: "/docs/workers/script",
  },
  {
    slug: "poller-workers",
    registryId: "documentation.poller-workers",
    title: "Poller workers",
    kind: "documentation" as const,
    searchQuery: "POLLER_WORKER",
    familyUrl: "/docs/workers/poller",
  },
  {
    slug: "agent-workers",
    registryId: "documentation.agent-workers",
    title: "Agent workers",
    kind: "documentation" as const,
    searchQuery: "AGENT_WORKER",
    familyUrl: "/docs/workers/agent",
  },
  {
    slug: "inference-workers",
    registryId: "documentation.inference-workers",
    title: "Inference workers",
    kind: "documentation" as const,
    searchQuery: "INFERENCE_WORKER",
    familyUrl: "/docs/workers/inference",
  },
  {
    slug: "packaged-factories",
    registryId: "documentation.packaged-factories",
    title: "Packaged factories",
    kind: "documentation" as const,
    searchQuery: "packaged factories",
    familyUrl: "/docs/factories/packaged",
  },
] as const;

const R02_DISCOVERABLE_PAGES = [
  ...R02_CONCEPTS_PAGES.map((page) => ({
    ...page,
    section: "concepts" as const,
    url: `/docs/concepts/${page.slug}`,
    docsSlug: ["concepts", page.slug] as const,
  })),
  ...R02_DISCOVERABLE_PROGRAM_DOCUMENTATION_PAGES.map((page) => ({
    ...page,
    section: "documentation" as const,
    url: `/docs/documentation/${page.slug}`,
    docsSlug: ["documentation", page.slug] as const,
  })),
] as const;

const R02_DEMOTED_STUB_PAGES = R02_DEMOTED_PROGRAM_DOCUMENTATION_STUBS.map(
  (page) => ({
    ...page,
    section: "documentation" as const,
    url: `/docs/documentation/${page.slug}`,
    docsSlug: ["documentation", page.slug] as const,
  }),
);

function publishedUrlSet(): Set<string> {
  return new Set(listPublishedDocsEntries().map((entry) => entry.url));
}

function validInternalDocsHrefSet(): Set<string> {
  return new Set([
    ...publishedUrlSet(),
    ...listDocumentationRouteMigrationTargetRoutes(),
  ]);
}

function extractLocalizedLinkHrefs(section: string, slug: string): string[] {
  const mdxPath = join(repoRoot, "src/content/docs", section, slug, "page.mdx");
  const mdx = readFileSync(mdxPath, "utf8");
  return [...mdx.matchAll(/href:\s*"(\/docs\/[^"]+)"/g)].map(
    (match) => match[1] ?? "",
  );
}

function relatedIdToDocsUrl(relatedId: string): string | undefined {
  const published = getPublishedDocsEntryByRegistryId(relatedId);
  if (published) {
    return published.url;
  }

  const match = relatedId.match(
    /^(concept|documentation|guide|technique)\.(.+)$/,
  );
  if (!match) {
    return undefined;
  }

  const kind = match[1];
  const slug = match[2];
  if (!kind || !slug) {
    return undefined;
  }

  const section =
    kind === "guide"
      ? "guides"
      : kind === "technique"
        ? "techniques"
        : kind === "concept"
          ? "concepts"
          : "documentation";
  return source.getPage([section, slug])?.url;
}

describe("R02 Concepts + Program documentation discovery / links", () => {
  afterEach(() => {
    cleanup();
  });

  test("published routes resolve for Concepts and remaining discoverable Program documentation pages", async () => {
    const publishedUrls = publishedUrlSet();

    for (const page of R02_DISCOVERABLE_PAGES) {
      const fumadocsPage = source.getPage([...page.docsSlug]);
      expect(fumadocsPage, `${page.url} must resolve in source`).toBeDefined();
      expect(fumadocsPage?.url).toBe(page.url);

      const entry = getPublishedDocsEntryByRegistryId(page.registryId);
      expect(entry, `${page.registryId} must be published`).toBeDefined();
      expect(entry?.url).toBe(page.url);
      expect(entry?.pageKind).toBe(page.kind);
      expect(publishedUrls.has(page.url)).toBe(true);

      const metadata = await buildDocsPageMetadata([...page.docsSlug]);
      expect(metadata.title).toBe(page.title);
      expect(metadata.alternates?.canonical).toBe(page.url);
    }
  });

  test("demoted W18 stubs remain published with family Metadata canonical", async () => {
    const publishedUrls = publishedUrlSet();

    for (const page of R02_DEMOTED_STUB_PAGES) {
      expect(isDocumentationRouteMigrationOldPath(page.url)).toBe(true);
      expect(resolveDocumentationRouteMigrationTarget(page.url)).toBe(
        page.familyUrl,
      );

      const fumadocsPage = source.getPage([...page.docsSlug]);
      expect(fumadocsPage, `${page.url} must resolve in source`).toBeDefined();
      expect(fumadocsPage?.url).toBe(page.url);

      const entry = getPublishedDocsEntryByRegistryId(page.registryId);
      expect(entry, `${page.registryId} must stay published`).toBeDefined();
      expect(entry?.url).toBe(page.url);
      expect(publishedUrls.has(page.url)).toBe(true);

      const metadata = await buildDocsPageMetadata([...page.docsSlug]);
      expect(metadata.title).toBe(page.title);
      expect(metadata.alternates?.canonical).toBe(page.familyUrl);
    }
  });

  test("locale-prefixed equivalents resolve under ja / zh-CN / vi path policy", () => {
    for (const page of [...R02_DISCOVERABLE_PAGES, ...R02_DEMOTED_STUB_PAGES]) {
      expect(localizePath(page.url, "en")).toBe(page.url);
      for (const locale of NON_DEFAULT_LOCALES) {
        expect(localizePath(page.url, locale)).toBe(`/${locale}${page.url}`);
      }
    }

    expect(supportedLocales).toEqual(
      expect.arrayContaining(["en", "ja", "zh-CN", "vi"]),
    );
  });

  test("search indexes and public sitemap discover Concepts and non-stub Program pages only", async () => {
    const indexes = await loadRegistry();
    const pages = await loadPublishedDocsPages("en");
    const documentsByUrl = new Map(
      buildSearchDocuments(pages, indexes).map((document) => [
        document.url,
        document,
      ]),
    );
    const sitemap = new Set(listPublicSitemapRoutes());

    for (const page of R02_DISCOVERABLE_PAGES) {
      const document = documentsByUrl.get(page.url);
      expect(document, `${page.url} must be in search documents`).toBeDefined();
      expect(document).toMatchObject({
        id: page.url,
        url: page.url,
        title: page.title,
        kind: page.kind,
      });
      expect(sitemap.has(page.url)).toBe(true);
    }

    for (const page of R02_DEMOTED_STUB_PAGES) {
      expect(documentsByUrl.has(page.url)).toBe(false);
      expect(sitemap.has(page.url)).toBe(false);
    }
  });

  test.each(
    R02_DISCOVERABLE_PAGES.map(
      (page) => [page.searchQuery, page.url, page.title] as const,
    ),
  )(
    "search surfaces %s at %s",
    async (query, url) => {
      const results = await docsSearchApi.search(query);
      expect(results.some((result) => result.url === url)).toBe(true);
    },
    { timeout: 20_000 },
  );

  test.each(
    R02_DEMOTED_STUB_PAGES.map(
      (page) =>
        [page.searchQuery, page.familyUrl, page.url, page.title] as const,
    ),
  )(
    "search surfaces %s at family %s instead of stub %s",
    async (query, familyUrl, stubUrl) => {
      const results = await docsSearchApi.search(query);
      expect(results.some((result) => result.url === familyUrl)).toBe(true);
      expect(results.some((result) => result.url === stubUrl)).toBe(false);
    },
    { timeout: 20_000 },
  );

  test("concepts and documentation indexes list discoverable pages and omit demoted stubs", async () => {
    const conceptsHtml = renderToStaticMarkup(await ConceptsIndexPage());
    for (const page of R02_CONCEPTS_PAGES) {
      expect(conceptsHtml).toContain(page.title);
      expect(conceptsHtml).toContain(`/docs/concepts/${page.slug}`);
    }

    const documentationHtml = renderToStaticMarkup(
      await DocumentationIndexPage(),
    );
    for (const page of R02_DISCOVERABLE_PROGRAM_DOCUMENTATION_PAGES) {
      expect(documentationHtml).toContain(page.title);
      expect(documentationHtml).toContain(`/docs/documentation/${page.slug}`);
    }
    for (const page of R02_DEMOTED_PROGRAM_DOCUMENTATION_STUBS) {
      expect(documentationHtml).not.toContain(
        `/docs/documentation/${page.slug}`,
      );
    }
  });

  test("LocalizedLinkList and registry relatedIds resolve to published or family targets", async () => {
    const indexes = await loadRegistry();
    const validUrls = validInternalDocsHrefSet();
    const publishedUrls = publishedUrlSet();

    for (const page of R02_DISCOVERABLE_PAGES) {
      const hrefs = extractLocalizedLinkHrefs(page.section, page.slug);
      expect(hrefs.length).toBeGreaterThan(0);

      for (const href of hrefs) {
        expect(
          validUrls.has(href),
          `${page.url} LocalizedLinkList href ${href} must be published or a W18 family target`,
        ).toBe(true);
      }

      const record = indexes.byId.get(page.registryId);
      expect(
        record,
        `${page.registryId} must exist in loadRegistry`,
      ).toBeDefined();
      expect(record?.relatedIds.length).toBeGreaterThan(0);

      for (const relatedId of record?.relatedIds ?? []) {
        const relatedUrl = relatedIdToDocsUrl(relatedId);
        expect(
          relatedUrl,
          `${page.registryId} relatedId ${relatedId} must resolve`,
        ).toBeDefined();
        expect(
          publishedUrls.has(relatedUrl ?? "") ||
            validUrls.has(relatedUrl ?? ""),
          `${page.registryId} relatedId ${relatedId} -> ${relatedUrl} must be published or a W18 family target`,
        ).toBe(true);
      }
    }

    // Demoted stubs keep registry relatedIds but no LocalizedLinkList body;
    // compatibility HTML owns the family target link.
    for (const page of R02_DEMOTED_STUB_PAGES) {
      expect(extractLocalizedLinkHrefs(page.section, page.slug)).toEqual([]);

      const record = indexes.byId.get(page.registryId);
      expect(
        record,
        `${page.registryId} must exist in loadRegistry`,
      ).toBeDefined();
      expect(record?.relatedIds.length).toBeGreaterThan(0);

      for (const relatedId of record?.relatedIds ?? []) {
        const relatedUrl = relatedIdToDocsUrl(relatedId);
        expect(
          relatedUrl,
          `${page.registryId} relatedId ${relatedId} must resolve`,
        ).toBeDefined();
        expect(
          publishedUrls.has(relatedUrl ?? "") ||
            validUrls.has(relatedUrl ?? ""),
          `${page.registryId} relatedId ${relatedId} -> ${relatedUrl} must be published or a W18 family target`,
        ).toBe(true);
      }
    }
  });
});
