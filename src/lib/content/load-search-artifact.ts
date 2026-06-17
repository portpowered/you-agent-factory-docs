import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadLocalizedSearchDocuments } from "@/lib/content/load-search-documents";
import {
  PUBLIC_SEARCH_ARTIFACT_VERSION,
  type PublicSearchArtifact,
  buildPublicSearchArtifact,
  serializePublicSearchArtifact,
} from "@/lib/content/search-artifact";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");
export const DEFAULT_PUBLIC_SEARCH_ARTIFACT_PATH = join(
  process.cwd(),
  "public/search/public-search-index.json",
);

export type LoadPublicSearchArtifactOptions = {
  contentRoot?: string;
};

export type WritePublicSearchArtifactOptions =
  LoadPublicSearchArtifactOptions & {
    outputPath?: string;
  };

export type LoadPublicSearchArtifactForValidationOptions =
  LoadPublicSearchArtifactOptions & {
    artifactPath?: string;
    defaultArtifactPath?: string;
  };

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

/**
 * Loads starter content, projects normalized localized search documents, and
 * builds the generated public search artifact from that search-data contract.
 */
export function loadPublicSearchArtifact(
  options: LoadPublicSearchArtifactOptions = {},
): PublicSearchArtifact {
  const contentRoot = options.contentRoot ?? DEFAULT_CONTENT_ROOT;
  const documents = loadLocalizedSearchDocuments(contentRoot);
  return buildPublicSearchArtifact(documents);
}

/**
 * Writes the generated public search artifact to disk for build-time and
 * reviewer inspection.
 */
export function writePublicSearchArtifact(
  options: WritePublicSearchArtifactOptions = {},
): PublicSearchArtifact {
  const outputPath = options.outputPath ?? DEFAULT_PUBLIC_SEARCH_ARTIFACT_PATH;
  const artifact = loadPublicSearchArtifact(options);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serializePublicSearchArtifact(artifact), "utf8");

  return artifact;
}

export function readCheckedInPublicSearchArtifact(
  artifactPath = DEFAULT_PUBLIC_SEARCH_ARTIFACT_PATH,
): PublicSearchArtifact {
  return parsePublicSearchArtifact(readFileSync(artifactPath, "utf8"));
}

/**
 * Validation prefers an existing generated artifact when available, but it
 * must also work from a clean checkout where the gitignored build artifact has
 * not been generated yet.
 */
export function loadPublicSearchArtifactForValidation(
  options: LoadPublicSearchArtifactForValidationOptions = {},
): PublicSearchArtifact {
  const explicitArtifactPath = options.artifactPath;

  if (explicitArtifactPath) {
    if (!existsSync(explicitArtifactPath)) {
      throw new Error(
        `Public search artifact not found at "${explicitArtifactPath}".`,
      );
    }

    return readCheckedInPublicSearchArtifact(explicitArtifactPath);
  }

  const defaultArtifactPath =
    options.defaultArtifactPath ?? DEFAULT_PUBLIC_SEARCH_ARTIFACT_PATH;

  if (existsSync(defaultArtifactPath)) {
    return readCheckedInPublicSearchArtifact(defaultArtifactPath);
  }

  return loadPublicSearchArtifact({
    contentRoot: options.contentRoot,
  });
}
