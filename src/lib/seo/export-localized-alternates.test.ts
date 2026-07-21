import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateMetadata as generateBlogPostMetadata } from "@/app/(site)/(with-docs-chrome)/blog/[slug]/page";
import { generateMetadata as generateBlogIndexMetadata } from "@/app/(site)/(with-docs-chrome)/blog/page";
import { generateMetadata as generateHomeMetadata } from "@/app/(site)/page";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { exportHtmlRelativePath } from "@/lib/build/export-out-directory";
import { FACTORY_SHIPPED_LOCALES } from "@/lib/content/factory-locale-base-path";
import { isDocsPageShippedForLocale } from "@/lib/content/pages";
import { isLiveFactoryCanonicalPath } from "@/lib/seo/export-absolute-canonical";
import {
  BLOG_ENGLISH_ONLY_ALTERNATES_PROOF_ROUTE,
  exportHtmlHasAbsoluteXDefaultAlternate,
  exportHtmlHasShippedAbsoluteAlternates,
  extractHreflangAlternates,
  extractXDefaultHreflangHref,
  LOCALIZED_ALTERNATES_PROOF_ROUTES,
  MULTI_LOCALE_ALTERNATES_PROOF_ROUTE,
  SUBSET_LOCALE_ALTERNATES_PROOF_ROUTE,
  verifyExportLocalizedAlternates,
} from "@/lib/seo/export-localized-alternates";
import { resolveProductionMetadataHref } from "@/lib/seo/production-metadata-base";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const PROJECT_SITE_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
} as const;

function alternateLink(hreflang: string, href: string): string {
  return `<link rel="alternate" href="${href}" hreflang="${hreflang}">`;
}

function pageHtml(links: readonly string[]): string {
  return links.join("\n");
}

function absoluteAlternateLinks(
  languages: Readonly<Record<string, string>>,
  options?: { includeXDefault?: boolean; englishCanonical?: string },
): string[] {
  const links = Object.entries(languages).map(([locale, path]) =>
    alternateLink(
      locale,
      resolveProductionMetadataHref(path, PROJECT_SITE_EXPORT_ENV),
    ),
  );
  if (
    options?.includeXDefault === true &&
    options.englishCanonical !== undefined
  ) {
    links.push(
      alternateLink(
        "x-default",
        resolveProductionMetadataHref(
          options.englishCanonical,
          PROJECT_SITE_EXPORT_ENV,
        ),
      ),
    );
  }
  return links;
}

