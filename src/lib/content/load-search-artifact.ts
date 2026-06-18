import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadLocalizedSearchDocuments } from "@/lib/content/load-search-documents";
import { parsePublicSearchArtifact } from "@/lib/content/parse-public-search-artifact";
import {
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
