import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadLocalizedSearchDocuments } from "@/lib/content/load-search-documents";
import {
  type PublicSearchArtifact,
  buildPublicSearchArtifact,
  serializePublicSearchArtifact,
} from "@/lib/content/search-artifact";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");
const DEFAULT_ARTIFACT_PATH = join(
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
  const outputPath = options.outputPath ?? DEFAULT_ARTIFACT_PATH;
  const artifact = loadPublicSearchArtifact(options);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serializePublicSearchArtifact(artifact), "utf8");

  return artifact;
}
