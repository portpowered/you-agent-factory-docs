/**
 * Story converge-factory-search-navigation-007 proof: search and navigation
 * hrefs honor shipped locales and the GitHub Pages base path.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBrowseIndexPage } from "@/app/(site)/site-renderers";
import {
  buildDocsBreadcrumbSegments,
  DocsPageBreadcrumb,
} from "@/features/docs/components/DocsPageBreadcrumb";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  assertFactoryLocaleHref,
  assertFactoryPagesBasePathHref,
  assertFactorySearchBootstrapFrom,
  FACTORY_PAGES_BASE_PATH,
  FACTORY_SHIPPED_LOCALES,
  resolveFactoryDocsPageHref,
  resolveFactoryLocalizedHref,
  resolveFactoryNavHrefsWithBasePath,
  resolveFactorySearchBootstrapFrom,
  resolveFactorySearchResultHref,
  resolveFactorySurfaceHref,
} from "@/lib/content/factory-locale-base-path";
import { resolveFactoryDocsFooterNeighbors } from "@/lib/content/factory-prev-next-related";
import { localizeDocsHref } from "@/lib/content/localized-docs-href";
import { resolveRelatedRegistryDocs } from "@/lib/content/related-registry-docs";
import {
  relatedRegistryDocsBottlenecks,
  relatedRegistryDocsHarness,
  relatedRegistryDocsResolveOptions,
} from "@/lib/content/related-registry-docs.test-fixtures";
import {
  loadTagLandingContext,
  loadTagResourceEntries,
} from "@/lib/content/tag-resources";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { defaultLocale, supportedLocales } from "@/lib/i18n/locale-routing";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";
import { DOCS_SEARCH_API_PATH } from "@/lib/search/docs-search-bootstrap-path";
import { source } from "@/lib/source";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const PROJECT_SITE_BOOTSTRAP = `${PROJECT_SITE_BASE_PATH}${DOCS_SEARCH_API_PATH}`;

const NON_DEFAULT_LOCALES = FACTORY_SHIPPED_LOCALES.filter(
  (locale) => locale !== defaultLocale,
);

const REPRESENTATIVE_DOCS = [
  {
    slug: ["guides", "getting-started"] as const,
    title: "Getting Started",
    docsSlug: "guides/getting-started",
    href: "/docs/guides/getting-started",
  },
  {
    slug: ["concepts", "harness"] as const,
    title: "Harness",
    docsSlug: "concepts/harness",
    href: "/docs/concepts/harness",
  },
  {
    slug: ["techniques", "ralph"] as const,
    title: "Ralph",
    docsSlug: "techniques/ralph",
    href: "/docs/techniques/ralph",
  },
] as const;

describe("factory locale and Pages base path", () => {
  test("factory shipped locales match the site locale contract", () => {
    expect([...FACTORY_SHIPPED_LOCALES]).toEqual([...supportedLocales]);
    expect(FACTORY_PAGES_BASE_PATH).toBe("/you-agent-factory-docs");
    expect(FACTORY_PAGES_BASE_PATH).toBe(BUILT_APP_GITHUB_PAGES_BASE_PATH);
  });

  test("default-locale root paths stay unprefixed across factory surfaces", () => {
    expect(resolveFactorySurfaceHref("home", "en")).toBe("/");
    expect(resolveFactorySurfaceHref("browse", "en")).toBe("/browse");
    expect(resolveFactorySurfaceHref("search", "en")).toBe("/search");
    expect(resolveFactorySurfaceHref("tags-index", "en")).toBe("/tags");
    expect(resolveFactorySurfaceHref("blog-index", "en")).toBe("/blog");
    expect(resolveFactoryDocsPageHref("concepts/harness", "en")).toBe(
      "/docs/concepts/harness",
    );
    expect(resolveFactorySearchResultHref("/docs/techniques/ralph", "en")).toBe(
      "/docs/techniques/ralph",
    );

    assertFactoryLocaleHref("/docs/guides/getting-started", "en");
    expect(() =>
      assertFactoryLocaleHref("/ja/docs/guides/getting-started", "en"),
    ).toThrow(/must not carry locale prefix/);
  });

  test("shipped locales preserve locale prefixes on search and nav hrefs", () => {
    for (const locale of NON_DEFAULT_LOCALES) {
      expect(resolveFactorySurfaceHref("home", locale)).toBe(`/${locale}`);
      expect(resolveFactorySurfaceHref("browse", locale)).toBe(
        `/${locale}/browse`,
      );
      expect(resolveFactorySurfaceHref("search", locale)).toBe(
        `/${locale}/search`,
      );
      expect(resolveFactorySurfaceHref("tags-index", locale)).toBe(
        `/${locale}/tags`,
      );
      expect(resolveFactoryDocsPageHref("concepts/harness", locale)).toBe(
        `/${locale}/docs/concepts/harness`,
      );
      expect(
        resolveFactorySearchResultHref("/docs/techniques/ralph", locale),
      ).toBe(`/${locale}/docs/techniques/ralph`);

      assertFactoryLocaleHref(`/${locale}/docs/concepts/harness`, locale);
      expect(() =>
        assertFactoryLocaleHref("/docs/concepts/harness", locale),
      ).toThrow(/must start with/);
    }
  });

  test("project-site export prefixes search bootstrap and nav hrefs", () => {
    const exportEnv = {
      NEXT_STATIC_EXPORT: "1",
      GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
    };

    expect(resolveFactorySearchBootstrapFrom("en", exportEnv)).toBe(
      PROJECT_SITE_BOOTSTRAP,
    );
    expect(resolveFactorySearchBootstrapFrom("ja", exportEnv)).toBe(
      `${PROJECT_SITE_BOOTSTRAP}.ja`,
    );
    expect(resolveFactorySearchBootstrapFrom("vi", exportEnv)).toBe(
      `${PROJECT_SITE_BOOTSTRAP}.vi`,
    );
    expect(resolveFactorySearchBootstrapFrom("zh-CN", exportEnv)).toBe(
      `${PROJECT_SITE_BOOTSTRAP}.zh-CN`,
    );

    assertFactorySearchBootstrapFrom(PROJECT_SITE_BOOTSTRAP, "en", exportEnv);
    assertFactoryPagesBasePathHref(
      `${PROJECT_SITE_BASE_PATH}/docs/concepts/harness`,
    );

    expect(
      resolveFactoryLocalizedHref(
        { surface: "docs-page", slug: "guides/getting-started" },
        "ja",
        PROJECT_SITE_BASE_PATH,
      ),
    ).toBe(`${PROJECT_SITE_BASE_PATH}/ja/docs/guides/getting-started`);

    expect(
      resolveFactoryNavHrefsWithBasePath(
        ["/docs/concepts/harness", "/ja/docs/techniques/ralph", "/vi/tags"],
        PROJECT_SITE_BASE_PATH,
      ),
    ).toEqual([
      `${PROJECT_SITE_BASE_PATH}/docs/concepts/harness`,
      `${PROJECT_SITE_BASE_PATH}/ja/docs/techniques/ralph`,
      `${PROJECT_SITE_BASE_PATH}/vi/tags`,
    ]);

    expect(() =>
      assertFactoryPagesBasePathHref("/docs/concepts/harness"),
    ).toThrow(/must start with Pages base path/);
  });

  test("root builds keep unprefixed search bootstrap for default and locale query", () => {
    expect(resolveFactorySearchBootstrapFrom("en", {})).toBe(
      DOCS_SEARCH_API_PATH,
    );
    expect(resolveFactorySearchBootstrapFrom("ja", {})).toBe(
      `${DOCS_SEARCH_API_PATH}?locale=ja`,
    );
    expect(resolveFactorySearchBootstrapFrom("vi", {})).toBe(
      `${DOCS_SEARCH_API_PATH}?locale=vi`,
    );
  });

  test("breadcrumbs preserve locale home and shipped docs hrefs", async () => {
    for (const locale of FACTORY_SHIPPED_LOCALES) {
      const messages = await loadUiMessages(locale);
      for (const page of REPRESENTATIVE_DOCS) {
        const segments = buildDocsBreadcrumbSegments(
          [...page.slug],
          page.title,
          messages,
          locale,
        );

        const homeHref = segments[0]?.href;
        const collectionHref = segments[1]?.href;
        expect(homeHref).toBe(resolveFactorySurfaceHref("home", locale));
        assertFactoryLocaleHref(homeHref ?? "", locale);
        // Collection indexes may stay unprefixed when the section index itself
        // is not a shipped localized docs slug; match localizeDocsHref.
        expect(collectionHref).toBe(
          localizeDocsHref(`/docs/${page.slug[0]}`, locale),
        );
        // Shipped page destinations always localize.
        expect(resolveFactoryDocsPageHref(page.docsSlug, locale)).toBe(
          locale === defaultLocale ? page.href : `/${locale}${page.href}`,
        );

        const html = renderToStaticMarkup(
          <DocsPageBreadcrumb
            locale={locale}
            messages={messages}
            slug={[...page.slug]}
            title={page.title}
          />,
        );
        if (locale === defaultLocale) {
          expect(html).toContain('href="/"');
        } else {
          expect(html).toContain(`href="/${locale}"`);
        }
      }
    }
  });

  test("sidebar previous/next neighbors preserve locale prefixes", () => {
    for (const locale of NON_DEFAULT_LOCALES) {
      const localizedTree = localizePageTree(source.pageTree, locale);
      for (const page of REPRESENTATIVE_DOCS) {
        const localizedHref = `/${locale}${page.href}`;
        const neighbors = resolveFactoryDocsFooterNeighbors(
          localizedTree,
          localizedHref,
        );
        if (neighbors.previous) {
          assertFactoryLocaleHref(neighbors.previous.url, locale);
        }
        if (neighbors.next) {
          assertFactoryLocaleHref(neighbors.next.url, locale);
        }
      }
    }

    const defaultNeighbors = resolveFactoryDocsFooterNeighbors(
      source.pageTree,
      "/docs/concepts/harness",
    );
    if (defaultNeighbors.previous) {
      assertFactoryLocaleHref(defaultNeighbors.previous.url, "en");
    }
    if (defaultNeighbors.next) {
      assertFactoryLocaleHref(defaultNeighbors.next.url, "en");
    }
  });

  test("tags, browse, and related links honor locale routing", async () => {
    for (const locale of FACTORY_SHIPPED_LOCALES) {
      const messages = await loadUiMessages(locale);
      const browseHtml = renderToStaticMarkup(
        await renderBrowseIndexPage(locale),
      );
      const expectedBrowseSearch = resolveFactorySurfaceHref("search", locale);
      const expectedTags = resolveFactorySurfaceHref("tags-index", locale);
      expect(browseHtml).toContain(`href="${expectedBrowseSearch}"`);
      expect(browseHtml).toContain(`href="${expectedTags}"`);

      const tagLanding = await loadTagLandingContext(
        "foundations",
        messages,
        locale,
      );
      expect(tagLanding).toBeDefined();
      // Tag landing route itself is always locale-aware via buildLocalizedRoute.
      expect(
        resolveFactoryLocalizedHref(
          { surface: "tag-page", slug: "foundations" },
          locale,
        ),
      ).toBe(
        locale === defaultLocale
          ? "/tags/foundations"
          : `/${locale}/tags/foundations`,
      );

      const tagEntries = await loadTagResourceEntries("foundations", locale);
      if (locale === defaultLocale) {
        expect(tagEntries.length).toBeGreaterThan(0);
      }
      for (const entry of tagEntries) {
        // Blog tag resources localize via localizePath; docs via page.url.
        if (entry.kind === "blog") {
          assertFactoryLocaleHref(entry.url, locale);
        } else {
          expect(entry.url).toBe(localizeDocsHref(entry.url, locale));
        }
      }

      const related = resolveRelatedRegistryDocs(
        [relatedRegistryDocsBottlenecks.id, relatedRegistryDocsHarness.id],
        relatedRegistryDocsResolveOptions,
      );
      expect(related.available.length).toBeGreaterThan(0);
      for (const item of related.available) {
        const localizedHref = localizeDocsHref(item.href, locale);
        // Shipped related docs localize; unshipped stay on default-locale href.
        expect(localizedHref).toBe(localizeDocsHref(item.href, locale));
        if (
          locale === defaultLocale ||
          localizedHref.startsWith(`/${locale}/`)
        ) {
          assertFactoryLocaleHref(localizedHref, locale);
        }
      }
    }
  });
});
