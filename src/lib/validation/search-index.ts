import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadPublicSearchArtifact,
  serializePublicSearchArtifact,
} from "@/lib/content";

const DEFAULT_CONTENT_ROOT = join(process.cwd(), "src/content");
const DEFAULT_ARTIFACT_PATH = join(
  process.cwd(),
  "public/search/public-search-index.json",
);

export type SearchIndexValidationIssue = {
  field: "artifactPath" | "artifact";
  message: string;
};

export type SearchIndexValidationResult = {
  valid: boolean;
  issues: SearchIndexValidationIssue[];
};

export type SearchIndexValidationOptions = {
  contentRoot?: string;
  artifactPath?: string;
  checkedInArtifactSource?: string;
};

function readCheckedInArtifactSource(
  artifactPath: string,
  overrideSource: string | undefined,
): string | SearchIndexValidationIssue {
  if (typeof overrideSource === "string") {
    return overrideSource;
  }

  if (!existsSync(artifactPath)) {
    return {
      field: "artifactPath",
      message: `Checked-in search artifact is missing at ${artifactPath}. Run bun run generate:search-index and commit public/search/public-search-index.json.`,
    };
  }

  return readFileSync(artifactPath, "utf8");
}

/** Validates the checked-in public search artifact against generated output. */
export function validateSearchIndex(
  options: SearchIndexValidationOptions = {},
): SearchIndexValidationResult {
  const contentRoot = options.contentRoot ?? DEFAULT_CONTENT_ROOT;
  const artifactPath = options.artifactPath ?? DEFAULT_ARTIFACT_PATH;
  const checkedInArtifactSource = readCheckedInArtifactSource(
    artifactPath,
    options.checkedInArtifactSource,
  );

  if (typeof checkedInArtifactSource !== "string") {
    return { valid: false, issues: [checkedInArtifactSource] };
  }

  const generatedArtifact = loadPublicSearchArtifact({ contentRoot });
  const generatedSource = serializePublicSearchArtifact(generatedArtifact);

  if (checkedInArtifactSource !== generatedSource) {
    return {
      valid: false,
      issues: [
        {
          field: "artifact",
          message: `Checked-in search artifact at ${artifactPath} does not match generated artifact. Regenerate with bun run generate:search-index and review the diff.`,
        },
      ],
    };
  }

  return { valid: true, issues: [] };
}

/** Throws when the checked-in public search artifact contract regresses. */
export function assertValidSearchIndex(
  options: SearchIndexValidationOptions = {},
): void {
  const result = validateSearchIndex(options);
  if (result.valid) {
    return;
  }

  const details = result.issues
    .map((issue) => `${issue.field}: ${issue.message}`)
    .join("\n");

  throw new Error(`Search index validation failed:\n${details}`);
}
