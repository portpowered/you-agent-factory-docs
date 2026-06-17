import {
  PUBLIC_SEARCH_ARTIFACT_VERSION,
  type PublicSearchArtifact,
  type PublicSearchArtifactEntry,
} from "@/lib/content/search-artifact";
import { withBasePath } from "@/lib/site";

const PUBLIC_SEARCH_ARTIFACT_URL = withBasePath(
  "/search/public-search-index.json",
);
const DEFAULT_RESULT_LIMIT = 8;

const FIELD_WEIGHTS = {
  title: 140,
  alias: 120,
  tag: 100,
  heading: 80,
  description: 56,
  body: 24,
} as const;

export type PublicSearchMatch = {
  entry: PublicSearchArtifactEntry;
  preview: string;
  score: number;
};

export type SearchPublicArtifactOptions = {
  limit?: number;
};

type FetchLike = typeof fetch;

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function tokenizeQuery(query: string): string[] {
  return normalizeSearchText(query)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function scoreFieldMatch(
  value: string,
  query: string,
  tokens: readonly string[],
  weight: number,
): number {
  const normalizedValue = normalizeSearchText(value);

  if (normalizedValue.length === 0) {
    return 0;
  }

  if (normalizedValue === query) {
    return weight * 2;
  }

  let score = normalizedValue.includes(query) ? weight : 0;

  for (const token of tokens) {
    if (normalizedValue.includes(token)) {
      score += Math.max(8, Math.floor(weight / 3));
    }
  }

  return score;
}

function scoreEntry(
  entry: PublicSearchArtifactEntry,
  query: string,
  tokens: readonly string[],
): number {
  let score = 0;

  score += scoreFieldMatch(entry.title, query, tokens, FIELD_WEIGHTS.title);
  score += scoreFieldMatch(
    entry.description,
    query,
    tokens,
    FIELD_WEIGHTS.description,
  );
  score += scoreFieldMatch(entry.body, query, tokens, FIELD_WEIGHTS.body);

  for (const heading of entry.headings) {
    score += scoreFieldMatch(heading, query, tokens, FIELD_WEIGHTS.heading);
  }

  for (const tag of entry.tags) {
    score += scoreFieldMatch(tag, query, tokens, FIELD_WEIGHTS.tag);
  }

  for (const alias of entry.aliases ?? []) {
    score += scoreFieldMatch(alias, query, tokens, FIELD_WEIGHTS.alias);
  }

  if (score === 0) {
    return 0;
  }

  return score + entry.searchPriority * 10;
}

function buildBodyPreview(body: string, query: string): string {
  const normalizedBody = normalizeSearchText(body);
  const matchIndex = normalizedBody.indexOf(query);

  if (matchIndex === -1) {
    return body.slice(0, 160).trim();
  }

  const previewStart = Math.max(0, matchIndex - 48);
  const previewEnd = Math.min(body.length, matchIndex + query.length + 96);
  const snippet = body.slice(previewStart, previewEnd).trim();

  if (previewStart === 0 && previewEnd === body.length) {
    return snippet;
  }

  return `${previewStart > 0 ? "..." : ""}${snippet}${previewEnd < body.length ? "..." : ""}`;
}

function buildPreview(
  entry: PublicSearchArtifactEntry,
  query: string,
  tokens: readonly string[],
): string {
  const matchesQuery = (value: string): boolean =>
    tokens.some((token) => normalizeSearchText(value).includes(token));

  if (entry.description.length > 0 && matchesQuery(entry.description)) {
    return entry.description;
  }

  const matchingHeading = entry.headings.find(matchesQuery);
  if (matchingHeading) {
    return matchingHeading;
  }

  if (entry.body.length > 0) {
    return buildBodyPreview(entry.body, query);
  }

  return entry.description || entry.title;
}

function isArtifactEntry(value: unknown): value is PublicSearchArtifactEntry {
  if (value == null || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PublicSearchArtifactEntry>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.canonicalId === "string" &&
    typeof candidate.locale === "string" &&
    typeof candidate.canonicalLocale === "string" &&
    Array.isArray(candidate.availableLocales) &&
    typeof candidate.kind === "string" &&
    typeof candidate.url === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    Array.isArray(candidate.headings) &&
    typeof candidate.body === "string" &&
    Array.isArray(candidate.tags) &&
    typeof candidate.section === "string" &&
    typeof candidate.searchPriority === "number"
  );
}

export function isPublicSearchArtifact(
  value: unknown,
): value is PublicSearchArtifact {
  if (value == null || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PublicSearchArtifact>;

  return (
    candidate.version === PUBLIC_SEARCH_ARTIFACT_VERSION &&
    Array.isArray(candidate.entries) &&
    candidate.entries.every(isArtifactEntry)
  );
}

export async function fetchPublicSearchArtifact(
  fetchImpl: FetchLike = fetch,
): Promise<PublicSearchArtifact> {
  const response = await fetchImpl(PUBLIC_SEARCH_ARTIFACT_URL, {
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error(
      `Public search artifact request failed with status ${response.status}`,
    );
  }

  const artifact = await response.json();

  if (!isPublicSearchArtifact(artifact)) {
    throw new Error("Public search artifact response shape is invalid");
  }

  return artifact;
}

export function searchPublicSearchArtifact(
  artifact: PublicSearchArtifact,
  query: string,
  options: SearchPublicArtifactOptions = {},
): PublicSearchMatch[] {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length === 0) {
    return [];
  }

  const tokens = tokenizeQuery(normalizedQuery);
  const limit = options.limit ?? DEFAULT_RESULT_LIMIT;

  return artifact.entries
    .map((entry) => {
      const score = scoreEntry(entry, normalizedQuery, tokens);

      if (score === 0) {
        return null;
      }

      return {
        entry,
        preview: buildPreview(entry, normalizedQuery, tokens),
        score,
      };
    })
    .filter((match): match is PublicSearchMatch => match !== null)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.entry.searchPriority !== left.entry.searchPriority) {
        return right.entry.searchPriority - left.entry.searchPriority;
      }

      return left.entry.id.localeCompare(right.entry.id);
    })
    .slice(0, limit);
}

export { PUBLIC_SEARCH_ARTIFACT_URL };