describe("export localized alternates helpers", () => {
  test("extractHreflangAlternates reads hreflang links and skips x-default", () => {
    expect(
      extractHreflangAlternates(
        [
          alternateLink("en", "https://example.com/"),
          '<link href="https://example.com/ja" rel="alternate" hreflang="ja">',
          alternateLink("x-default", "https://example.com/"),
        ].join(""),
      ),
    ).toEqual([
      { hreflang: "en", href: "https://example.com/" },
      { hreflang: "ja", href: "https://example.com/ja" },
    ]);
    expect(extractHreflangAlternates("<html></html>")).toEqual([]);
  });

  test("extractXDefaultHreflangHref returns only the x-default href", () => {
    const english = resolveProductionMetadataHref("/", PROJECT_SITE_EXPORT_ENV);
    expect(
      extractXDefaultHreflangHref(
        pageHtml([
          alternateLink("en", english),
          alternateLink(
            "ja",
            resolveProductionMetadataHref("/ja", PROJECT_SITE_EXPORT_ENV),
          ),
          alternateLink("x-default", english),
        ]),
      ),
    ).toBe(english);
    expect(
      extractXDefaultHreflangHref(pageHtml([alternateLink("en", english)])),
    ).toBeNull();
  });

  test("exportHtmlHasShippedAbsoluteAlternates requires absolute production hrefs", () => {
    const expected = {
      en: "/",
      ja: "/ja",
      "zh-CN": "/zh-CN",
      vi: "/vi",
    } as const;
    const absoluteLinks = absoluteAlternateLinks(expected, {
      includeXDefault: true,
      englishCanonical: "/",
    });

    expect(
      exportHtmlHasShippedAbsoluteAlternates(
        pageHtml(absoluteLinks),
        expected,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(true);
    expect(
      exportHtmlHasAbsoluteXDefaultAlternate(
        pageHtml(absoluteLinks),
        "/",
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(true);

    const relativeLinks = Object.entries(expected).map(([locale, path]) =>
      alternateLink(
        locale,
        `${PROJECT_SITE_BASE_PATH}${path === "/" ? "/" : path}`,
      ),
    );
    expect(
      exportHtmlHasShippedAbsoluteAlternates(
        pageHtml(relativeLinks),
        expected,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
  });

  test("exportHtmlHasShippedAbsoluteAlternates rejects unshipped locales and legacy paths", () => {
    const withExtraLocale = pageHtml([
      alternateLink(
        "en",
        resolveProductionMetadataHref("/", PROJECT_SITE_EXPORT_ENV),
      ),
      alternateLink(
        "fr",
        resolveProductionMetadataHref("/fr", PROJECT_SITE_EXPORT_ENV),
      ),
    ]);
    expect(
      exportHtmlHasShippedAbsoluteAlternates(
        withExtraLocale,
        { en: "/" },
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);

    const withLegacy = pageHtml([
      alternateLink(
        "en",
        resolveProductionMetadataHref(
          "/docs/modules/grouped-query-attention",
          PROJECT_SITE_EXPORT_ENV,
        ),
      ),
    ]);
    expect(
      exportHtmlHasShippedAbsoluteAlternates(
        withLegacy,
        { en: "/docs/modules/grouped-query-attention" },
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
    expect(
      isLiveFactoryCanonicalPath("/docs/modules/grouped-query-attention"),
    ).toBe(false);
  });

  test("exportHtmlHasAbsoluteXDefaultAlternate rejects missing or wrong x-default", () => {
    const english = resolveProductionMetadataHref("/", PROJECT_SITE_EXPORT_ENV);
    expect(
      exportHtmlHasAbsoluteXDefaultAlternate(
        pageHtml([alternateLink("en", english)]),
        "/",
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
    expect(
      exportHtmlHasAbsoluteXDefaultAlternate(
        pageHtml([
          alternateLink("en", english),
          alternateLink(
            "x-default",
            resolveProductionMetadataHref("/ja", PROJECT_SITE_EXPORT_ENV),
          ),
        ]),
        "/",
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
  });
});

describe("representative page metadata keeps shipped-only app-relative alternates", () => {
  test("home advertises every shipped locale plus x-default as app-relative paths", async () => {
    const home = await generateHomeMetadata();
    const languages = home.alternates?.languages ?? {};

    expect([...FACTORY_SHIPPED_LOCALES]).toEqual(["en", "ja", "zh-CN", "vi"]);
    expect(languages).toEqual({
      en: "/",
      ja: "/ja",
      "zh-CN": "/zh-CN",
      vi: "/vi",
      "x-default": "/",
    });
    expect(String(languages["x-default"])).toBe(String(languages.en));
    expect(String(languages["x-default"])).toBe(
      String(home.alternates?.canonical),
    );

    for (const locale of FACTORY_SHIPPED_LOCALES) {
      const href = languages[locale];
      expect(typeof href).toBe("string");
      expect(isLiveFactoryCanonicalPath(href as string)).toBe(true);
      expect(
        resolveProductionMetadataHref(href as string, PROJECT_SITE_EXPORT_ENV),
      ).toBe(
        resolveProductionMetadataHref(
          locale === "en" ? "/" : `/${locale}`,
          PROJECT_SITE_EXPORT_ENV,
        ),
      );
    }

    expect(MULTI_LOCALE_ALTERNATES_PROOF_ROUTE).toBe("/");
  });

  test("subset-locale docs page omits unshipped locales and keeps x-default", async () => {
    expect(isDocsPageShippedForLocale("concepts/task-queue", "en")).toBe(true);
    expect(isDocsPageShippedForLocale("concepts/task-queue", "ja")).toBe(false);
    expect(isDocsPageShippedForLocale("concepts/task-queue", "zh-CN")).toBe(
      false,
    );
    expect(isDocsPageShippedForLocale("concepts/task-queue", "vi")).toBe(false);

    const metadata = await buildDocsPageMetadata(["concepts", "task-queue"]);
    expect(metadata.alternates).toEqual({
      canonical: "/docs/concepts/task-queue",
      languages: {
        en: "/docs/concepts/task-queue",
        "x-default": "/docs/concepts/task-queue",
      },
    });
    expect(metadata.alternates?.languages?.ja).toBeUndefined();
    expect(metadata.alternates?.languages?.vi).toBeUndefined();
    expect(metadata.alternates?.languages?.["zh-CN"]).toBeUndefined();
    expect(isLiveFactoryCanonicalPath("/docs/concepts/task-queue")).toBe(true);
    expect(SUBSET_LOCALE_ALTERNATES_PROOF_ROUTE).toBe(
      "/docs/concepts/task-queue",
    );
  });

  test("blog index and post follow English-only alternate policy", async () => {
    const blogIndex = await generateBlogIndexMetadata();
    expect(blogIndex.alternates).toEqual({
      canonical: "/blog",
    });
    expect(blogIndex.alternates?.languages).toBeUndefined();

    const blogPost = await generateBlogPostMetadata({
      params: Promise.resolve({ slug: "bottlenecks" }),
    });
    expect(blogPost.alternates).toEqual({
      canonical: "/blog/bottlenecks",
    });
    expect(blogPost.alternates?.languages).toBeUndefined();
    expect(BLOG_ENGLISH_ONLY_ALTERNATES_PROOF_ROUTE).toBe("/blog/bottlenecks");
  });

  test("proof routes never advertise deleted legacy Atlas alternates", () => {
    for (const route of LOCALIZED_ALTERNATES_PROOF_ROUTES) {
      expect(isLiveFactoryCanonicalPath(route)).toBe(true);
      const absolute = resolveProductionMetadataHref(
        route,
        PROJECT_SITE_EXPORT_ENV,
      );
      expect(absolute).not.toContain("/docs/models");
      expect(absolute).not.toContain("/docs/modules");
      expect(absolute).not.toContain("/topology");
      expect(absolute).not.toContain("/blog/evolution-of-diffusion");
    }
  });
});

describe("verifyExportLocalizedAlternates", () => {
  test("passes when export HTML has absolute shipped-only alternates plus x-default", () => {
    const dir = mkdtempSync(join(tmpdir(), "localized-alternates-export-"));
    try {
      writeFileSync(
        join(dir, exportHtmlRelativePath("/")),
        pageHtml(
          absoluteAlternateLinks(
            {
              en: "/",
              ja: "/ja",
              "zh-CN": "/zh-CN",
              vi: "/vi",
            },
            { includeXDefault: true, englishCanonical: "/" },
          ),
        ),
      );
      const taskQueuePath = join(
        dir,
        exportHtmlRelativePath("/docs/concepts/task-queue"),
      );
      mkdirSync(join(taskQueuePath, ".."), { recursive: true });
      writeFileSync(
        taskQueuePath,
        pageHtml(
          absoluteAlternateLinks(
            { en: "/docs/concepts/task-queue" },
            {
              includeXDefault: true,
              englishCanonical: "/docs/concepts/task-queue",
            },
          ),
        ),
      );
      const blogPath = join(dir, exportHtmlRelativePath("/blog/bottlenecks"));
      mkdirSync(join(blogPath, ".."), { recursive: true });
      writeFileSync(
        blogPath,
        `<link rel="canonical" href="${resolveProductionMetadataHref("/blog/bottlenecks", PROJECT_SITE_EXPORT_ENV)}">`,
      );

      const result = verifyExportLocalizedAlternates({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(
          result.alternates["/"]?.map((entry) => entry.hreflang).sort(),
        ).toEqual(["en", "ja", "vi", "zh-CN"]);
        expect(result.alternates["/docs/concepts/task-queue"]).toEqual([
          {
            hreflang: "en",
            href: resolveProductionMetadataHref(
              "/docs/concepts/task-queue",
              PROJECT_SITE_EXPORT_ENV,
            ),
          },
        ]);
        expect(result.alternates["/blog/bottlenecks"]).toEqual([]);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when multi-locale page omits x-default", () => {
    const dir = mkdtempSync(join(tmpdir(), "missing-x-default-export-"));
    try {
      writeFileSync(
        join(dir, exportHtmlRelativePath("/")),
        pageHtml(
          absoluteAlternateLinks({
            en: "/",
            ja: "/ja",
            "zh-CN": "/zh-CN",
            vi: "/vi",
          }),
        ),
      );
      const taskQueuePath = join(
        dir,
        exportHtmlRelativePath("/docs/concepts/task-queue"),
      );
      mkdirSync(join(taskQueuePath, ".."), { recursive: true });
      writeFileSync(
        taskQueuePath,
        pageHtml(
          absoluteAlternateLinks(
            { en: "/docs/concepts/task-queue" },
            {
              includeXDefault: true,
              englishCanonical: "/docs/concepts/task-queue",
            },
          ),
        ),
      );
      const blogPath = join(dir, exportHtmlRelativePath("/blog/bottlenecks"));
      mkdirSync(join(blogPath, ".."), { recursive: true });
      writeFileSync(blogPath, "<html></html>");

      const result = verifyExportLocalizedAlternates({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("x-default");
        expect(result.reason).toContain("/");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when subset page advertises an unshipped locale alternate", () => {
    const dir = mkdtempSync(join(tmpdir(), "unshipped-alternates-export-"));
    try {
      writeFileSync(
        join(dir, exportHtmlRelativePath("/")),
        pageHtml(
          absoluteAlternateLinks(
            {
              en: "/",
              ja: "/ja",
              "zh-CN": "/zh-CN",
              vi: "/vi",
            },
            { includeXDefault: true, englishCanonical: "/" },
          ),
        ),
      );
      const taskQueuePath = join(
        dir,
        exportHtmlRelativePath("/docs/concepts/task-queue"),
      );
      mkdirSync(join(taskQueuePath, ".."), { recursive: true });
      writeFileSync(
        taskQueuePath,
        pageHtml([
          ...absoluteAlternateLinks(
            { en: "/docs/concepts/task-queue" },
            {
              includeXDefault: true,
              englishCanonical: "/docs/concepts/task-queue",
            },
          ),
          alternateLink(
            "vi",
            resolveProductionMetadataHref(
              "/vi/docs/concepts/task-queue",
              PROJECT_SITE_EXPORT_ENV,
            ),
          ),
        ]),
      );
      const blogPath = join(dir, exportHtmlRelativePath("/blog/bottlenecks"));
      mkdirSync(join(blogPath, ".."), { recursive: true });
      writeFileSync(blogPath, "<html></html>");

      const result = verifyExportLocalizedAlternates({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("/docs/concepts/task-queue");
        expect(result.reason).toContain("shipped locales only");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when blog proof advertises a false non-English locale alternate", () => {
    const dir = mkdtempSync(join(tmpdir(), "blog-false-locale-export-"));
    try {
      writeFileSync(
        join(dir, exportHtmlRelativePath("/")),
        pageHtml(
          absoluteAlternateLinks(
            {
              en: "/",
              ja: "/ja",
              "zh-CN": "/zh-CN",
              vi: "/vi",
            },
            { includeXDefault: true, englishCanonical: "/" },
          ),
        ),
      );
      const taskQueuePath = join(
        dir,
        exportHtmlRelativePath("/docs/concepts/task-queue"),
      );
      mkdirSync(join(taskQueuePath, ".."), { recursive: true });
      writeFileSync(
        taskQueuePath,
        pageHtml(
          absoluteAlternateLinks(
            { en: "/docs/concepts/task-queue" },
            {
              includeXDefault: true,
              englishCanonical: "/docs/concepts/task-queue",
            },
          ),
        ),
      );
      const blogPath = join(dir, exportHtmlRelativePath("/blog/bottlenecks"));
      mkdirSync(join(blogPath, ".."), { recursive: true });
      writeFileSync(
        blogPath,
        pageHtml([
          alternateLink(
            "ja",
            resolveProductionMetadataHref(
              "/ja/blog/bottlenecks",
              PROJECT_SITE_EXPORT_ENV,
            ),
          ),
        ]),
      );

      const result = verifyExportLocalizedAlternates({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("/blog/bottlenecks");
        expect(result.reason).toContain("shipped locales only");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
