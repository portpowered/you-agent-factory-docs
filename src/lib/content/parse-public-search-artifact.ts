import {
  PUBLIC_SEARCH_ARTIFACT_VERSION,
  type PublicSearchArtifact,
} from "@/lib/content/search-artifact";

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

export function parsePublicSearchArtifact(json: string): PublicSearchArtifact {
  const parsed = JSON.parse(json) as Record<string, unknown>;

  if (parsed.version !== PUBLIC_SEARCH_ARTIFACT_VERSION) {
    throw new Error(
      `Public search artifact must declare version ${PUBLIC_SEARCH_ARTIFACT_VERSION}.`,
    );
  }

  if (!Array.isArray(parsed.entries)) {
    throw new Error('Public search artifact must include an "entries" array.');
  }

  return {
    version: PUBLIC_SEARCH_ARTIFACT_VERSION,
    entries: parsed.entries.map((entry, index) => {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        throw new Error(`Public search artifact entry ${index} is malformed.`);
      }

      const candidate = entry as Record<string, unknown>;
      const requiredStringFields = [
        "id",
        "canonicalId",
        "locale",
        "canonicalLocale",
        "kind",
        "url",
        "title",
        "description",
        "body",
        "section",
      ] as const;

      for (const field of requiredStringFields) {
        if (typeof candidate[field] !== "string") {
          throw new Error(
            `Public search artifact entry ${index} is missing string field "${field}".`,
          );
        }
      }

      if (!isStringArray(candidate.availableLocales)) {
        throw new Error(
          `Public search artifact entry ${index} has invalid "availableLocales".`,
        );
      }

      if (!isStringArray(candidate.headings)) {
        throw new Error(
          `Public search artifact entry ${index} has invalid "headings".`,
        );
      }

      if (!isStringArray(candidate.tags)) {
        throw new Error(
          `Public search artifact entry ${index} has invalid "tags".`,
        );
      }

      if (
        candidate.aliases !== undefined &&
        !isStringArray(candidate.aliases)
      ) {
        throw new Error(
          `Public search artifact entry ${index} has invalid "aliases".`,
        );
      }

      if (typeof candidate.searchPriority !== "number") {
        throw new Error(
          `Public search artifact entry ${index} is missing numeric field "searchPriority".`,
        );
      }

      return {
        id: candidate.id as string,
        canonicalId: candidate.canonicalId as string,
        locale: candidate.locale as string,
        canonicalLocale: candidate.canonicalLocale as string,
        availableLocales: candidate.availableLocales,
        kind: candidate.kind as PublicSearchArtifact["entries"][number]["kind"],
        url: candidate.url as string,
        title: candidate.title as string,
        description: candidate.description as string,
        headings: candidate.headings,
        body: candidate.body as string,
        tags: candidate.tags,
        section: candidate.section as string,
        searchPriority: candidate.searchPriority,
        ...(candidate.aliases ? { aliases: candidate.aliases } : {}),
      };
    }),
  };
}
