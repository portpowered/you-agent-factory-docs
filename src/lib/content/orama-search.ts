import type {
  PublicSearchArtifact,
  PublicSearchArtifactEntry,
} from "@/lib/content/search-artifact";
import { create, insertMultiple, search } from "@orama/orama";

const PUBLIC_SEARCH_ORAMA_SCHEMA = {
  id: "string",
  canonicalId: "string",
  locale: "string",
  canonicalLocale: "string",
  availableLocales: "string[]",
  kind: "string",
  url: "string",
  title: "string",
  description: "string",
  headings: "string[]",
  body: "string",
  tags: "string[]",
  aliases: "string[]",
  section: "string",
  searchPriority: "number",
} as const;

const PUBLIC_SEARCH_ORAMA_PROPERTIES = [
  "title",
  "description",
  "headings",
  "body",
  "tags",
  "aliases",
  "section",
] as const;

const PUBLIC_SEARCH_ORAMA_BOOST = {
  title: 4,
  headings: 3,
  aliases: 3,
  tags: 2,
  description: 2,
  body: 1,
  section: 1,
} as const;

type OramaPublicSearchDocument = PublicSearchArtifactEntry & {
  availableLocales: string[];
  headings: string[];
  tags: string[];
  aliases: string[];
};

function createPublicSearchOramaDatabase() {
  return create({
    schema: PUBLIC_SEARCH_ORAMA_SCHEMA,
  });
}

export type PublicSearchOramaDatabase = ReturnType<
  typeof createPublicSearchOramaDatabase
>;

export type PublicSearchOramaIndex = {
  artifactVersion: PublicSearchArtifact["version"];
  documentCount: number;
  database: PublicSearchOramaDatabase;
};

export type SearchPublicSearchOramaIndexOptions = {
  term: string;
  locale?: string;
  limit?: number;
  exact?: boolean;
};

export type PublicSearchOramaHit = {
  id: string;
  score: number;
  entry: PublicSearchArtifactEntry;
};

export type PublicSearchOramaSearchResult = {
  count: number;
  hits: PublicSearchOramaHit[];
};

function projectOramaDocument(
  entry: PublicSearchArtifactEntry,
): OramaPublicSearchDocument {
  return {
    ...entry,
    availableLocales: [...entry.availableLocales],
    headings: [...entry.headings],
    tags: [...entry.tags],
    aliases: entry.aliases ? [...entry.aliases] : [],
  };
}

function projectArtifactEntry(
  document: OramaPublicSearchDocument,
): PublicSearchArtifactEntry {
  return {
    id: document.id,
    canonicalId: document.canonicalId,
    locale: document.locale,
    canonicalLocale: document.canonicalLocale,
    availableLocales: [...document.availableLocales],
    kind: document.kind as PublicSearchArtifactEntry["kind"],
    url: document.url,
    title: document.title,
    description: document.description,
    headings: [...document.headings],
    body: document.body,
    tags: [...document.tags],
    section: document.section,
    searchPriority: document.searchPriority,
    ...(document.aliases.length > 0 ? { aliases: [...document.aliases] } : {}),
  };
}

/**
 * Builds the Orama-backed query index from the checked-in public search
 * artifact contract. Later public search consumers should use this seam
 * instead of re-parsing content or inventing a parallel query structure.
 */
export async function createPublicSearchOramaIndex(
  artifact: PublicSearchArtifact,
): Promise<PublicSearchOramaIndex> {
  const database = createPublicSearchOramaDatabase();
  const documents = artifact.entries.map(projectOramaDocument);

  await Promise.resolve(insertMultiple(database, documents));

  return {
    artifactVersion: artifact.version,
    documentCount: documents.length,
    database,
  };
}

export async function searchPublicSearchOramaIndex(
  index: PublicSearchOramaIndex,
  options: SearchPublicSearchOramaIndexOptions,
): Promise<PublicSearchOramaSearchResult> {
  const trimmedTerm = options.term.trim();

  if (trimmedTerm.length === 0) {
    return {
      count: 0,
      hits: [],
    };
  }

  const result = await Promise.resolve(
    search(index.database, {
      term: trimmedTerm,
      exact: options.exact,
      limit: options.limit,
      properties: [...PUBLIC_SEARCH_ORAMA_PROPERTIES],
      boost: PUBLIC_SEARCH_ORAMA_BOOST,
      ...(options.locale ? { where: { locale: options.locale } } : {}),
    }),
  );

  return {
    count: result.count,
    hits: result.hits.map((hit) => ({
      id: String(hit.id),
      score: hit.score,
      entry: projectArtifactEntry(hit.document as OramaPublicSearchDocument),
    })),
  };
}
