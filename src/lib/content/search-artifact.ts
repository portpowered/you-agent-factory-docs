import type { LocalizedSearchDocument } from "@/lib/content/search-document";
import type { PublicContentKind } from "@/lib/content/types";

export const PUBLIC_SEARCH_ARTIFACT_VERSION = 1 as const;

/**
 * One searchable entry in the generated public search artifact. Later query
 * consumers read this contract instead of re-parsing raw content files.
 */
export type PublicSearchArtifactEntry = {
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

/**
 * Reviewer-verifiable generated public search artifact derived from normalized
 * localized search documents at build time.
 */
export type PublicSearchArtifact = {
  version: typeof PUBLIC_SEARCH_ARTIFACT_VERSION;
  entries: PublicSearchArtifactEntry[];
};

function projectArtifactEntry(
  document: LocalizedSearchDocument,
): PublicSearchArtifactEntry {
  const entry: PublicSearchArtifactEntry = {
    id: document.id,
    canonicalId: document.canonicalId,
    locale: document.locale,
    kind: document.kind,
    url: document.url,
    title: document.title,
    description: document.description,
    headings: [...document.headings],
    body: document.body,
    tags: [...document.tags],
    section: document.section,
    searchPriority: document.searchPriority,
  };

  if (document.aliases && document.aliases.length > 0) {
    entry.aliases = [...document.aliases];
  }

  return entry;
}

/**
 * Builds a deterministic public search artifact from normalized localized
 * search documents. Callers must supply documents from the search-document
 * generation path rather than a separate indexing-only parser.
 */
export function buildPublicSearchArtifact(
  documents: readonly LocalizedSearchDocument[],
): PublicSearchArtifact {
  const entries = documents
    .map(projectArtifactEntry)
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    version: PUBLIC_SEARCH_ARTIFACT_VERSION,
    entries,
  };
}

/** Serializes the artifact with stable JSON formatting for reviewer diffs. */
export function serializePublicSearchArtifact(
  artifact: PublicSearchArtifact,
): string {
  return `${JSON.stringify(artifact, null, 2)}\n`;
}
