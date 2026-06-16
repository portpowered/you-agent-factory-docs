import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseContentFile } from "@/lib/content/frontmatter";
import { loadStarterContentRecords } from "@/lib/content/load-starter-content";
import { assertStarterContentValid } from "@/lib/content/starter-content-errors";
import type { CanonicalContentRecord } from "@/lib/content/types";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");
const LOCALE_FILE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?\.mdx?$/;

export type DocPageContent = {
  record: CanonicalContentRecord;
  title: string;
  body: string;
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
  const localeFile = `${locale}.mdx`;

  if (!LOCALE_FILE_PATTERN.test(localeFile)) {
    throw new Error(`Unsupported doc locale file: ${localeFile}`);
  }

  return readFileSync(join(slugRoot, localeFile), "utf8");
}

/**
 * Lists published doc slugs from validated starter content fixtures.
 */
export function listPublishedDocSlugs(
  contentRoot = DEFAULT_CONTENT_ROOT,
): string[] {
  const { records, failures } = loadStarterContentRecords(contentRoot);
  assertStarterContentValid(failures);

  return records
    .filter((record) => record.kind === "doc" && record.status === "published")
    .map((record) => record.slug)
    .sort((left, right) => left.localeCompare(right));
}

/**
 * Loads a published doc page from starter content fixtures.
 */
export function loadDocPage(
  slug: string,
  contentRoot = DEFAULT_CONTENT_ROOT,
): DocPageContent {
  const { records, failures } = loadStarterContentRecords(contentRoot);
  assertStarterContentValid(failures);

  const record = findPublishedDocRecord(records, slug);
  if (!record) {
    throw new Error(`Published doc page not found: ${slug}`);
  }

  const source = readDocSource(contentRoot, slug, record.canonicalLocale);
  const { body } = parseContentFile(source);

  return {
    record,
    title: record.navigationTitle,
    body: body.trim(),
  };
}
