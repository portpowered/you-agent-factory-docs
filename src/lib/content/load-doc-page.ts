import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadDocsContentSource } from "@/lib/content/docs-structure-source";
import { parseContentFile } from "@/lib/content/frontmatter";
import {
  type LocaleAwareContentProjection,
  projectLocaleAwareContent,
} from "@/lib/content/locale-aware-content-projection";
import { resolveLocaleFileName } from "@/lib/content/locale-files";
import {
  type LocalizedContentResolution,
  selectLocalizedVariantBinding,
} from "@/lib/content/localized-content-resolution";
import type { CanonicalContentRecord } from "@/lib/content/types";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");

export type DocPageContent = {
  record: CanonicalContentRecord;
  title: string;
  body: string;
  resolution: LocalizedContentResolution;
  localeProjection: LocaleAwareContentProjection;
};

function findPublishedDocRecord(
  records: CanonicalContentRecord[],
  slug: string,
): CanonicalContentRecord | undefined {
  return records.find(
    (record) =>
      record.kind === "doc" &&
      record.slug === slug &&
      record.status === "published",
  );
}

function readDocSource(
  contentRoot: string,
  slug: string,
  locale: string,
): string {
  const slugRoot = join(contentRoot, "docs", slug);
  const localeFile = resolveLocaleFileName(locale, readdirSync(slugRoot));

  if (!localeFile) {
    throw new Error(
      `Doc locale file not found for slug "${slug}" and locale "${locale}"`,
    );
  }

  return readFileSync(join(slugRoot, localeFile), "utf8");
}

/**
 * Lists published doc slugs from validated starter content fixtures.
 */
export function listPublishedDocSlugs(
  contentRoot = DEFAULT_CONTENT_ROOT,
): string[] {
  const { canonicalRecords } = loadDocsContentSource(contentRoot);

  const slugs = new Set<string>();
  for (const record of canonicalRecords) {
    if (record.kind === "doc" && record.status === "published") {
      slugs.add(record.slug);
    }
  }

  return [...slugs].sort((left, right) => left.localeCompare(right));
}

export type LoadDocPageOptions = {
  /** Locale requested through the locale-aware content path. */
  locale?: string;
};

/**
 * Loads a published doc page from starter content fixtures.
 */
export function loadDocPage(
  slug: string,
  contentRoot = DEFAULT_CONTENT_ROOT,
  options?: LoadDocPageOptions,
): DocPageContent {
  const { canonicalRecords, variantBindings } =
    loadDocsContentSource(contentRoot);

  const record = findPublishedDocRecord(canonicalRecords, slug);
  if (!record) {
    throw new Error(`Published doc page not found: ${slug}`);
  }

  const localeProjection = projectLocaleAwareContent(record.id, {
    requestedLocale: options?.locale,
    variantBindings,
  });
  if (!localeProjection) {
    throw new Error(`Published doc page not found: ${slug}`);
  }

  const resolution: LocalizedContentResolution = {
    canonicalPageId: localeProjection.canonicalPageId,
    canonicalLocale: localeProjection.canonicalLocale,
    requestedLocale: localeProjection.requestedLocale,
    resolvedLocale: localeProjection.resolvedLocale,
    fellBackToCanonicalLocale: localeProjection.fellBackToCanonicalLocale,
  };

  const binding =
    selectLocalizedVariantBinding(
      variantBindings,
      record.id,
      options?.locale,
    ) ?? undefined;
  const resolvedRecord = binding?.record ?? record;

  const source = readDocSource(contentRoot, slug, resolution.resolvedLocale);
  const { body } = parseContentFile(source);

  return {
    record: resolvedRecord,
    title: resolvedRecord.navigationTitle,
    body: body.trim(),
    resolution,
    localeProjection,
  };
}
