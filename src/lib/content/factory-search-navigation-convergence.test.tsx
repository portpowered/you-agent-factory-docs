/**
 * Story converge-factory-search-navigation-009 proof: focused end-to-end
 * search/link integration covering factory categories, alias/body/tag
 * discovery, deleted-record exclusion, tags/browse/breadcrumb/sidebar/
 * previous-next/related behavior, locale/base-path correctness, and
 * empty/malformed/unavailable/deleted-content cases.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 * Per-story suites (001–008) remain the detailed contracts; this file is the
 * cross-cutting convergence gate for the PRD.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBrowseIndexPage,
  renderTagsIndexPage,
} from "@/app/(site)/site-renderers";
import {
  buildDocsBreadcrumbSegments,
  DocsPageBreadcrumb,
} from "@/features/docs/components/DocsPageBreadcrumb";
import { SearchResultMetaDetails } from "@/features/docs/search/SearchResultMetaDetails";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  assertFactoryBreadcrumbSegments,
  FACTORY_EXPLORER_FOLDER_LABELS,
  FACTORY_NAV_COLLECTION_IDS,
  FACTORY_SIDEBAR_COLLECTION_IDS,
  RETIRED_ATLAS_NAV_COLLECTION_IDS,
  RETIRED_ATLAS_NAV_FOLDER_LABELS,
} from "@/lib/content/factory-breadcrumb-sidebar";
import {
  FACTORY_PAGES_BASE_PATH,
  FACTORY_SHIPPED_LOCALES,
  resolveFactoryDocsPageHref,
  resolveFactorySearchBootstrapFrom,
  resolveFactorySearchResultHref,
  resolveFactorySurfaceHref,
} from "@/lib/content/factory-locale-base-path";
import {
  assertFactoryFooterNeighbors,
  resolveFactoryDocsFooterNeighbors,
} from "@/lib/content/factory-prev-next-related";
import {
  assertFactorySearchEmptySuggestionCopy,
  assertFactorySearchEmptySuggestionHref,
  assertFactorySearchNavOmitsDeletedContent,
  assertFactorySearchUnavailableCopy,
  FACTORY_MALFORMED_SEARCH_CLASSIFICATIONS,
  FACTORY_SEARCH_EMPTY_SUGGESTION_HREF,
  FACTORY_SEARCH_EMPTY_SUGGESTION_TERM,
  FACTORY_SEARCH_UNAVAILABLE_TEST_IDS,
  resolveFactorySearchEmptySuggestion,
} from "@/lib/content/factory-search-edge-cases";
import {
  DELETED_ATLAS_TAG_SLUGS,
  FACTORY_PUBLISHED_TAG_SLUGS,
} from "@/lib/content/factory-tags-browse";
import { resolveRelatedRegistryDocs } from "@/lib/content/related-registry-docs";
import { loadPublishedTagIndexEntries } from "@/lib/content/tags";
import { formatPageKind, loadUiMessages } from "@/lib/content/ui-messages";
import { DOCS_BROWSE_COLLECTION_IDS } from "@/lib/docs/browse-collection-sections";
import { defaultLocale } from "@/lib/i18n/locale-routing";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";
import { collectSidebarPageLinks } from "@/lib/navigation/docs-sidebar-contract";
import { buildGeneratedDocsPageTree } from "@/lib/navigation/generated-docs-page-tree";
import { resolveSearchClassificationScope } from "@/lib/search/classification-scope";
import { documentsByUrlFromMeta } from "@/lib/search/collapse-search-results-from-meta";
import { DOCS_SEARCH_API_PATH } from "@/lib/search/docs-search-bootstrap-path";
import {
  DELETED_ATLAS_BLOG_URLS,
  DELETED_ATLAS_RECORD_URLS,
  isDeletedAiSearchUrl,
} from "@/lib/search/factory-search-deleted-records";
import {
  FACTORY_SEARCH_RESULT_KINDS,
  isFactorySearchResultKind,
  isRetiredAtlasSearchResultKind,
  RETIRED_ATLAS_SEARCH_RESULT_KINDS,
} from "@/lib/search/factory-search-kinds";
import { loadSearchResultMetaMap } from "@/lib/search/search-result-meta";
import { docsSearchApi } from "@/lib/search/search-server";
import { searchResultMetaMapToRecord } from "@/lib/search/serialize-result-meta";
import { source } from "@/lib/source";

const REPO_ROOT = join(import.meta.dir, "../../..");

const REQUIRED_STORY_PROOFS = [
  "src/lib/content/factory-search-categories.test.tsx",
  "src/lib/content/factory-search-alias-body-tag.test.ts",
  "src/lib/content/factory-search-deleted-records.test.ts",
  "src/lib/content/factory-tags-browse.test.tsx",
  "src/lib/content/factory-breadcrumb-sidebar.test.tsx",
  "src/lib/content/factory-prev-next-related.test.tsx",
  "src/lib/content/factory-locale-base-path.test.tsx",
  "src/lib/content/factory-search-edge-cases.test.tsx",
] as const;

const FACTORY_CATEGORY_SET = [
  "concept",
  "guide",
  "technique",
  "documentation",
  "glossary",
  "reference",
  "blog",
] as const;

const REPRESENTATIVE_PAGES = [
  {
    slug: ["guides", "getting-started"] as const,
    title: "Getting Started",
    href: "/docs/guides/getting-started",
    collectionId: "guides",
    collectionLabel: "Guides",
  },
  {
    slug: ["concepts", "harness"] as const,
    title: "Harness",
    href: "/docs/concepts/harness",
    collectionId: "concepts",
    collectionLabel: "Concepts",
  },
  {
    slug: ["techniques", "ralph"] as const,
    title: "Ralph",
    href: "/docs/techniques/ralph",
    collectionId: "techniques",
    collectionLabel: "Techniques",
  },
  {
    slug: ["documentation", "what-is-you-agent-factory"] as const,
    title: "What is you-agent-factory",
    href: "/docs/documentation/what-is-you-agent-factory",
    collectionId: "documentation",
    collectionLabel: "Program documentation",
  },
] as const;

const ALIAS_CASES = [
  { alias: "agent runtime", url: "/docs/concepts/harness" },
  { alias: "Ralph loop", url: "/docs/techniques/ralph" },
  { alias: "Quickstart", url: "/docs/guides/getting-started" },
] as const;

const BODY_CASES = [
  { phrase: "one-story-per-iteration", url: "/docs/techniques/ralph" },
] as const;

const DELETED_QUERIES = [
  "grouped-query attention",
  "GQA",
  "evolution of diffusion",
] as const;

const NO_MATCH_QUERY = "zzzz-no-matches-zzzz-factory-convergence";

const PROJECT_SITE_BOOTSTRAP = `${BUILT_APP_GITHUB_PAGES_BASE_PATH}${DOCS_SEARCH_API_PATH}`;

describe("factory search and navigation convergence end-to-end", () => {
  test("required per-story search/nav proofs remain in the required suite", () => {
    for (const relativePath of REQUIRED_STORY_PROOFS) {
      expect(existsSync(join(REPO_ROOT, relativePath))).toBe(true);
    }
  });

  test("search categories stay factory-only for harness and ralph", async () => {
    expect([...FACTORY_SEARCH_RESULT_KINDS]).toEqual([...FACTORY_CATEGORY_SET]);
    for (const kind of RETIRED_ATLAS_SEARCH_RESULT_KINDS) {
      expect(isFactorySearchResultKind(kind)).toBe(false);
      expect(isRetiredAtlasSearchResultKind(kind)).toBe(true);
    }

    const metaByUrl = searchResultMetaMapToRecord(
      await loadSearchResultMetaMap(),
    );
    const messages = await loadUiMessages();

    for (const query of ["harness", "ralph"] as const) {
      const results = await docsSearchApi.search(query);
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        if (result.type !== "page") continue;
        const meta = metaByUrl[result.url];
        expect(meta).toBeDefined();
        expect(isFactorySearchResultKind(meta.kind)).toBe(true);
        const html = renderToStaticMarkup(
          <SearchResultMetaDetails
            url={result.url}
            meta={meta}
            messages={messages}
          />,
        );
        expect(html).toContain(formatPageKind(messages, meta.kind));
      }
    }

    expect((await docsSearchApi.search("harness"))[0]?.url).toBe(
      "/docs/concepts/harness",
    );
    expect((await docsSearchApi.search("ralph"))[0]?.url).toBe(
      "/docs/techniques/ralph",
    );
  });

  test(
    "alias, body, and tag discovery find live factory pages only",
    async () => {
      for (const { alias, url } of ALIAS_CASES) {
        const results = await docsSearchApi.search(alias);
        expect(results.some((result) => result.url === url)).toBe(true);
      }
      for (const { phrase, url } of BODY_CASES) {
        const results = await docsSearchApi.search(phrase);
        expect(results.some((result) => result.url === url)).toBe(true);
      }

      const tagFiltered = await docsSearchApi.search("bottlenecks", {
        tag: ["foundations"],
      });
      expect(
        tagFiltered.some((result) => result.url === "/blog/bottlenecks"),
      ).toBe(true);
      for (const atlasTag of ["attention", "model-family", "alignment"]) {
        const atlasFiltered = await docsSearchApi.search("bottlenecks", {
          tag: [atlasTag],
        });
        expect(
          atlasFiltered.some((result) => result.url === "/blog/bottlenecks"),
        ).toBe(false);
      }
    },
    { timeout: 20_000 },
  );

  test(
    "deleted AI records stay out of search while factory pages remain",
    async () => {
      const metaByUrl = await loadSearchResultMetaMap();
      for (const url of metaByUrl.keys()) {
        expect(isDeletedAiSearchUrl(url)).toBe(false);
      }
      for (const deleted of [
        ...DELETED_ATLAS_RECORD_URLS,
        ...DELETED_ATLAS_BLOG_URLS,
      ]) {
        expect(metaByUrl.has(deleted)).toBe(false);
      }

      for (const query of DELETED_QUERIES) {
        const results = await docsSearchApi.search(query);
        assertFactorySearchNavOmitsDeletedContent(
          results.filter((hit) => hit.type === "page").map((hit) => hit.url),
        );
      }

      expect(
        (await docsSearchApi.search("harness")).some(
          (result) => result.url === "/docs/concepts/harness",
        ),
      ).toBe(true);
    },
    { timeout: 20_000 },
  );

  test("tags and browse hubs expose factory destinations only", async () => {
    const messages = await loadUiMessages();
    const browseHtml = renderToStaticMarkup(await renderBrowseIndexPage());
    const tagsHtml = renderToStaticMarkup(await renderTagsIndexPage());

    expect([...DOCS_BROWSE_COLLECTION_IDS]).toEqual([
      "guides",
      "concepts",
      "techniques",
      "documentation",
    ]);
    for (const id of DOCS_BROWSE_COLLECTION_IDS) {
      expect(browseHtml).toContain(`id="${id}-heading"`);
      expect(browseHtml).toContain(`href="/docs/${id}"`);
    }
    for (const id of RETIRED_ATLAS_NAV_COLLECTION_IDS) {
      expect(browseHtml).not.toContain(`id="${id}-heading"`);
      expect(browseHtml).not.toContain(`href="/docs/${id}"`);
    }

    const tagEntries = await loadPublishedTagIndexEntries(messages, "en");
    const publishedSlugs = tagEntries.map((entry) => entry.slug).sort();
    expect(publishedSlugs).toEqual([...FACTORY_PUBLISHED_TAG_SLUGS].sort());
    for (const slug of DELETED_ATLAS_TAG_SLUGS) {
      expect(publishedSlugs).not.toContain(slug);
      expect(tagsHtml).not.toContain(`href="/tags/${slug}"`);
    }
    for (const slug of FACTORY_PUBLISHED_TAG_SLUGS) {
      expect(tagsHtml).toContain(`href="/tags/${slug}"`);
    }
  });

  test("breadcrumbs and sidebar stay on factory collections", async () => {
    const messages = await loadUiMessages();
    const pageTree = buildGeneratedDocsPageTree({
      name: "Docs",
      children: [],
    });
    const folderNames = pageTree.children
      .filter((node) => node.type === "folder")
      .map((folder) => String(folder.name));

    expect([...FACTORY_NAV_COLLECTION_IDS]).toEqual([
      "guides",
      "concepts",
      "techniques",
      "documentation",
      "glossary",
      "references",
      "factories",
      "workers",
      "workstations",
    ]);
    expect([...FACTORY_SIDEBAR_COLLECTION_IDS]).toEqual([
      "guides",
      "concepts",
      "techniques",
      "documentation",
    ]);
    expect(folderNames).toEqual(Object.values(FACTORY_EXPLORER_FOLDER_LABELS));
    expect(folderNames).not.toContain("Glossary");
    expect(pageTree.name).toBe("You Agent Factory");
    for (const label of RETIRED_ATLAS_NAV_FOLDER_LABELS) {
      expect(folderNames).not.toContain(label);
    }

    const sidebarLinks = collectSidebarPageLinks(pageTree);
    assertFactorySearchNavOmitsDeletedContent(
      sidebarLinks.map((link) => link.url),
    );

    for (const page of REPRESENTATIVE_PAGES) {
      const segments = buildDocsBreadcrumbSegments(
        [...page.slug],
        page.title,
        messages,
      );
      assertFactoryBreadcrumbSegments(segments);
      expect(segments.map((segment) => segment.label)).toEqual([
        "Home",
        page.collectionLabel,
        page.title,
      ]);
      expect(segments[1]?.href).toBe(`/docs/${page.collectionId}`);

      const html = renderToStaticMarkup(
        <DocsPageBreadcrumb
          messages={messages}
          slug={[...page.slug]}
          title={page.title}
        />,
      );
      expect(html).toContain('href="/"');
      expect(html).toContain(`href="/docs/${page.collectionId}"`);
      expect(html).toContain(`>${page.collectionLabel}<`);
      expect(html).toContain(`>${page.title}<`);
      for (const id of RETIRED_ATLAS_NAV_COLLECTION_IDS) {
        expect(html).not.toContain(`href="/docs/${id}"`);
      }
    }
  });

  test("previous/next and related links stay on factory destinations", () => {
    const neighbors = resolveFactoryDocsFooterNeighbors(
      source.pageTree,
      "/docs/concepts/harness",
    );
    assertFactoryFooterNeighbors(neighbors);
    expect(neighbors.previous?.url).toBe("/docs/concepts/compaction");
    expect(neighbors.next?.url).toBe("/docs/concepts/loop");

    const related = resolveRelatedRegistryDocs([
      "concept.bottlenecks",
      "concept.harness",
    ]);
    expect(related.available.length).toBeGreaterThan(0);
    assertFactorySearchNavOmitsDeletedContent(
      related.available.map((item) => item.href),
    );
    expect(related.available.map((item) => item.href)).toEqual([
      "/docs/concepts/bottlenecks",
      "/docs/concepts/harness",
    ]);

    const emptyRelated = resolveRelatedRegistryDocs([]);
    expect(emptyRelated.available).toEqual([]);
    expect(emptyRelated.unavailable).toEqual([]);
  });

  test("locale and Pages base path stay correct on search and nav hrefs", () => {
    expect([...FACTORY_SHIPPED_LOCALES]).toEqual(["en", "ja", "zh-CN", "vi"]);
    expect(FACTORY_PAGES_BASE_PATH).toBe("/you-agent-factory-docs");

    expect(resolveFactorySurfaceHref("search", defaultLocale)).toBe("/search");
    expect(resolveFactorySurfaceHref("browse", "ja")).toBe("/ja/browse");
    expect(resolveFactoryDocsPageHref("concepts/harness", "vi")).toBe(
      "/vi/docs/concepts/harness",
    );
    expect(
      resolveFactorySearchResultHref("/docs/techniques/ralph", "zh-CN"),
    ).toBe("/zh-CN/docs/techniques/ralph");

    expect(resolveFactorySearchBootstrapFrom("en", {})).toBe(
      DOCS_SEARCH_API_PATH,
    );
    expect(resolveFactorySearchBootstrapFrom("ja", {})).toBe(
      `${DOCS_SEARCH_API_PATH}?locale=ja`,
    );

    const exportEnv = {
      NEXT_STATIC_EXPORT: "1",
      GITHUB_PAGES_BASE_PATH: BUILT_APP_GITHUB_PAGES_BASE_PATH,
    };
    expect(resolveFactorySearchBootstrapFrom("en", exportEnv)).toBe(
      PROJECT_SITE_BOOTSTRAP,
    );
    expect(resolveFactorySearchBootstrapFrom("ja", exportEnv)).toBe(
      `${PROJECT_SITE_BOOTSTRAP}.ja`,
    );

    const localizedTree = localizePageTree(source.pageTree, "ja");
    const jaNeighbors = resolveFactoryDocsFooterNeighbors(
      localizedTree,
      "/ja/docs/guides/getting-started",
    );
    if (jaNeighbors.next) {
      expect(jaNeighbors.next.url.startsWith("/ja/")).toBe(true);
    }
  });

  test(
    "empty, malformed, unavailable, and deleted-content cases stay factory-only",
    async () => {
      const messages = await loadUiMessages();
      const emptyCopy = {
        emptySuggestionTerm: messages.searchEntry.emptySuggestionTerm,
        emptySuggestionLinkLabel: messages.searchEntry.emptySuggestionLinkLabel,
        emptySuggestionPrefix: messages.searchEntry.emptySuggestionPrefix,
        emptySuggestionMiddle: messages.searchEntry.emptySuggestionMiddle,
        emptySuggestionSuffix: messages.searchEntry.emptySuggestionSuffix,
        noResults: messages.search.noResults,
      };
      const suggestion = resolveFactorySearchEmptySuggestion("en", emptyCopy);
      expect(suggestion.term).toBe(FACTORY_SEARCH_EMPTY_SUGGESTION_TERM);
      expect(suggestion.href).toBe(FACTORY_SEARCH_EMPTY_SUGGESTION_HREF);
      assertFactorySearchEmptySuggestionHref(suggestion.href);
      assertFactorySearchEmptySuggestionCopy(emptyCopy);
      assertFactorySearchUnavailableCopy({
        error: messages.search.error,
        retry: messages.search.retry,
      });
      expect([...FACTORY_SEARCH_UNAVAILABLE_TEST_IDS]).toEqual([
        "search-page-error",
        "search-dialog-error",
      ]);

      const noMatch = await docsSearchApi.search(NO_MATCH_QUERY);
      expect(noMatch).toEqual([]);

      const metaByUrl = documentsByUrlFromMeta(
        searchResultMetaMapToRecord(await loadSearchResultMetaMap()),
      );
      for (const classification of FACTORY_MALFORMED_SEARCH_CLASSIFICATIONS) {
        const scope = resolveSearchClassificationScope(
          classification,
          metaByUrl,
        );
        expect(scope).toBeUndefined();
      }

      const tagEntries = await loadPublishedTagIndexEntries(messages, "en");
      assertFactorySearchNavOmitsDeletedContent([
        ...tagEntries.map((entry) => `/tags/${entry.slug}`),
        ...DOCS_BROWSE_COLLECTION_IDS.map((id) => `/docs/${id}`),
        ...collectSidebarPageLinks(
          buildGeneratedDocsPageTree({ name: "Docs", children: [] }),
        ).map((link) => link.url),
        ...resolveRelatedRegistryDocs([
          "concept.bottlenecks",
          "concept.harness",
        ]).available.map((item) => item.href),
      ]);
    },
    { timeout: 15_000 },
  );
});
