import { parseContentFile } from "@/lib/content/frontmatter";
import type { LocalizedContentVariantBinding } from "@/lib/content/localized-variant-identity";
import type { PublicContentKind } from "@/lib/content/types";

const DEFAULT_SEARCH_PRIORITY = 0;

/**
 * Normalized localized search document projected from one locale-specific
 * content variant. Downstream query code consumes this contract instead of
 * re-parsing raw content files.
 */
export type LocalizedSearchDocument = {
  id: string;
  canonicalId: string;
  locale: string;
  kind: PublicContentKind;
  url: string;
  title: string;
  description: string;
  headings: string[];
  body: string;
  tags: string[];
  aliases?: string[];
  section: string;
  searchPriority: number;
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  if (
    value.some((item) => typeof item !== "string" || item.trim().length === 0)
  ) {
    return undefined;
  }

  return value.map((item) => item.trim());
}

/** Stable search-document id for one canonical page locale variant. */
export function buildLocalizedSearchDocumentId(
  canonicalId: string,
  locale: string,
): string {
  return `${canonicalId}@${locale}`;
}

/** Extracts markdown heading text in document order. */
export function extractMarkdownHeadings(markdown: string): string[] {
  const headings: string[] = [];

  for (const line of markdown.replace(/\r\n/g, "\n").split("\n")) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line.trim());
    if (match) {
      headings.push(match[2].trim());
    }
  }

  return headings;
}

/** Projects searchable plain text from markdown body content. */
export function extractSearchableBody(markdown: string): string {
  const withoutCodeBlocks = markdown.replace(/```[\s\S]*?```/g, " ");
  const withoutInlineCode = withoutCodeBlocks.replace(/`([^`]+)`/g, "$1");
  const withoutLinks = withoutInlineCode.replace(
    /\[([^\]]+)\]\([^)]+\)/g,
    "$1",
  );
  const withoutImages = withoutLinks.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  const withoutHeadingMarkers = withoutImages.replace(/^#{1,6}\s+/gm, "");
  const withoutListMarkers = withoutHeadingMarkers.replace(
    /^\s*[-*+]\s+/gm,
    "",
  );

  return withoutListMarkers.replace(/\s+/g, " ").trim();
}

function resolveTitle(
  frontmatter: Record<string, unknown>,
  recordTitle: string,
): string {
  return asString(frontmatter.title) ?? recordTitle;
}

function resolveDescription(frontmatter: Record<string, unknown>): string {
  return asString(frontmatter.description) ?? "";
}

function resolveAliases(
  frontmatter: Record<string, unknown>,
): string[] | undefined {
  const aliases = asStringArray(frontmatter.aliases);
  return aliases && aliases.length > 0 ? aliases : undefined;
}

function resolveSearchPriority(recordPriority: number | undefined): number {
  return typeof recordPriority === "number"
    ? recordPriority
    : DEFAULT_SEARCH_PRIORITY;
}

/**
 * Projects one normalized localized search document from a validated variant
 * binding and the variant source file contents.
 */
export function projectLocalizedSearchDocument(
  binding: LocalizedContentVariantBinding,
  source: string,
): LocalizedSearchDocument {
  const { frontmatter, body } = parseContentFile(source);
  const { record, variantLocale } = binding;
  const headings = extractMarkdownHeadings(body);
  const searchableBody = extractSearchableBody(body);
  const aliases = resolveAliases(frontmatter);

  const document: LocalizedSearchDocument = {
    id: buildLocalizedSearchDocumentId(record.id, variantLocale),
    canonicalId: record.id,
    locale: variantLocale,
    kind: record.kind,
    url: record.routePath,
    title: resolveTitle(frontmatter, record.navigationTitle),
    description: resolveDescription(frontmatter),
    headings,
    body: searchableBody,
    tags: [...record.tags],
    section: record.section,
    searchPriority: resolveSearchPriority(record.searchPriority),
  };

  if (aliases) {
    document.aliases = aliases;
  }

  return document;
}

/**
 * Projects normalized localized search documents for each validated variant
 * binding. Callers provide source lookup so this function stays free of IO.
 */
export function generateLocalizedSearchDocuments(
  bindings: readonly LocalizedContentVariantBinding[],
  readVariantSource: (binding: LocalizedContentVariantBinding) => string,
): LocalizedSearchDocument[] {
  const documents = bindings.map((binding) =>
    projectLocalizedSearchDocument(binding, readVariantSource(binding)),
  );

  documents.sort((left, right) => left.id.localeCompare(right.id));
  return documents;
}
