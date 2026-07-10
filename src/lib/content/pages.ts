import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DOCS_ROOT } from "@/lib/content/content-paths";
import {
  type PageFrontmatter,
  type PageMessages,
  pageFrontmatterSchema,
  pageMessagesSchema,
} from "@/lib/content/schemas";
import type { NonDefaultLocale } from "@/lib/content/shipped-localized-docs";
import { deriveShippedLocalizedDocsManifest } from "@/lib/content/shipped-localized-docs.server";
import { parseYamlFrontmatterBlock } from "@/lib/content/yaml-frontmatter";
import {
  buildLocalizedRoute,
  defaultLocale,
  type SiteLocale,
} from "@/lib/i18n/locale-routing";

export type DocsPageSource = {
  pageDir: string;
  docsSlug: string;
  url: string;
  frontmatter: PageFrontmatter;
  messages: PageMessages;
};

function parseFrontmatter(pageMdxPath: string): PageFrontmatter {
  const source = readFileSync(pageMdxPath, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) {
    throw new Error(`Missing frontmatter in ${pageMdxPath}`);
  }

  return pageFrontmatterSchema.parse(parseYamlFrontmatterBlock(match[1]));
}

function findPageDirectories(
  rootDir: string,
  relativeParts: string[] = [],
): string[] {
  if (!existsSync(rootDir)) {
    return [];
  }

  const directories: string[] = [];
  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const pageDir = path.join(rootDir, entry.name);
    const nextParts = [...relativeParts, entry.name];
    const pageMdx = path.join(pageDir, "page.mdx");
    if (existsSync(pageMdx)) {
      directories.push(pageDir);
      continue;
    }
    directories.push(...findPageDirectories(pageDir, nextParts));
  }
  return directories;
}

export function docsUrlFromSlug(docsSlug: string, locale: SiteLocale): string {
  return buildLocalizedRoute({ surface: "docs-page", slug: docsSlug }, locale);
}

function loadPageMessagesSync(
  pageDirectory: string,
  locale: SiteLocale,
): PageMessages {
  const messagesPath = path.join(pageDirectory, "messages", `${locale}.json`);
  const raw = readFileSync(messagesPath, "utf8");
  return pageMessagesSchema.parse(JSON.parse(raw));
}

export function isDocsPageShippedForLocale(
  docsSlug: string,
  locale: SiteLocale,
  rootDir = DOCS_ROOT,
): boolean {
  if (locale === defaultLocale) {
    return true;
  }

  return deriveShippedLocalizedDocsManifest(rootDir)[
    locale as NonDefaultLocale
  ].includes(docsSlug);
}

/**
 * Process/build-scoped published/shipped page-load cache.
 *
 * Static route generation and index surfaces repeatedly scan the same docs
 * tree. Memoize successful scans so each unique (root, locale, variant) parse
 * runs once per process.
 */
type DocsPageLoadVariant = "published" | "shipped";

const docsPageLoadCache = new Map<string, DocsPageSource[]>();
let docsPageParseCount = 0;

function docsPageLoadCacheKey(
  rootDir: string,
  locale: SiteLocale,
  variant: DocsPageLoadVariant,
): string {
  return `${rootDir}\0${locale}\0${variant}`;
}

function loadPublishedDocsPagesUncached(
  locale: SiteLocale,
  rootDir: string,
): DocsPageSource[] {
  docsPageParseCount += 1;
  const pages: DocsPageSource[] = [];

  for (const pageDir of findPageDirectories(rootDir)) {
    const pageMdx = path.join(pageDir, "page.mdx");
    const frontmatter = parseFrontmatter(pageMdx);
    if (frontmatter.status !== "published") {
      continue;
    }

    const docsSlug = path.relative(rootDir, pageDir);
    const url = docsUrlFromSlug(docsSlug, locale);
    pages.push({
      pageDir,
      docsSlug,
      url,
      frontmatter,
      messages: loadPageMessagesSync(pageDir, locale),
    });
  }

  return pages;
}

function loadShippedLocalizedDocsPagesUncached(
  locale: SiteLocale,
  rootDir: string,
): DocsPageSource[] {
  docsPageParseCount += 1;
  const pages: DocsPageSource[] = [];

  for (const pageDir of findPageDirectories(rootDir)) {
    const pageMdx = path.join(pageDir, "page.mdx");
    const frontmatter = parseFrontmatter(pageMdx);
    if (frontmatter.status !== "published") {
      continue;
    }

    if (
      !isDocsPageShippedForLocale(
        path.relative(rootDir, pageDir),
        locale,
        rootDir,
      )
    ) {
      continue;
    }

    const docsSlug = path.relative(rootDir, pageDir);
    const url = docsUrlFromSlug(docsSlug, locale);
    pages.push({
      pageDir,
      docsSlug,
      url,
      frontmatter,
      messages: loadPageMessagesSync(pageDir, locale),
    });
  }

  return pages;
}

function getOrLoadDocsPages(
  locale: SiteLocale,
  rootDir: string,
  variant: DocsPageLoadVariant,
): DocsPageSource[] {
  const key = docsPageLoadCacheKey(rootDir, locale, variant);
  const cached = docsPageLoadCache.get(key);
  if (cached) {
    return cached;
  }

  const pages =
    variant === "published"
      ? loadPublishedDocsPagesUncached(locale, rootDir)
      : loadShippedLocalizedDocsPagesUncached(locale, rootDir);
  docsPageLoadCache.set(key, pages);
  return pages;
}

export async function loadPublishedDocsPages(
  locale: SiteLocale,
  rootDir = DOCS_ROOT,
): Promise<DocsPageSource[]> {
  return getOrLoadDocsPages(locale, rootDir, "published");
}

export function loadPublishedDocsPagesSync(
  locale: SiteLocale,
  rootDir = DOCS_ROOT,
): DocsPageSource[] {
  return getOrLoadDocsPages(locale, rootDir, "published");
}

export function loadShippedLocalizedDocsPagesSync(
  locale: SiteLocale,
  rootDir = DOCS_ROOT,
): DocsPageSource[] {
  if (locale === defaultLocale) {
    return loadPublishedDocsPagesSync(locale, rootDir);
  }

  return getOrLoadDocsPages(locale, rootDir, "shipped");
}

/**
 * Loads the docs pages that are actually shippable for the requested locale.
 * Non-default locales only include pages declared in the shipped-docs manifest.
 */
export async function loadShippedLocalizedDocsPages(
  locale: SiteLocale,
  rootDir = DOCS_ROOT,
): Promise<DocsPageSource[]> {
  if (locale === defaultLocale) {
    return loadPublishedDocsPages(locale, rootDir);
  }

  return getOrLoadDocsPages(locale, rootDir, "shipped");
}

/** Test helper: drop docs page-load memo and parse counter. */
export function resetDocsPageLoadCacheForTests(): void {
  docsPageLoadCache.clear();
  docsPageParseCount = 0;
}

/** Test helper: how many times the docs tree was walked/parsed. */
export function getDocsPageParseCountForTests(): number {
  return docsPageParseCount;
}
