import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseContentFile } from "@/lib/content/frontmatter";
import { loadStarterContentRecords } from "@/lib/content/load-starter-content";
import {
  type LocaleAwareContentProjection,
  projectLocaleAwareContent,
} from "@/lib/content/locale-aware-content-projection";
import { resolveLocaleFileName } from "@/lib/content/locale-files";
import {
  type LocalizedContentResolution,
  selectLocalizedVariantBinding,
} from "@/lib/content/localized-content-resolution";
import { assertStarterContentValid } from "@/lib/content/starter-content-errors";
import type {
  CanonicalContentRecord,
  PublicContentKind,
} from "@/lib/content/types";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");

const CONTENT_DIRECTORY_BY_KIND = {
  doc: "docs",
  blog: "blog",
  glossary: "glossary",
  comparison: "comparisons",
  reference: "references",
} as const satisfies Record<PublicContentKind, string>;

export type PublicContentPage = {
  record: CanonicalContentRecord;
  title: string;
  body: string;
  resolution: LocalizedContentResolution;
  localeProjection: LocaleAwareContentProjection;
};

function findPublishedRecord(
  records: CanonicalContentRecord[],
  kind: PublicContentKind,
  slug: string,
): CanonicalContentRecord | undefined {
  return records.find(
    (record) =>
      record.kind === kind &&
      record.slug === slug &&
      record.status === "published",
  );
}

function readContentSource(
  contentRoot: string,
  kind: PublicContentKind,
  slug: string,
  locale: string,
): string {
  const contentDirectory = CONTENT_DIRECTORY_BY_KIND[kind];
  const slugRoot = join(contentRoot, contentDirectory, slug);
  const localeFile = resolveLocaleFileName(locale, readdirSync(slugRoot));

  if (!localeFile) {
    throw new Error(
      `Content locale file not found for kind "${kind}", slug "${slug}", and locale "${locale}"`,
    );
  }

  return readFileSync(join(slugRoot, localeFile), "utf8");
}

export type LoadPublicContentPageOptions = {
  locale?: string;
};

export function listPublishedContentSlugs(
  kind: PublicContentKind,
  contentRoot = DEFAULT_CONTENT_ROOT,
): string[] {
  const { records, failures } = loadStarterContentRecords(contentRoot);
  assertStarterContentValid(failures);

  const slugs = new Set<string>();
  for (const record of records) {
    if (record.kind === kind && record.status === "published") {
      slugs.add(record.slug);
    }
  }

  return [...slugs].sort((left, right) => left.localeCompare(right));
}

export function loadPublicContentPage(
  kind: PublicContentKind,
  slug: string,
  contentRoot = DEFAULT_CONTENT_ROOT,
  options?: LoadPublicContentPageOptions,
): PublicContentPage {
  const { records, failures, variantBindings } =
    loadStarterContentRecords(contentRoot);
  assertStarterContentValid(failures);

  const record = findPublishedRecord(records, kind, slug);
  if (!record) {
    throw new Error(`Published ${kind} page not found: ${slug}`);
  }

  const localeProjection = projectLocaleAwareContent(record.id, {
    requestedLocale: options?.locale,
    variantBindings,
  });
  if (!localeProjection) {
    throw new Error(`Published ${kind} page not found: ${slug}`);
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
  const source = readContentSource(
    contentRoot,
    kind,
    slug,
    resolution.resolvedLocale,
  );
  const { body } = parseContentFile(source);

  return {
    record: resolvedRecord,
    title: resolvedRecord.navigationTitle,
    body: body.trim(),
    resolution,
    localeProjection,
  };
}
