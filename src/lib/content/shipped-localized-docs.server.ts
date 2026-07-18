import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { defaultLocale, supportedLocales } from "@/lib/i18n/locale-routing";
import { DOCS_ROOT } from "./content-paths";
import { findDocsPageDirectories } from "./docs-page-directories";
import { pageFrontmatterSchema } from "./schemas";
import type {
  NonDefaultLocale,
  ShippedLocalizedDocsManifest,
} from "./shipped-localized-docs";
import { parseYamlFrontmatterBlock } from "./yaml-frontmatter";

const nonDefaultLocales = supportedLocales.filter(
  (locale): locale is NonDefaultLocale => locale !== defaultLocale,
);

const manifestCache = new Map<string, ShippedLocalizedDocsManifest>();

function parseFrontmatter(pageMdxPath: string) {
  const source = readFileSync(pageMdxPath, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) {
    throw new Error(`Missing frontmatter in ${pageMdxPath}`);
  }

  return pageFrontmatterSchema.parse(parseYamlFrontmatterBlock(match[1]));
}

function createEmptyManifest(): ShippedLocalizedDocsManifest {
  const manifest = {} as ShippedLocalizedDocsManifest;
  for (const locale of nonDefaultLocales) {
    manifest[locale] = [];
  }
  return manifest;
}

function hasNonDefaultLocaleMessages(
  pageDirectory: string,
  locale: NonDefaultLocale,
): boolean {
  return existsSync(path.join(pageDirectory, "messages", `${locale}.json`));
}

export function deriveShippedLocalizedDocsManifest(
  docsRoot = DOCS_ROOT,
): ShippedLocalizedDocsManifest {
  const cached = manifestCache.get(docsRoot);
  if (cached) {
    return cached;
  }

  const shippedDocsByLocale = createEmptyManifest() as Record<
    NonDefaultLocale,
    string[]
  >;

  for (const pageDirectory of findDocsPageDirectories(docsRoot)) {
    const frontmatter = parseFrontmatter(path.join(pageDirectory, "page.mdx"));
    if (frontmatter.status !== "published") {
      continue;
    }

    const docsSlug = path.relative(docsRoot, pageDirectory).replace(/\\/g, "/");

    for (const locale of nonDefaultLocales) {
      if (hasNonDefaultLocaleMessages(pageDirectory, locale)) {
        shippedDocsByLocale[locale].push(docsSlug);
      }
    }
  }

  const manifest = createEmptyManifest() as Record<NonDefaultLocale, string[]>;
  for (const locale of nonDefaultLocales) {
    manifest[locale] = [...shippedDocsByLocale[locale]].sort();
  }
  manifestCache.set(docsRoot, manifest);
  return manifest;
}

export function resolveDerivedShippedLocalizedDocsManifest(
  overrides: Partial<ShippedLocalizedDocsManifest> = {},
  docsRoot = DOCS_ROOT,
): ShippedLocalizedDocsManifest {
  const derivedManifest = deriveShippedLocalizedDocsManifest(docsRoot);
  const resolved = createEmptyManifest() as Record<
    NonDefaultLocale,
    readonly string[]
  >;
  for (const locale of nonDefaultLocales) {
    resolved[locale] = overrides[locale] ?? derivedManifest[locale];
  }
  return resolved;
}

export function resetDerivedShippedLocalizedDocsManifestCache() {
  manifestCache.clear();
}

export function createEmptyShippedLocalizedDocsManifest(): ShippedLocalizedDocsManifest {
  return createEmptyManifest();
}
