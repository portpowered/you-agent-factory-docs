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

const CONTENT_DIRECTORY_BY_KIND: Record<
  Exclude<PublicContentKind, "doc">,
  string
> = {
  blog: "blog",
  glossary: "glossary",
  comparison: "comparisons",
  reference: "references",
};

export type PublicContentPage = {
  record: CanonicalContentRecord;
  title: string;
  body: string;
  resolution: LocalizedContentResolution;
  localeProjection: LocaleAwareContentProjection;
};

export type LoadPublicContentPageOptions = {
  locale?: string;
};

export class PublicContentPageNotFoundError extends Error {
  constructor(kind: Exclude<PublicContentKind, "doc">, slug: string) {
    super(`Published ${kind} page not found: ${slug}`);
    this.name = "PublicContentPageNotFoundError";
  }
}

function findPublishedPublicContentRecord(
  records: CanonicalContentRecord[],
  kind: Exclude<PublicContentKind, "doc">,
  slug: string,
): CanonicalContentRecord | undefined {
  return records.find(
    (record) =>
      record.kind === kind &&
      record.slug === slug &&
      record.status === "published",
  );
}

function readPublicContentSource(
  contentRoot: string,
  kind: Exclude<PublicContentKind, "doc">,
  slug: string,
  locale: string,
): string {
  const contentDirectory = CONTENT_DIRECTORY_BY_KIND[kind];
  const slugRoot = join(contentRoot, contentDirectory, slug);
  const localeFile = resolveLocaleFileName(locale, readdirSync(slugRoot));

  if (!localeFile) {
    throw new Error(
      `Public content locale file not found for "${kind}/${slug}" and locale "${locale}"`,
    );
  }

  return readFileSync(join(slugRoot, localeFile), "utf8");
}

/**
 * Loads a published non-doc public page from validated starter content
 * fixtures.
 */
export function loadPublicContentPage(
  kind: Exclude<PublicContentKind, "doc">,
  slug: string,
  contentRoot = DEFAULT_CONTENT_ROOT,
  options?: LoadPublicContentPageOptions,
): PublicContentPage {
  const { records, failures, variantBindings } =
    loadStarterContentRecords(contentRoot);
  assertStarterContentValid(failures);

  const record = findPublishedPublicContentRecord(records, kind, slug);
  if (!record) {
    throw new PublicContentPageNotFoundError(kind, slug);
  }

  const localeProjection = projectLocaleAwareContent(record.id, {
    requestedLocale: options?.locale,
    variantBindings,
  });
  if (!localeProjection) {
    throw new PublicContentPageNotFoundError(kind, slug);
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
  const source = readPublicContentSource(
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
